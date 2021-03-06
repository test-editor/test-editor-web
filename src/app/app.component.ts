import { HttpClient } from '@angular/common/http';
import { Component, isDevMode, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Message, MessagingService } from '@testeditor/messaging-service';
import { WORKSPACE_RETRIEVED, WORKSPACE_RETRIEVED_FAILED } from '@testeditor/test-navigator';
import { UserActivityService } from '@testeditor/user-activity';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { Subscription } from 'rxjs';
import { HttpClientPayload, HTTP_CLIENT_NEEDED, HTTP_CLIENT_SUPPLIED } from './app-event-types';
import { EditorTabsComponent } from './editor-tabs/editor-tabs.component';
import { NAVIGATION_CLOSE } from './editor-tabs/event-types';
import { SNACKBAR_DISPLAY_NOTIFICATION } from './snack-bar/snack-bar-event-types';
import { UserActivityConfig } from './user-activity-config/user-activity-config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy {

  @ViewChild(EditorTabsComponent) editorTabsComponent: EditorTabsComponent;

  title = 'test-editor-web';
  isAuthorizedSubscription: Subscription;
  oidcOnModuleSetupSubscription: Subscription;
  isAuthorized: boolean;
  hasToken: boolean;
  userActivityStarted = false;
  userDataSubscription: Subscription;
  user: String;
  httpClientSubscription: Subscription;


  constructor(private messagingService: MessagingService,
    public oidcSecurityService: OidcSecurityService,
    private spinnerService: Ng4LoadingSpinnerService,
    private httpClient: HttpClient,
    private userActivityService: UserActivityService,
    private userActivityConfig: UserActivityConfig) {
    if (isDevMode()) {
      // log all received events in development mode
      messagingService.subscribeAll((message: Message) => {
        console.log(`Received message of type: ${message.type}`, message);
      });
    }
    if (this.oidcSecurityService.moduleSetup) {
      this.onOidcModuleSetup();
    } else {
      this.oidcOnModuleSetupSubscription = this.oidcSecurityService.onModuleSetup.subscribe(() => {
        this.onOidcModuleSetup();
      });
    }

    this.setupWorkspaceRetrieved();
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
    if (this.oidcOnModuleSetupSubscription) {
      this.oidcOnModuleSetupSubscription.unsubscribe();
    }
    if (this.userActivityStarted) {
      this.userActivityService.stop();
      this.userActivityStarted = false;
    }
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
    if (this.userActivityStarted) {
      this.userActivityService.stop();
      this.userActivityStarted = false;
    }
    this.oidcSecurityService.logoff();
    this.user = null;
  }

  private onOidcModuleSetup() {
    if (window.location.hash) {
      console.log('start authorized callback');
      this.oidcSecurityService.authorizedImplicitFlowCallback();
    }
  }

  private setupWorkspaceRetrieved(): void {
    this.messagingService.subscribe(WORKSPACE_RETRIEVED, () => {
      this.spinnerService.hide();

      if (!this.userActivityStarted) {
        this.userActivityService.start(...this.userActivityConfig.events);
        this.userActivityStarted = true;
      }
    });
    this.messagingService.subscribe(WORKSPACE_RETRIEVED_FAILED, () => {
      this.spinnerService.hide();
      // decouple w/ message bus to be able to migrate snack bar out to test-editor-commons
      this.messagingService.publish(SNACKBAR_DISPLAY_NOTIFICATION, { message: 'Loading workspace timed out!', timeout: 15000 });
    });
  }

  private setupHttpClientListener(): void {
    this.httpClientSubscription = this.messagingService.subscribe(HTTP_CLIENT_NEEDED, () => {
      const payload: HttpClientPayload = { httpClient: this.httpClient };
      this.messagingService.publish(HTTP_CLIENT_SUPPLIED, payload);
    });
  }

  dragAffectingEditorEnd() {
    this.editorTabsComponent.resize();
  }

}
