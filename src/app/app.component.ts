import { Component, OnInit, isDevMode } from '@angular/core';
import { MessagingService, Message } from '@testeditor/messaging-service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Subscription } from 'rxjs/Subscription';
import { NAVIGATION_CLOSE } from './editor-tabs/event-types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  title = 'test-editor-web';
  isAuthorizedSubscription: Subscription;
  isAuthorized: boolean;
  userDataSubscription: Subscription;
  user: String;


  constructor(private messagingService: MessagingService, public oidcSecurityService: OidcSecurityService) {
    if (isDevMode()) {
      // log all received events in development mode
      messagingService.subscribeAll((message: Message) => {
        console.log(`Received message of type: ${message.type}`, message);
      });
      // for development purposes, store 'john doe' token as long as no definite login is implemented that provides an appropriate token
      sessionStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huLmRvZUBnbWFpbC5jb20ifQ.G96r0gWRtYfUaEb9XHQp3A4zoovFLJLfx86f5qz-Vl8');
    }
    if (this.oidcSecurityService.moduleSetup) {
      this.doCallbackLogicIfRequired();
    } else {
      this.oidcSecurityService.onModuleSetup.subscribe(() => {
        this.doCallbackLogicIfRequired();
      });
    }
  }

  ngOnInit() {
    this.isAuthorizedSubscription = this.oidcSecurityService.getIsAuthorized().subscribe(
      (isAuthorized: boolean) => {
        this.isAuthorized = isAuthorized;
      });
    this.userDataSubscription = this.oidcSecurityService.getUserData().subscribe(
      (userData: any) => {
        if (userData && userData != '') {
          this.user = userData.name;
          let idToken = this.oidcSecurityService.getIdToken();
          if (idToken !== '') {
            localStorage.setItem('token', idToken);
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

}
