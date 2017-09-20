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
      authorizationHeader: "admin:admin@example.com"
    }),
    EditorTabsModule.forRoot({
      serviceUrl: constants.appConfig.serviceUrls.persistenceService,
      authorizationHeader: "admin:admin@example.com"
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
        openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44386';
        openIDImplicitFlowConfiguration.client_id = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        openIDImplicitFlowConfiguration.response_type = 'id_token token';
        openIDImplicitFlowConfiguration.scope = 'openid email profile';
        openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
        openIDImplicitFlowConfiguration.startup_route = '/home';
        openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
        openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
        openIDImplicitFlowConfiguration.log_console_warning_active = true;
        openIDImplicitFlowConfiguration.log_console_debug_active = true;
        openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 20;
        openIDImplicitFlowConfiguration.override_well_known_configuration = false;
        openIDImplicitFlowConfiguration.override_well_known_configuration_url = 'https://localhost:44386/wellknownconfiguration.json';

        this.oidcSecurityService.setupModule(openIDImplicitFlowConfiguration);

    }
}
