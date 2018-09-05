import { Component, isDevMode, OnInit, OnDestroy } from '@angular/core';
import { MessagingService, Message } from '@testeditor/messaging-service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Subscription } from 'rxjs/Subscription';
import { NAVIGATION_CLOSE, EDITOR_SAVE_COMPLETED } from './editor-tabs/event-types';
import { HttpClientPayload, HTTP_CLIENT_NEEDED, HTTP_CLIENT_SUPPLIED } from './app-event-types';
import { WORKSPACE_RELOAD_RESPONSE, PersistenceService } from '@testeditor/test-navigator';
import { IndexService } from './service/index/index.service';
import { HttpClient } from '@angular/common/http';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { SNACKBAR_DISPLAY_NOTIFICATION } from './snack-bar/snack-bar-event-types';

export const WORKSPACE_LOAD_RETRY_COUNT = 3;

const WORKSPACE_RELOAD_REQUEST = 'workspace.reload.request';

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
    private spinnerService: Ng4LoadingSpinnerService,
    private persistenceService: PersistenceService,
    // private validationMarkerService: ValidationMarkerService,
    private indexService: IndexService,
    // private testExecutionService: TestExecutionService,
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
    // this.setupTestExecutionListener();
    this.setupRepoChangeListeners();
    this.setupHttpClientListener();
  }

  ngOnInit() {
    this.isAuthorizedSubscription = this.oidcSecurityService.getIsAuthorized().subscribe(
      (isAuthorized: boolean) => {
        this.isAuthorized = isAuthorized;
        this.spinnerService.show();
        if (isDevMode()) {
          console.log('spinner turned on');
        }
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

  /**
   * listen to events that changed the repository (currently only editor save completed events)
   * inform index to refresh itself
   */
  private setupRepoChangeListeners(): void {
    this.fileSavedSubscription = this.messagingService.subscribe(EDITOR_SAVE_COMPLETED, (payload) => {
      this.refreshIndex();
    });
  }

  private async refreshAfterIndexUpdate (retryCount: number) {
    try {
      const root = await this.persistenceService.listFiles();
      this.spinnerService.hide();
      if (isDevMode()) {
        console.log('spinner turned off');
      }
      this.messagingService.publish(WORKSPACE_RELOAD_RESPONSE, root);
      // this.updateValidationMarkers(root);
      // TODO: make sure that test navigator does that in response to WORKSPACE_RELOAD_RESPONSE
    } catch (error) {
      // TODO: prevent errors! keep connection to backend, as long as the list files service is running (in the backend) show the spinner!
      if (retryCount > 0) {
        if (isDevMode()) {
          console.log('retry (re)load of workspace after failure');
        }
        this.refreshAfterIndexUpdate(retryCount - 1);
      } else {
        this.spinnerService.hide();
        this.messagingService.publish(SNACKBAR_DISPLAY_NOTIFICATION, { message: 'Loading workspace timed out!', timeout: 15000 });
        if (isDevMode()) {
          console.log('spinner turned off');
          console.error('failed to load workspace');
        }
      }
    }
  }

  private reloadWorkspace(): void {
    this.indexService.reload().then(() => { this.refreshAfterIndexUpdate(WORKSPACE_LOAD_RETRY_COUNT); });
  }

  private refreshIndex(): void {
    this.indexService.refresh().then(() => { this.refreshAfterIndexUpdate(WORKSPACE_LOAD_RETRY_COUNT); });
  }

  private setupHttpClientListener(): void {
    this.httpClientSubscription = this.messagingService.subscribe(HTTP_CLIENT_NEEDED, () => {
      const payload: HttpClientPayload =  { httpClient: this.httpClient };
      this.messagingService.publish(HTTP_CLIENT_SUPPLIED, payload);
    });
  }

}
