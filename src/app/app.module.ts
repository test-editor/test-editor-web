import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { MessagingModule } from '@testeditor/messaging-service';
import { TestNavigatorModule, TEST_NAVIGATOR_USER_ACTIVITY_LABEL_PROVIDER, TEST_NAVIGATOR_USER_ACTIVITY_LIST,
  TEST_NAVIGATOR_USER_ACTIVITY_STYLE_PROVIDER } from '@testeditor/test-navigator';
import { TestExecDetailsModule, TestPropertiesOrganizerServiceConfig } from '@testeditor/testexec-details';
import { TestExecNavigatorModule } from '@testeditor/testexec-navigator';
import { TestStepSelectorModule } from '@testeditor/teststep-selector';
import { UserActivityModule, UserActivityServiceConfig } from '@testeditor/user-activity';
import { AuthModule, AuthWellKnownEndpoints, OidcConfigService, OidcSecurityService,
  OpenIDImplicitFlowConfiguration } from 'angular-auth-oidc-client';
import { AngularSplitModule } from 'angular-split';
import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';
import { ModalModule } from 'ngx-bootstrap/modal';
import '../assets/configuration.js';
import { AppComponent } from './app.component';
import { AppTokenStorage } from './app.token.storage';
import { AuthInterceptor } from './auth.interceptor';
import { ModalDialogComponent } from './dialogs/modal.dialog.component';
import { AceEditorZoneConfiguration } from './editor-tabs/ace.component';
import { EditorTabsModule } from './editor-tabs/editor-tabs.module';
import { SnackBarComponent } from './snack-bar/snack-bar.component';
import { UserActivityConfig, UserActivityType } from './user-activity-config/user-activity-config';
import { TestEditorUserActivityLabelProvider } from './user-activity-config/user-activity-label-provider';
import { TestEditorUserActivityStyleProvider } from './user-activity-config/user-activity-style-provider';
import { TestEditorConfiguration } from './config/test-editor-configuration.js';

declare var appConfig: Function;

const testEditorConfig = new TestEditorConfiguration(appConfig());

const appRoutes: Routes = [
  { path: '', component: AppComponent }
];

const userActivities: string[] = Object.keys(UserActivityType).map((type) => UserActivityType[type]);

const testExecDetailsPropertiesOrder: TestPropertiesOrganizerServiceConfig = {
  propertyPriorityMap: {
    'Status': 200,
    'Assertion Error': 100
  }
};

@NgModule({
  declarations: [
    AppComponent,
    ModalDialogComponent,
    SnackBarComponent
  ],
  imports: [
    AngularSplitModule.forRoot(),
    Ng4LoadingSpinnerModule.forRoot(),
    BrowserModule,
    HttpClientModule,
    ModalModule.forRoot(),
    RouterModule.forRoot(appRoutes),
    AuthModule.forRoot({ storage: AppTokenStorage }),
    MessagingModule.forRoot(),
    TestNavigatorModule.forRoot(
      { persistenceServiceUrl: testEditorConfig.serviceUrls.persistenceService },
      { indexServiceUrl: testEditorConfig.serviceUrls.indexService },
      { validationServiceUrl: testEditorConfig.serviceUrls.validationMarkerService }
    ),
    EditorTabsModule.forRoot({
      persistenceServiceUrl: testEditorConfig.serviceUrls.persistenceService,
    }, testEditorConfig),
    TestExecNavigatorModule.forRoot({ testCaseServiceUrl: testEditorConfig.serviceUrls.testCaseService },
                                    { testExecutionServiceUrl: testEditorConfig.serviceUrls.testSuiteExecutionService }),
    TestExecDetailsModule.forRoot({ url: testEditorConfig.serviceUrls.testSuiteExecutionService },
                                  { resourceServiceUrl: testEditorConfig.serviceUrls.persistenceService },
                                  testExecDetailsPropertiesOrder),
    TestStepSelectorModule.forRoot({ testStepServiceUrl: testEditorConfig.serviceUrls.indexService }),
    UserActivityModule
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
    { provide: AceEditorZoneConfiguration, useValue: { useOutsideZone: true } },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    UserActivityConfig,
    { provide: UserActivityServiceConfig, useValue: { userActivityServiceUrl: testEditorConfig.serviceUrls.userActivityService } },
    { provide: TEST_NAVIGATOR_USER_ACTIVITY_STYLE_PROVIDER, useClass: TestEditorUserActivityStyleProvider },
    { provide: TEST_NAVIGATOR_USER_ACTIVITY_LABEL_PROVIDER, useClass: TestEditorUserActivityLabelProvider },
    { provide: TEST_NAVIGATOR_USER_ACTIVITY_LIST, useValue:  userActivities },
    { provide: TestEditorConfiguration, useValue: testEditorConfig }
  ],
  bootstrap: [AppComponent],
  entryComponents: [ModalDialogComponent]
})
export class AppModule {

  // see https://github.com/damienbod/angular-auth-oidc-client/ for more configuration options
  constructor(
    private oidcSecurityService: OidcSecurityService,
    private oidcConfigService: OidcConfigService,
  ) {
    this.oidcConfigService.onConfigurationLoaded.subscribe(() => {

      const openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
      openIDImplicitFlowConfiguration.stsServer = testEditorConfig.authentication.stsServer;
      openIDImplicitFlowConfiguration.redirect_url = testEditorConfig.authentication.redirectUrl;
      openIDImplicitFlowConfiguration.client_id = testEditorConfig.authentication.clientId;
      openIDImplicitFlowConfiguration.response_type = 'id_token';
      openIDImplicitFlowConfiguration.scope = 'openid email profile';
      openIDImplicitFlowConfiguration.silent_renew = true;
      openIDImplicitFlowConfiguration.silent_renew_url = testEditorConfig.authentication.silentRenewUrl;
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

export function loadConfig(oidcConfigService: OidcConfigService) {
  console.log('APP_INITIALIZER STARTING');
  return () => {
    oidcConfigService.load_using_stsServer('https://accounts.google.com');
  };
}
