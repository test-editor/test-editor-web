import { Component, OnInit, isDevMode } from '@angular/core';
import { MessagingService, Message } from '@testeditor/messaging-service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Subscription } from 'rxjs/Subscription';

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


  constructor(private messagingService: MessagingService, public oidcSecurityService: OidcSecurityService) {
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
  }

  ngOnInit() {
    this.isAuthorizedSubscription = this.oidcSecurityService.getIsAuthorized().subscribe(
      (isAuthorized: boolean) => {
        console.log('user is authorized ' + isAuthorized)
        this.isAuthorized = isAuthorized;
      });
    this.userDataSubscription = this.oidcSecurityService.getUserData().subscribe(
      (userData: any) => {

        if (userData && userData != '') {
          console.log('userData ');
          console.log(userData);
        }

        console.log('userData getting data');
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
    this.oidcSecurityService.logoff();
  }

  private doCallbackLogicIfRequired() {
    if (window.location.hash) {
      console.log('start authorized callback');
      this.oidcSecurityService.authorizedCallback();
    }
  }
}
