import { APP_BASE_HREF } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { RouterModule, Routes } from '@angular/router';
import { MessagingModule, MessagingService } from '@testeditor/messaging-service';
import { AuthModule, OidcSecurityService } from 'angular-auth-oidc-client';
import { AngularSplitModule } from 'angular-split';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { instance, mock, resetCalls, verify } from 'ts-mockito';
import { AppComponent } from './app.component';
import { DocumentService } from './service/document/document.service';
import { UserActivityModule, UserActivityServiceConfig } from '@testeditor/user-activity';
import { UserActivityConfig } from './user-activity-config/user-activity-config';

const appRoutes: Routes = [
  { path: '', component: AppComponent }
];

describe('AppComponent', () => {
  const mockDocumentService = mock(DocumentService);
  const mockNg4SpinnerService = mock(Ng4LoadingSpinnerService);
  let messagingService: MessagingService;
  let app: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        AngularSplitModule,
        RouterModule.forRoot(appRoutes),
        MessagingModule.forRoot(),
        HttpClientModule,
        HttpClientTestingModule,
        AuthModule.forRoot(),
        UserActivityModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        OidcSecurityService,
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: DocumentService, useValue: instance(mockDocumentService) },
        { provide: Ng4LoadingSpinnerService, useValue: instance(mockNg4SpinnerService) },
        { provide: UserActivityServiceConfig, useValue: { userActivityServiceUrl: '' } },
        UserActivityConfig,
        HttpClient
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    app = fixture.debugElement.componentInstance;

    // configure messaging
    messagingService = TestBed.get(MessagingService);
    fixture.detectChanges();
  });

  it('should create the app', async(() => {
    expect(app).toBeTruthy();
  }));

  it(`should have as title 'test-editor-web'`, async(() => {
    expect(app.title).toEqual('test-editor-web');
  }));

  // spinner is shown when user is authorized, the following tests check whether the spinner is removed appropriately

  it('should hide the spinner, after workspace is (intially) loaded', fakeAsync(() => {
    resetCalls(mockNg4SpinnerService);

    // when
    messagingService.publish('workspace.retrieved', null);
    tick();

    // expect
    verify(mockNg4SpinnerService.hide()).once();
    expect().nothing();
    flush();
  }));

});
