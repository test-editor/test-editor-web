import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';

import { MessagingModule } from '@testeditor/messaging-service';
import { WorkspaceNavigatorModule } from '@testeditor/workspace-navigator';

import { AppComponent } from './app.component';
import { EditorTabsModule } from './editor-tabs/editor-tabs.module';

import { AuthModule, OidcSecurityService, OpenIDImplicitFlowConfiguration } from 'angular-auth-oidc-client';
import { Routes, RouterModule } from '@angular/router'

import * as constants from './config/app-config';

const appRoutes: Routes = [
    { path: '', component: AppComponent }
  ]

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    RouterModule.forRoot(appRoutes),
    AuthModule.forRoot(),
    MessagingModule.forRoot(),
    WorkspaceNavigatorModule.forRoot({
      serviceUrl: constants.appConfig.serviceUrls.persistenceService,
      authorizationHeader: "bachmann:gunther.bachmann.si@gmail.com"
    }),
    EditorTabsModule.forRoot({
      serviceUrl: constants.appConfig.serviceUrls.persistenceService,
      authorizationHeader: "bachmann:gunther.bachmann.si@gmail.com"
    })
  ],
  providers: [
    OidcSecurityService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
    constructor(public oidcSecurityService: OidcSecurityService) {
        let openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
        openIDImplicitFlowConfiguration.stsServer = 'https://accounts.google.com';
        openIDImplicitFlowConfiguration.redirect_url = 'http://localhost:4200';
        openIDImplicitFlowConfiguration.client_id = '173023782391-6jqf6sgv5mlskj7f35qogtso5je2e1gc.apps.googleusercontent.com';
        openIDImplicitFlowConfiguration.response_type = 'id_token token';
        openIDImplicitFlowConfiguration.scope = 'openid email profile';
        openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:4200';
        openIDImplicitFlowConfiguration.startup_route = '/';
        openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
        openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
        openIDImplicitFlowConfiguration.log_console_warning_active = true;
        openIDImplicitFlowConfiguration.log_console_debug_active = true;
        openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 20;
        openIDImplicitFlowConfiguration.override_well_known_configuration = false;
        openIDImplicitFlowConfiguration.override_well_known_configuration_url = 'https://localhost:4200/wellknownconfiguration.json';

        this.oidcSecurityService.setupModule(openIDImplicitFlowConfiguration);

    }
}
