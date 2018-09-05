import { TestBed, async, fakeAsync, ComponentFixture, tick, flush } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';

import { MessagingModule, MessagingService } from '@testeditor/messaging-service';

import { AppComponent, WORKSPACE_LOAD_RETRY_COUNT } from './app.component';
import { Response, BaseResponseOptions } from '@angular/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PersistenceService, WorkspaceElement } from '@testeditor/test-navigator';
import { Routes, RouterModule } from '@angular/router';
import { mock, when, instance, verify, resetCalls } from 'ts-mockito';
import { XtextIndexService } from './service/index/xtext.index.service';
import { IndexService } from './service/index/index.service';

import { DocumentService } from './service/document/document.service';
import { OidcSecurityService, AuthModule } from 'angular-auth-oidc-client';
import { AngularSplitModule } from 'angular-split';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { SNACKBAR_DISPLAY_NOTIFICATION } from './snack-bar/snack-bar-event-types';

const appRoutes: Routes = [
  { path: '', component: AppComponent }
];

describe('AppComponent', () => {
  const mockPersistenceService = mock(PersistenceService);
  // cannot use ValidationMarkerService, since its method is abstract and cannot be spied on by ts-mockito (yet)
  // const mockValidationMarkerService = mock(XtextDefaultValidationMarkerService);
  const mockDocumentService = mock(DocumentService);
  // const mockTestExecutionService = mock(DefaultTestExecutionService);
  // cannot use IndexService, since its method is abstract and cannot be spied on by ts-mockito (yet)
  const mockIndexService = mock(XtextIndexService);
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
        AuthModule.forRoot()
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        OidcSecurityService,
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: PersistenceService, useValue: instance(mockPersistenceService) },
        // { provide: ValidationMarkerService, useValue: instance(mockValidationMarkerService) },
        { provide: DocumentService, useValue: instance(mockDocumentService) },
        // { provide: TestExecutionService, useValue: instance(mockTestExecutionService) },
        { provide: IndexService, useValue: instance(mockIndexService) },
        { provide: Ng4LoadingSpinnerService, useValue: instance(mockNg4SpinnerService) },
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
    when(mockIndexService.reload()).thenReturn(Promise.resolve());
    when(mockIndexService.refresh()).thenReturn(Promise.resolve([]));
    when(mockPersistenceService.listFiles()).thenReturn(Promise.resolve(null));

    // when
    messagingService.publish('workspace.reload.request', null);
    tick();

    // expect
    verify(mockNg4SpinnerService.hide()).once();
    expect().nothing();
    flush();
  }));

  it('should still show the spinner, if list files ran into an error', fakeAsync(() => {
    resetCalls(mockNg4SpinnerService);
    when(mockIndexService.reload()).thenReturn(Promise.resolve());
    when(mockIndexService.refresh()).thenReturn(Promise.resolve([]));
    when(mockPersistenceService.listFiles()).thenReturn(Promise.reject(null));

    // when
    messagingService.publish('workspace.reload.request', null);

    // expect
    verify(mockNg4SpinnerService.hide()).never();

    expect().nothing();
    flush();
  }));

  it('should make 3 attempts to list files until spinner is hidden!', fakeAsync(() => {

    resetCalls(mockNg4SpinnerService);
    when(mockIndexService.reload()).thenReturn(Promise.resolve());
    when(mockIndexService.refresh()).thenReturn(Promise.resolve([]));
    const listFileReturns: Promise<WorkspaceElement>[] = [];
    for (let i = 0; i <= WORKSPACE_LOAD_RETRY_COUNT; i++) {
      listFileReturns.push(Promise.reject(null));
    }
    when(mockPersistenceService.listFiles()).thenReturn(...listFileReturns);
    const snackbarCallback = jasmine.createSpy('snackbarCallback');
    messagingService.subscribe(SNACKBAR_DISPLAY_NOTIFICATION, snackbarCallback);

    // when
    messagingService.publish('workspace.reload.request', null);
    tick(WORKSPACE_LOAD_RETRY_COUNT);

    // expect
    verify(mockNg4SpinnerService.hide()).once();
    expect(snackbarCallback).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Loading workspace timed out!',
      timeout: 15000
    }));

    flush();
  }));

});
