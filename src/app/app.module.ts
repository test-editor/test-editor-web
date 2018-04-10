import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';

import { MessagingModule } from '@testeditor/messaging-service';
import { WorkspaceNavigatorModule } from '@testeditor/workspace-navigator';

import { AppComponent } from './app.component';
import { EditorTabsModule } from './editor-tabs/editor-tabs.module';

import { AuthModule, OidcSecurityService, OidcConfigService,
         OpenIDImplicitFlowConfiguration, AuthWellKnownEndpoints } from 'angular-auth-oidc-client';
import { Routes, RouterModule } from '@angular/router';

import * as constants from './config/app-config';
import { testEditorIndicatorFieldSetup } from './config/workspace.navigator.config';
import { ValidationMarkerService } from 'service/validation/validation.marker.service';
import { XtextDefaultValidationMarkerService } from '../service/validation/xtext.default.validation.marker.service';
import { XtextValidationMarkerServiceConfig } from 'service/validation/xtext.validation.marker.service.config';
import { TestExecutionService, DefaultTestExecutionService } from '../service/execution/test.execution.service';
import { TestExecutionServiceConfig } from '../service/execution/test.execution.service.config';
import { IndexService } from 'service/index/index.service';
import { XtextIndexService } from '../service/index/xtext.index.service';
import { XtextIndexServiceConfig } from 'service/index/xtext.index.service.config';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppTokenStorage } from './app.token.storage';
import { AuthInterceptor } from './auth.interceptor';

const appRoutes: Routes = [
  { path: '', component: AppComponent }
];

export function loadConfig(oidcConfigService: OidcConfigService) {
  console.log('APP_INITIALIZER STARTING');
  return () => {
    oidcConfigService.load_using_stsServer('http://accounts.google.com');
  };
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes),
    AuthModule.forRoot({ storage: AppTokenStorage }),
    MessagingModule.forRoot(),
    WorkspaceNavigatorModule.forRoot({
      persistenceServiceUrl: constants.appConfig.serviceUrls.persistenceService
    }, {
      testExecutionServiceUrl: constants.appConfig.serviceUrls.testExecutionService // remove when refactoring complete
    }, testEditorIndicatorFieldSetup),
    EditorTabsModule.forRoot({
      persistenceServiceUrl: constants.appConfig.serviceUrls.persistenceService,
    })
  ],
  providers: [
    OidcSecurityService,
    OidcConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: loadConfig,
      deps: [OidcConfigService],
      multi: true
    },
    { provide: TestExecutionService, useClass: DefaultTestExecutionService },
    { provide: TestExecutionServiceConfig, useValue: { serviceUrl: constants.appConfig.serviceUrls.testExecutionService } },
    { provide: ValidationMarkerService, useClass: XtextDefaultValidationMarkerService },
    { provide: XtextValidationMarkerServiceConfig, useValue: { serviceUrl: constants.appConfig.serviceUrls.validationMarkerService }},
    { provide: IndexService, useClass: XtextIndexService },
    { provide: XtextIndexServiceConfig, useValue: { serviceUrl: constants.appConfig.serviceUrls.indexService }},
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor(
    private oidcSecurityService: OidcSecurityService,
    private oidcConfigService: OidcConfigService,
  ) {
    this.oidcConfigService.onConfigurationLoaded.subscribe(() => {

      const openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
      openIDImplicitFlowConfiguration.stsServer = 'https://accounts.google.com';
      openIDImplicitFlowConfiguration.redirect_url = 'http://localhost:4200';
      openIDImplicitFlowConfiguration.client_id = '173023782391-6jqf6sgv5mlskj7f35qogtso5je2e1gc.apps.googleusercontent.com';
      openIDImplicitFlowConfiguration.response_type = 'id_token';
      openIDImplicitFlowConfiguration.scope = 'openid email profile';
      // openIDImplicitFlowConfiguration.start_checksession = true;
      openIDImplicitFlowConfiguration.silent_renew = true;
      // openIDImplicitFlowConfiguration.silent_renew_url = 'https://accounts.google.com/silent-renew.html';
      openIDImplicitFlowConfiguration.post_login_route = '/';
      openIDImplicitFlowConfiguration.forbidden_route = '/';
      openIDImplicitFlowConfiguration.unauthorized_route = '/';
      openIDImplicitFlowConfiguration.log_console_warning_active = true;
      openIDImplicitFlowConfiguration.log_console_debug_active = true;
      // id_token C8: The iat Claim can be used to reject tokens that were issued too far away from the current time,
      // limiting the amount of time that nonces need to be stored to prevent attacks.The acceptable range is Client specific.
      openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 120;
      openIDImplicitFlowConfiguration.silent_renew_offset_in_seconds = 120;

      const authWellKnownEndpoints = new AuthWellKnownEndpoints();
      authWellKnownEndpoints.setWellKnownEndpoints(this.oidcConfigService.wellKnownEndpoints);

      this.oidcSecurityService.setupModule(openIDImplicitFlowConfiguration, authWellKnownEndpoints);

    });

    console.log('APP STARTING');
  }
}
