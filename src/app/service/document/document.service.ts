import { Injectable, isDevMode } from '@angular/core';

import 'rxjs/add/operator/toPromise';

import { HttpProviderService, PullActionProtocol, Conflict, isConflict } from '@testeditor/testeditor-commons';
import { DocumentServiceConfig } from '../../service/document/document.service.config';
import { HttpClient } from '@angular/common/http';
import { FilesChangedPayload, FilesBackedupPayload, FILES_CHANGED, FILES_BACKEDUP } from 'app/editor-tabs/event-types';
import { TabInformer } from 'app/editor-tabs/editor-tabs.component';
import { SNACKBAR_DISPLAY_NOTIFICATION } from 'app/snack-bar/snack-bar-event-types';
import { MessagingService } from '@testeditor/messaging-service';

export const HTTP_HEADER_CONTENT_LOCATION = 'content-location';
export const HTTP_STATUS_CONFLICT = 409;

@Injectable()
export class DocumentService {

  private serviceUrl: string;

  constructor(config: DocumentServiceConfig, private httpProvider: HttpProviderService, private messagingService: MessagingService) {
    this.serviceUrl = config.persistenceServiceUrl;
  }

  async loadDocument(tabInformer: TabInformer, path: string): Promise<string> {
    this.log('load document');
    const url = `${this.serviceUrl}/documents/${path}?clean=true`;
    const result = await this.wrapActionInPulls(
      tabInformer,
      async (client) => (await client.get(url, { responseType: 'text', observe: 'response' }).toPromise()).body, []);
    if (isConflict(result)) {
      throw new Error('conflict during load ' + result.message);
    } else {
      return result;
    }
  }

  async saveDocument(tabInformer: TabInformer, path: string, content: string): Promise<string | Conflict> {
    this.log('save document');
    const url = `${this.serviceUrl}/documents/${path}?clean=true`;
    const result = await this.wrapActionInPulls(
      tabInformer,
      async (client) => (await client.put(url, content, { observe: 'response', responseType: 'text' }).toPromise()).body, [path]);
    return result;
  }

  private async wrapActionInPulls<T>(tabInformer: TabInformer, action: (client: HttpClient) => Promise<T | Conflict>,
                                     criticalFilesOfInterest: string[]): Promise<T | Conflict> {
    this.log('wrap action in pulls');
    const PULL_MAX_RETRY_COUNT = 20;
    const pullActionProtocol = new PullActionProtocol(this.httpProvider, this.serviceUrl, action, await tabInformer.getNonDirtyTabs(),
                                                      await tabInformer.getDirtyTabs(), criticalFilesOfInterest);
    let retryCount = 0;
    while (pullActionProtocol.executionPossible() && retryCount < PULL_MAX_RETRY_COUNT) {
      this.log('pull action protocol execute');
      await pullActionProtocol.execute();
      retryCount++;
    }
    if (retryCount >= PULL_MAX_RETRY_COUNT) {
      console.error(`aborted after ${retryCount} retries`);
      throw new Error(`pull retry timeout after ${retryCount} retries`);
    } else {
      await this.informPullChanges(tabInformer, Array.from(pullActionProtocol.changedResourcesSet), pullActionProtocol.backedUpResourcesSet.toArray());
      if (pullActionProtocol.result instanceof Error) {
        throw pullActionProtocol.result;
      }
      return pullActionProtocol.result;
    }
  }

  private async informPullChanges(tabInformer: TabInformer, changedResources: FilesChangedPayload, backedUpResources: FilesBackedupPayload): Promise<void> {
    this.log('inform about pull changes (if any) with changedResources:', changedResources);
    this.log('..and backedUpResources:', backedUpResources);
    const shortMessage = 'File(s) changed in your workspace, please check your open tabs!';
    if (changedResources.length > 0) {
      this.log('backup resources present after action: ', changedResources);
      // editor will reload, inform user about this
      for (const document of changedResources) {
        await tabInformer.handleFileChange(document);
      }
    }
    if (backedUpResources.length > 0) {
      this.log('backup resources present after action: ', backedUpResources);
      // editor will replace resource with backup (name, not content),
      // test-navigator must update tree with additional backup file! inform user about that
      for (const backup of backedUpResources) {
        tabInformer.handleBackupEntry(backup);
      }
    }
    if (changedResources.length + backedUpResources.length > 0) {
      this.messagingService.publish(
        SNACKBAR_DISPLAY_NOTIFICATION,
        { message: shortMessage,
          timeout: 15000
         });
    }
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
