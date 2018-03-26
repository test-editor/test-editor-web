import { Component, OnInit, isDevMode } from '@angular/core';
import { MessagingService, Message } from '@testeditor/messaging-service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Subscription } from 'rxjs/Subscription';
import { NAVIGATION_CLOSE, EDITOR_SAVE_COMPLETED } from './editor-tabs/event-types';

import * as events from '@testeditor/workspace-navigator';
import { PersistenceService, WorkspaceElement } from '@testeditor/workspace-navigator';
import { ValidationMarkerService } from 'service/validation/validation.marker.service';
import { IndexService } from '../service/index/index.service';
import { DocumentService } from 'service/document/document.service';
import { TestExecutionService, TestExecutionStatus } from 'service/execution/test.execution.service';
import { MarkerObserver } from '@testeditor/workspace-navigator/src/common/markers/marker.observer';
import { TestExecutionState } from '../service/execution/test.execution.state';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  TEST_EXECUTE_REQUEST = 'test.execute.request'; // TODO: copied from workspace navigator, please delete (asap)
  TEST_EXECUTION_STARTED = 'test.execution.started'; // TODO: copied from workspace navigator, please delete (asap)
  TEST_EXECUTION_START_FAILED = 'test.execution.start.failed'; // TODO: copied from workspace navigator, please delete (asap)

  title = 'test-editor-web';
  isAuthorizedSubscription: Subscription;
  isAuthorized: boolean;
  hasToken: boolean;
  userDataSubscription: Subscription;
  user: String;
  fileSavedSubscription: Subscription;


  constructor(private messagingService: MessagingService,
    public oidcSecurityService: OidcSecurityService,
    private persistenceService: PersistenceService,
    private validationMarkerService: ValidationMarkerService,
    private documentService: DocumentService,
    private indexService: IndexService,
    private testExecutionService: TestExecutionService) {
    if (isDevMode()) {
      // log all received events in development mode
      messagingService.subscribeAll((message: Message) => {
        console.log(`Received message of type: ${message.type}`, message);
      });
    }
    if (this.oidcSecurityService.moduleSetup) {
      this.doCallbackLogicIfRequired();
    } else {
      this.oidcSecurityService.onModuleSetup.subscribe(() => {
        this.doCallbackLogicIfRequired();
      });
    }
    this.setupWorkspaceReloadResponse();
    this.setupTestExecutionListener();
  }

  ngOnInit() {
    this.isAuthorizedSubscription = this.oidcSecurityService.getIsAuthorized().subscribe(
      (isAuthorized: boolean) => {
        this.isAuthorized = isAuthorized;
      });
    this.fileSavedSubscription = this.messagingService.subscribe(EDITOR_SAVE_COMPLETED, () => {
      this.refreshIndex();
    });
    this.userDataSubscription = this.oidcSecurityService.getUserData().subscribe(
      (userData: any) => {
        if (userData && userData != '') {
          this.user = userData.name;
          let idToken = this.oidcSecurityService.getIdToken();
          if (idToken !== '') {
            this.hasToken = true
            sessionStorage.setItem('token', idToken);
            if (isDevMode()) {
              console.log('idToken ');
              console.log(idToken);
            }
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.userDataSubscription.unsubscribe();
    this.isAuthorizedSubscription.unsubscribe();
    this.oidcSecurityService.onModuleSetup.unsubscribe();
    this.fileSavedSubscription.unsubscribe();
  }

  login() {
    console.log('start login');
    this.oidcSecurityService.authorize();
  }

  refreshSession() {
    console.log('start refreshSession');
    this.oidcSecurityService.authorize();
  }

  logout() {
    console.log('start logout');
    this.messagingService.publish(NAVIGATION_CLOSE, null);
    this.oidcSecurityService.logoff();
    this.user = null;
    localStorage.removeItem('token');
  }

  private doCallbackLogicIfRequired() {
    if (window.location.hash) {
      console.log('start authorized callback');
      this.oidcSecurityService.authorizedCallback();
    }
  }

  private setupWorkspaceReloadResponse(): void {
    this.messagingService.subscribe(events.WORKSPACE_RELOAD_REQUEST, () => {
      this.persistenceService.listFiles().then((root: WorkspaceElement) => {
        this.messagingService.publish(events.WORKSPACE_RELOAD_RESPONSE, root);
        this.updateValidationMarkers(root);
      });
    });
  }

  private updateValidationMarkers(root: WorkspaceElement): void {
    this.validationMarkerService.getAllMarkerSummaries(root).then((summaries) => {
      console.log(JSON.stringify(summaries));
      return this.messagingService.publish(events.WORKSPACE_MARKER_UPDATE, summaries.map((summary) => (
        { path: summary.path, markers: { validation: { errors: summary.errors, warnings: summary.warnings, infos: summary.infos } } }
      )))
    });
  }

  /**
   * listen to test execution request events and start the respective test,
   * sending an event that test execution was started and installing an observer
   * for the update to the test execution status
   */
  private setupTestExecutionListener(): void {
    this.messagingService.subscribe(this.TEST_EXECUTE_REQUEST, (payload) => {
      this.testExecutionService.execute(payload).then((response) => {
        this.messagingService.publish(this.TEST_EXECUTION_STARTED, {
          path: payload,
          response: response,
          message: 'Execution of "\${}" has been started.'
        })
        this.messagingService.publish(events.WORKSPACE_MARKER_OBSERVE, this.testExecutionStatusObserver(payload));
      }).catch((reason) => {
        this.messagingService.publish(this.TEST_EXECUTION_START_FAILED, {
          path: payload,
          reason: reason,
          message: 'The test "\${}" could not be started.'
        });
      });
    });
  }

  private testExecutionStatusObserver(path: string): MarkerObserver<TestExecutionStatus> {
    return {
      path: path,
      field: 'testStatus',
      observe: () => this.testExecutionService.getStatus(path),
      stopOn: (value) => value.status !== TestExecutionState.Running
    }
  }

  refreshIndex(): void {
    this.indexService.refresh();
  }

}
