import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule, Http, RequestOptions } from '@angular/http';

import { MessagingModule } from '@testeditor/messaging-service';
import { WorkspaceNavigatorModule } from '@testeditor/workspace-navigator';

import { AppComponent } from './app.component';
import { EditorTabsModule } from './editor-tabs/editor-tabs.module';

import { AuthModule, OidcSecurityService, OpenIDImplicitFlowConfiguration } from 'angular-auth-oidc-client';
import { AuthHttp, AuthConfig } from 'angular2-jwt';
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

const appRoutes: Routes = [
    { path: '', component: AppComponent }
];

export function authHttpServiceFactory(http: Http, options: RequestOptions) {
  return new AuthHttp(new AuthConfig({
    tokenName: 'token',
    tokenGetter: (() => sessionStorage.getItem('token'))
  }), http, options);
}

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
    {
      provide: AuthHttp,
      useFactory: authHttpServiceFactory,
      deps: [Http, RequestOptions]
    },
    { provide: TestExecutionService, useClass: DefaultTestExecutionService },
    { provide: TestExecutionServiceConfig, useValue: { serviceUrl: constants.appConfig.serviceUrls.testExecutionService } },
    { provide: ValidationMarkerService, useClass: XtextDefaultValidationMarkerService },
    { provide: XtextValidationMarkerServiceConfig, useValue: { serviceUrl: constants.appConfig.serviceUrls.validationMarkerService }},
    { provide: IndexService, useClass: XtextIndexService },
    { provide: XtextIndexServiceConfig, useValue: { serviceUrl: constants.appConfig.serviceUrls.indexService }},
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
    constructor(public oidcSecurityService: OidcSecurityService) {
        const openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
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
