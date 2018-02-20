import { Component, OnInit, isDevMode } from '@angular/core';
import { MessagingService, Message } from '@testeditor/messaging-service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Subscription } from 'rxjs/Subscription';
import { NAVIGATION_CLOSE } from './editor-tabs/event-types';

import * as events from '@testeditor/workspace-navigator';
import { PersistenceService, WorkspaceElement } from '@testeditor/workspace-navigator';
import { ValidationMarkerService } from 'service/validation/validation.marker.service';
import { DocumentService } from 'service/document/document.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  title = 'test-editor-web';
  isAuthorizedSubscription: Subscription;
  isAuthorized: boolean;
  hasToken: boolean;
  userDataSubscription: Subscription;
  user: String;


  constructor(private messagingService: MessagingService, public oidcSecurityService: OidcSecurityService,
    private persistenceService: PersistenceService, private validationMarkerService: ValidationMarkerService,
    private documentService: DocumentService) {
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
        this.getAllDocuments(root).then((rootWithFullTexts) => {
          this.validationMarkerService.getMarkerSummary(rootWithFullTexts).then((summaries) =>
            this.messagingService.publish(events.WORKSPACE_MARKER_UPDATE, summaries.map((summary) => (
              { path: summary.path, markers: { validation: { errors: summary.errors, warnings: summary.warnings, infos: summary.infos }}}
            )))
          );
        });
      }

      private getAllDocuments(root: WorkspaceElement): Promise<any> {
        if (root.children != null && root.children.length > 0) {
          return root.children.reduce((previous, child) => previous.then(() => this.getAllDocuments(child)), Promise.resolve(root))
            .then(() => root);
        } else {
          return this.documentService.loadDocument(root.path).then((response) => root['fulltext'] = response.text(),
            (error) => Promise.resolve(root));
        }
      }
    }
