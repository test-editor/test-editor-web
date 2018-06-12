import { Component, isDevMode, OnInit, OnDestroy } from '@angular/core';
import { MessagingService, Message } from '@testeditor/messaging-service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Subscription } from 'rxjs/Subscription';
import { NAVIGATION_CLOSE, EDITOR_SAVE_COMPLETED } from './editor-tabs/event-types';
import { HttpClientPayload, HTTP_CLIENT_NEEDED, HTTP_CLIENT_SUPPLIED } from './app-event-types';
import {
  TEST_EXECUTION_START_FAILED, TEST_EXECUTION_STARTED, TEST_EXECUTE_REQUEST,
  WORKSPACE_MARKER_OBSERVE, WORKSPACE_MARKER_UPDATE, WORKSPACE_RELOAD_RESPONSE, WORKSPACE_RELOAD_REQUEST,
  PersistenceService, WorkspaceElement, MarkerObserver
} from '@testeditor/workspace-navigator';
import { ValidationMarkerService } from './service/validation/validation.marker.service';
import { IndexService } from './service/index/index.service';
import { TestExecutionService, TestExecutionStatus } from './service/execution/test.execution.service';
import { TestExecutionState } from './service/execution/test.execution.state';
import { HttpClient } from '@angular/common/http';

const TEST_EXECUTION_FINISHED = 'test.execution.finished';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy {

  title = 'test-editor-web';
  isAuthorizedSubscription: Subscription;
  isAuthorized: boolean;
  hasToken: boolean;
  userDataSubscription: Subscription;
  user: String;
  fileSavedSubscription: Subscription;
  httpClientSubscription: Subscription;


  constructor(private messagingService: MessagingService,
    public oidcSecurityService: OidcSecurityService,
    private persistenceService: PersistenceService,
    private validationMarkerService: ValidationMarkerService,
    private indexService: IndexService,
    private testExecutionService: TestExecutionService,
    private httpClient: HttpClient) {
    if (isDevMode()) {
      // log all received events in development mode
      messagingService.subscribeAll((message: Message) => {
        console.log(`Received message of type: ${message.type}`, message);
      });
    }
    if (this.oidcSecurityService.moduleSetup) {
      this.onOidcModuleSetup();
    } else {
      this.oidcSecurityService.onModuleSetup.subscribe(() => {
        this.onOidcModuleSetup();
      });
    }

    this.setupWorkspaceReloadResponse();
    this.setupTestExecutionListener();
    this.setupRepoChangeListeners();
    this.setupHttpClientListener();
  }

  ngOnInit() {
    this.isAuthorizedSubscription = this.oidcSecurityService.getIsAuthorized().subscribe(
      (isAuthorized: boolean) => {
        this.isAuthorized = isAuthorized;
      });
    this.userDataSubscription = this.oidcSecurityService.getUserData().subscribe((userData: any) => {
      if (userData && userData !== '') {
        this.user = userData.name;
        const idToken = this.oidcSecurityService.getIdToken();
        if (idToken !== '') {
          this.hasToken = true;
          // this makes sure that xtext services can provide the token, too
          // since the xtext services do not make use of the intercepted HttpClient
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
    this.httpClientSubscription.unsubscribe();
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
  }

  private onOidcModuleSetup() {
    if (window.location.hash) {
      console.log('start authorized callback');
      this.oidcSecurityService.authorizedCallback();
    }
  }

  private setupWorkspaceReloadResponse(): void {
    this.messagingService.subscribe(WORKSPACE_RELOAD_REQUEST, (payload) => {
      if (payload && payload.rebuild) {
        this.reloadWorkspace();
      } else {
        this.refreshIndex();
      }
    });
  }

  private updateValidationMarkers(root: WorkspaceElement): void {
    this.validationMarkerService.getAllMarkerSummaries(root).then((summaries) => {
      console.log(JSON.stringify(summaries));
      return this.messagingService.publish(WORKSPACE_MARKER_UPDATE, summaries.map((summary) => (
        { path: summary.path, markers: { validation: { errors: summary.errors, warnings: summary.warnings, infos: summary.infos } } }
      )));
    });
  }

  /**
   * listen to test execution request events and start the respective test,
   * sending an event that test execution was started and installing an observer
   * for the update to the test execution status
   */
  private setupTestExecutionListener(): void {
    this.messagingService.subscribe(TEST_EXECUTE_REQUEST, (payload) => {
      this.testExecutionService.execute(payload).then((response) => {
        this.messagingService.publish(TEST_EXECUTION_STARTED, {
          path: payload,
          response: response,
          message: 'Execution of "\${}" has been started.'
        });
        this.messagingService.publish(WORKSPACE_MARKER_OBSERVE, this.testExecutionStatusObserver(payload));
      }).catch((reason) => {
        this.messagingService.publish(TEST_EXECUTION_START_FAILED, {
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
      stopOn: (value) => {
        const stopped = value.status !== TestExecutionState.Running;
        if (stopped) {
          console.log('send test execution finished event.');
          this.messagingService.publish(TEST_EXECUTION_FINISHED, value);
          this.messagingService.publish(WORKSPACE_RELOAD_REQUEST, null);
        }
        return stopped;
      }
    };
  }

  /**
   * listen to events that changed the repository (currently only editor save completed events)
   * inform index to refresh itself
   */
  private setupRepoChangeListeners(): void {
    this.fileSavedSubscription = this.messagingService.subscribe(EDITOR_SAVE_COMPLETED, (payload) => {
      this.refreshIndex();
    });
  }

  private refreshAfterIndexUpdate () {
    this.persistenceService.listFiles((root: WorkspaceElement) => {
      this.messagingService.publish(WORKSPACE_RELOAD_RESPONSE, root);
      this.updateValidationMarkers(root);
    });
  }

  private reloadWorkspace(): void {
    this.indexService.reload().then(() => { this.refreshAfterIndexUpdate(); });
  }

  private refreshIndex(): void {
    this.indexService.refresh().then(() => { this.refreshAfterIndexUpdate(); });
  }

  private setupHttpClientListener(): void {
    this.httpClientSubscription = this.messagingService.subscribe(HTTP_CLIENT_NEEDED, () => {
      const payload: HttpClientPayload =  { httpClient: this.httpClient };
      this.messagingService.publish(HTTP_CLIENT_SUPPLIED, payload);
    });
  }

}
