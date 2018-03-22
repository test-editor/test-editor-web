import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';

import { MessagingModule } from '@testeditor/messaging-service';

import { AppComponent } from './app.component';
import { AuthModule } from 'angular-auth-oidc-client';
import { Response, BaseResponseOptions, HttpModule } from '@angular/http';
import { Routes, RouterModule } from '@angular/router'
import { WorkspaceNavigatorModule, PersistenceService } from '@testeditor/workspace-navigator';
import { MessagingService } from '@testeditor/messaging-service';
import { mock, when, instance, anyString } from 'ts-mockito';
import { ValidationMarkerService } from '../service/validation/validation.marker.service';
import { TestExecutionService, DefaultTestExecutionService } from '../service/execution/test.execution.service';
import { DocumentService } from 'service/document/document.service';

const appRoutes: Routes = [
  { path: '', component: AppComponent }
];

describe('AppComponent', () => {
  const mockPersistenceService = mock(PersistenceService);
  const mockValidationMarkerService = mock(ValidationMarkerService);
  const mockDocumentService = mock(DocumentService);
  const mockTestExecutionService = mock(DefaultTestExecutionService);
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
        { provide: TestExecutionService, useValue: instance(mockTestExecutionService) }
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

  it('should listen to test execution events, start test in the test execution backend and send a test execution started event', async(() => {
    // given
    when(mockTestExecutionService.execute('some/path/to/test.tcl'))
      .thenReturn(Promise.resolve(new Response(new BaseResponseOptions().merge({ body: 'some/path/to/test_tcl_log_file.log' }))));
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe('test.execution.started', callback);

    // when
    messagingService.publish('test.execute.request', 'some/path/to/test.tcl');

    // then
    fixture.whenStable().then(() => {
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
        status: 200,
        _body: 'some/path/to/test_tcl_log_file.log'
      }));
    })

  }));

});
