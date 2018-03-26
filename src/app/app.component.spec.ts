import { TestBed, async, fakeAsync, ComponentFixture, tick } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';

import { MessagingModule } from '@testeditor/messaging-service';

import { AppComponent } from './app.component';
import { AuthModule } from 'angular-auth-oidc-client';
import { Response, BaseResponseOptions, HttpModule } from '@angular/http';
import { Routes, RouterModule } from '@angular/router'
import { WorkspaceNavigatorModule, PersistenceService } from '@testeditor/workspace-navigator';
import { MessagingService } from '@testeditor/messaging-service';
import { mock, when, instance } from 'ts-mockito';
import { ValidationMarkerService } from '../service/validation/validation.marker.service';
import { XtextIndexService } from '../service/index/xtext.index.service';
import { IndexService } from '../service/index/index.service';

import { TestExecutionService, DefaultTestExecutionService } from '../service/execution/test.execution.service';
import { DocumentService } from 'service/document/document.service';
import { XtextDefaultValidationMarkerService } from '../service/validation/xtext.default.validation.marker.service';

const appRoutes: Routes = [
  { path: '', component: AppComponent }
];

describe('AppComponent', () => {
  const mockPersistenceService = mock(PersistenceService);
  const mockValidationMarkerService = mock(XtextDefaultValidationMarkerService); // cannot use ValidationMarkerService, since its method is abstract and cannot be spied on by jasmine
  const mockDocumentService = mock(DocumentService);
  const mockTestExecutionService = mock(DefaultTestExecutionService);
  const mockIndexService=mock(XtextIndexService); // cannot use IndexService, since its method is abstract and cannot be spied on by jasmine
  let messagingService: MessagingService;
  let app: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        RouterModule.forRoot(appRoutes),
        MessagingModule.forRoot(),
        HttpModule,
        AuthModule.forRoot(),
        MessagingModule.forRoot()
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: PersistenceService, useValue: instance(mockPersistenceService) },
        { provide: ValidationMarkerService, useValue: instance(mockValidationMarkerService) },
        { provide: DocumentService, useValue: instance(mockDocumentService) },
        { provide: TestExecutionService, useValue: instance(mockTestExecutionService) },
        { provide: IndexService, useValue: instance(mockIndexService) }
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

  it('should listen to test execution events, start test in the test execution backend and send a test execution started event', fakeAsync(() => {
    // given
    when(mockTestExecutionService.execute('some/path/to/test.tcl'))
      .thenReturn(Promise.resolve(new Response(new BaseResponseOptions().merge({ body: 'some/path/to/test_tcl_log_file.log' }))));
    let testExecStartedCallback = jasmine.createSpy('testExecStartedCallback');
    messagingService.subscribe('test.execution.started', testExecStartedCallback);
    let markerObserverCallback = jasmine.createSpy('markerObserverCallback');
    messagingService.subscribe('workspace.marker.observe', markerObserverCallback);

    // when
    messagingService.publish('test.execute.request', 'some/path/to/test.tcl');
    tick();

    // then
    expect(testExecStartedCallback).toHaveBeenCalledTimes(1);
    expect(testExecStartedCallback).toHaveBeenCalledWith(jasmine.objectContaining({
      path: 'some/path/to/test.tcl',
      message: 'Execution of "\${}" has been started.'
    }));
    expect(markerObserverCallback).toHaveBeenCalledTimes(1);
    expect(markerObserverCallback).toHaveBeenCalledWith(jasmine.objectContaining({
      path: 'some/path/to/test.tcl',
      field: 'testStatus'
    }));

  }));

  it('should listen to test execution events, failure to start tests should publish test execution start failure', fakeAsync(() => {
    // given
    when(mockTestExecutionService.execute('some/path/to/test.tcl')).thenReturn(Promise.reject('some reason'));
    let testExecFailedCallback = jasmine.createSpy('testExecFailedCallback');
    messagingService.subscribe('test.execution.start.failed', testExecFailedCallback);

    // when
    messagingService.publish('test.execute.request', 'some/path/to/test.tcl');
    tick();

    // then
    expect(testExecFailedCallback).toHaveBeenCalledTimes(1);
    expect(testExecFailedCallback).toHaveBeenCalledWith(jasmine.objectContaining({
      path: 'some/path/to/test.tcl',
      reason: 'some reason',
      message: 'The test "\${}" could not be started.'
    }));
  }));

  it('should listen to editor save completed events, starting index refresh (which will then refresh long poll on validation markers)', fakeAsync(() => {
    // given
    when(mockIndexService.refresh()).thenReturn(Promise.resolve([ ]));
    spyOn(app, "refreshIndex");

    // when
    messagingService.publish('editor.save.completed', '');
    tick();

    // then
    expect(app.refreshIndex).toHaveBeenCalledTimes(1);
  }));

});
