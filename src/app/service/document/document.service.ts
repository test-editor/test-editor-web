import { Injectable, isDevMode } from '@angular/core';

import 'rxjs/add/operator/toPromise';

import { HttpProviderService } from '@testeditor/testeditor-commons';
import { DocumentServiceConfig } from '../../service/document/document.service.config';
import { Conflict } from '../../service/document/conflict';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BackupEntry, FilesChangedPayload, FilesBackedupPayload, FILES_CHANGED, FILES_BACKEDUP } from 'app/editor-tabs/event-types';
import { PullResponse } from '../../../../../web-test-navigator/dist/src/app/modules/persistence-service/persistence.service';
import { TabInformer } from 'app/editor-tabs/editor-tabs.component';
import { SNACKBAR_DISPLAY_NOTIFICATION } from 'app/snack-bar/snack-bar-event-types';
import { MessagingService } from '@testeditor/messaging-service';


export const HTTP_STATUS_NO_CONTENT = 204;
export const HTTP_STATUS_CONFLICT = 409;
export const HTTP_HEADER_CONTENT_LOCATION = 'content-location';
@Injectable()
export class DocumentService {

  private serviceUrl: string;

  constructor(config: DocumentServiceConfig, private httpProvider: HttpProviderService, private messagingService: MessagingService) {
    this.serviceUrl = config.persistenceServiceUrl;
  }

  // TODO: wrap into pull wrapper
  async loadDocument(path: string): Promise<string> {
    const url = `${this.serviceUrl}/documents/${path}`;
    const httpClient = await this.httpProvider.getHttpClient();
    return (await httpClient.get(url, { responseType: 'text', observe: 'response' }).toPromise()).body;
  }

  // TODO: wrap into pull wrapper
  async saveDocument(path: string, content: string): Promise<void | Conflict> {
    const url = `${this.serviceUrl}/documents/${path}`;
    const httpClient = await this.httpProvider.getHttpClient();
    try {
      await httpClient.put(url, content, { observe: 'response', responseType: 'text' }).toPromise();
      return;
    } catch (error) {
      if (error.status === HTTP_STATUS_CONFLICT) {
        const keys = error.headers.keys();
        keys.map(key => error.log(`${key}: ${error.headers.get(key)}`));
        let backupFilePath: string = null;
        if (error.headers.has(HTTP_HEADER_CONTENT_LOCATION)) {
          backupFilePath = error.headers.get(HTTP_HEADER_CONTENT_LOCATION);
        }

        return new Conflict(error.error, backupFilePath);
      } else {
        Observable.throw(new Error(error.error));
      }
    }
  }

  private isRepullConflict(response: any): boolean {
    if (this.isHttpErrorResponse(response)) {
      if (response.status === HTTP_STATUS_CONFLICT) {
        if (response.error === 'REPULL') {
          return true;
        }
      }
    }
    return false;
  }

  /** wrap the given async funnction in a pull loop that will pull as long as the backend requests pulls
      before the backend actually executes the expected function */
  private async wrapActionInPulls<T>(tabInformer: TabInformer,
                                     action: (client: HttpClient) => Promise<T | Conflict>): Promise<T | Conflict> {
    const client = await this.httpProvider.getHttpClient();
    let result: T | Conflict;
    let executePullAgain = true;
    let changedResources = new Array<string>();
    let  backedUpResources = new Array<BackupEntry>();
    while (executePullAgain) {
      executePullAgain = false;
      const pullResponse = await this.executePull(tabInformer, client);
      if (!pullResponse.failure) {
        this.log('received pull response:', pullResponse);
        changedResources = changedResources.concat(pullResponse.changedResources);
        backedUpResources = backedUpResources.concat(pullResponse.backedUpResources);
        try {
          this.log('executing action');
          result = await action(client);
        } catch (errorResponse) {
          this.log('WARNING: got error on copy');
          this.log(errorResponse);
          if (this.isRepullConflict(errorResponse)) {
            this.log('info: execute pull again');
            executePullAgain = true;
          } else {
            this.informPullChanges(changedResources, backedUpResources);
            return this.getConflictOrThrowError(errorResponse);
          }
        }
      } else {
        console.error('unexpected error during pull, pullresponse:', pullResponse);
        this.informPullChanges(changedResources, backedUpResources);
        throw new Error('pull failure');
      }
    }
    this.informPullChanges(changedResources, backedUpResources);
    return result;
  }

  private informPullChanges(changedResources: FilesChangedPayload, backedUpResources: FilesBackedupPayload): void {
    this.log('inform about pull changes (if any) with changedResources:', changedResources);
    this.log('..and backedUpResources:', backedUpResources);
    const shortMessage = (changedResources.length + backedUpResources.length)
      + 'File(s) changed in your workspace, please check your open tabs!';
    if (changedResources.length > 0) {
      // editor will reload, inform user about this
      this.messagingService.publish(FILES_CHANGED, changedResources);
    }
    if (backedUpResources.length > 0) {
      // editor will replace resource with backup (name, not content),
      // test-navigator must update tree with additional backup file! inform user about that
      this.messagingService.publish(FILES_BACKEDUP, backedUpResources);
    }
    if (changedResources.length + backedUpResources.length > 0) {
      this.messagingService.publish(
        SNACKBAR_DISPLAY_NOTIFICATION,
        { message: shortMessage,
          timeout: 15000
        });
    }
  }

  private isHttpErrorResponse(response: HttpErrorResponse | any): response is HttpErrorResponse {
    return (<HttpErrorResponse>response).status !== undefined && (<HttpErrorResponse>response).error !== undefined;
  }

  private getConflictOrThrowError(errorResponse: HttpErrorResponse | any): Conflict {
    if (this.isHttpErrorResponse(errorResponse)) {
      if (errorResponse.status === HTTP_STATUS_CONFLICT) {
        return new Conflict(errorResponse.error);
      } else {
        throw new Error(errorResponse.error);
      }
    } else {
      throw errorResponse;
    }
  }

  private async executePull(tabInformer: TabInformer, httpClient?: HttpClient): Promise<PullResponse> {
    const client = httpClient ? httpClient : await this.httpProvider.getHttpClient();
    try {
      this.log('executing pull with resources:', tabInformer.getNonDirtyTabs());
      this.log('..and dirtyResources:', tabInformer.getDirtyTabs());
      return (await client.post(this.getPullURL(),
                                { resources: tabInformer.getNonDirtyTabs(), dirtyResources: tabInformer.getDirtyTabs() },
                                { observe: 'response', responseType: 'json' }).toPromise()).body as PullResponse;
    } catch (errorResponse) {
      // TODO: pull must always work, otherwise the local workspace is in deep trouble
      console.error('could not execute pull', errorResponse);
    }
  }

  private getPullURL(): string {
    return `${this.serviceUrl}/workspace/pull`;
  }

  private log(msg: String, ...payloads: any[]) {
    if (isDevMode()) {
      console.log('TestEditorWeb.DocumentService: ' + msg);
      if (payloads) {
        payloads.forEach((payload) => console.log(payload));
      }
    }
  }

}
