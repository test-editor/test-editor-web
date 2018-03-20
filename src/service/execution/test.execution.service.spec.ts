import { TestExecutionService, DefaultTestExecutionService } from './test.execution.service';
import { AuthHttp, AuthConfig } from 'angular2-jwt';
import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Observable } from 'rxjs/Observable';
import { Response, ResponseOptions, ConnectionBackend, XHRBackend, RequestMethod, HttpModule } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { Injector, ReflectiveInjector } from '@angular/core';
import { inject } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { fakeAsync } from '@angular/core/testing';
import { ElementType, WorkspaceElement } from '@testeditor/workspace-navigator';

export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_CREATED = 201;
export const HTTP_STATUS_ERROR = 500;


describe('TestExecutionService', () => {
  let serviceConfig: TestExecutionServiceConfig;

  beforeEach(() => {
    serviceConfig = new TestExecutionServiceConfig();
    serviceConfig.testExecutionServiceUrl = 'http://localhost:9080/tests';
    // dummy jwt token
    let authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M';

    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [
        { provide: XHRBackend, useClass: MockBackend},
        { provide: AuthConfig, useValue: new AuthConfig({tokenGetter: () => authToken}) },
        { provide: TestExecutionService, useClass: DefaultTestExecutionService },
        { provide: TestExecutionServiceConfig, useValue: serviceConfig },
        AuthHttp
      ]
    });
  });

  it('invokes REST endpoint with encoded path', fakeAsync(inject([XHRBackend, TestExecutionService],
    (mockBackend: MockBackend, executionService: TestExecutionService) => {
    // given
    let tclFilePath = 'path/to/file?.tcl';
    mockBackend.connections.subscribe(
      (connection: MockConnection) => {
        expect(connection.request.method).toBe(RequestMethod.Post);
        expect(connection.request.url).toBe(serviceConfig.testExecutionServiceUrl + '/execute?resource=path/to/file%3F.tcl');

        connection.mockRespond(new Response( new ResponseOptions({status: HTTP_STATUS_CREATED})));
      }
    );

    // when
    executionService.execute(tclFilePath)

    // then
    .then(response => {
      expect(response.status).toBe(HTTP_STATUS_CREATED);
    });
  })));

  it('invokes REST test status endpoint', fakeAsync(inject([XHRBackend, TestExecutionService],
    (mockBackend: MockBackend, executionService: TestExecutionService) => {
    // given
    let tclFilePath = 'path/to/file.tcl';
    const tclWorkspaceElement: WorkspaceElement = {
      name: 'file.tcl',
      path: tclFilePath,
      type: ElementType.File,
      children: []
    };
    mockBackend.connections.subscribe(
      (connection: MockConnection) => {
        expect(connection.request.method).toBe(RequestMethod.Get);
        let expectedURL = new URL(serviceConfig.testExecutionServiceUrl);
        let actualURL = new URL(connection.request.url);
        expect(actualURL.protocol).toBe(expectedURL.protocol);
        expect(actualURL.host).toBe(expectedURL.host);
        expect(actualURL.pathname).toBe('/tests/status');
        expect(actualURL.searchParams.get('wait')).toBe('true');
        expect(actualURL.searchParams.get('resource')).toBe(tclFilePath);

        connection.mockRespond(new Response( new ResponseOptions({
          body: 'IDLE',
          status: HTTP_STATUS_OK
        })));
      }
    );

    // when
    executionService.getStatus(tclWorkspaceElement)

    // then
    .then(testExecutionStatus => {
      expect(testExecutionStatus.path).toBe(tclFilePath);
      expect(testExecutionStatus.status).toBe('IDLE');
    });
  })));

  it('Translates server response to "statusAll" request to properly typed map', fakeAsync(inject([XHRBackend, TestExecutionService],
    (mockBackend: MockBackend, executionService: TestExecutionService) => {
      // given
      const rootElement: WorkspaceElement = {
        name: 'file.tcl',
        path: 'src/test/java/file.tcl',
        type: ElementType.File,
        children: []
      };
      mockBackend.connections.subscribe(
        (connection: MockConnection) => {
          expect(connection.request.method).toBe(RequestMethod.Get);
          expect(connection.request.url).toBe(serviceConfig.testExecutionServiceUrl + '/status/all');

          connection.mockRespond(new Response(new ResponseOptions({
            status: HTTP_STATUS_OK,
            body: '[{"path":"src/test/java/failures/failedTest.tcl","status":"FAILED"},\
{"path":"runningTest.tcl","status":"RUNNING"},\
{"path":"successfulTest.tcl","status":"SUCCESS"}]'
          })));
        }
      );

      // when
      executionService.getAllStatus(rootElement)

      // then
      .then(statusUpdates => {
        expect(statusUpdates.length).toEqual(3);
        expect(statusUpdates[0].path).toEqual('src/test/java/failures/failedTest.tcl');
        expect(statusUpdates[0].status).toEqual('FAILED');
        expect(statusUpdates[1].path).toEqual('runningTest.tcl');
        expect(statusUpdates[1].status).toEqual('RUNNING');
        expect(statusUpdates[2].path).toEqual('successfulTest.tcl');
        expect(statusUpdates[2].status).toEqual('SUCCESS');
      });
    })));
});
