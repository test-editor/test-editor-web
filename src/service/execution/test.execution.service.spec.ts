import { TestExecutionService, DefaultTestExecutionService } from './test.execution.service';
import { AuthHttp, AuthConfig } from 'angular2-jwt';
import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Response, ResponseOptions, XHRBackend, RequestMethod, HttpModule } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { inject, TestBed, fakeAsync } from '@angular/core/testing';
import { TestExecutionState } from './test.execution.state';

export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_CREATED = 201;

describe('TestExecutionService', () => {
  let serviceConfig: TestExecutionServiceConfig;

  beforeEach(() => {
    serviceConfig = new TestExecutionServiceConfig();
    serviceConfig.serviceUrl = 'http://localhost:9080/tests';
    const dummyAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M';

    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [
        { provide: XHRBackend, useClass: MockBackend},
        { provide: AuthConfig, useValue: new AuthConfig({tokenGetter: () => dummyAuthToken}) },
        { provide: TestExecutionService, useClass: DefaultTestExecutionService },
        { provide: TestExecutionServiceConfig, useValue: serviceConfig },
        AuthHttp
      ]
    });
  });

  it('invokes REST endpoint with encoded path', fakeAsync(inject([XHRBackend, TestExecutionService],
    (mockBackend: MockBackend, executionService: TestExecutionService) => {
    // given
    const tclFilePath = 'path/to/file?.tcl';
    mockBackend.connections.subscribe(
      (connection: MockConnection) => {
        expect(connection.request.method).toBe(RequestMethod.Post);
        expect(connection.request.url).toBe(serviceConfig.serviceUrl + '/execute?resource=path/to/file%3F.tcl');

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
    const tclFilePath = 'path/to/file.tcl';
    mockBackend.connections.subscribe(
      (connection: MockConnection) => {
        expect(connection.request.method).toBe(RequestMethod.Get);
        const expectedURL = new URL(serviceConfig.serviceUrl);
        const actualURL = new URL(connection.request.url);
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
    executionService.getStatus(tclFilePath)

    // then
    .then(testExecutionStatus => {
      expect(testExecutionStatus.path).toBe(tclFilePath);
      expect(testExecutionStatus.status).toBe(TestExecutionState.Idle);
    });
  })));

  it('Translates server response to "statusAll" request', fakeAsync(inject([XHRBackend, TestExecutionService],
    (mockBackend: MockBackend, executionService: TestExecutionService) => {
      // given
      mockBackend.connections.subscribe(
        (connection: MockConnection) => {
          expect(connection.request.method).toBe(RequestMethod.Get);
          expect(connection.request.url).toBe(serviceConfig.serviceUrl + '/status/all');

          connection.mockRespond(new Response(new ResponseOptions({
            status: HTTP_STATUS_OK,
            body: '[ { "path": "src/test/java/failures/failedTest.tcl", "status": "FAILED"},\
                     { "path": "runningTest.tcl",                       "status": "RUNNING"},\
                     { "path": "successfulTest.tcl",                    "status": "SUCCESS"}]'
          })));
        }
      );

      // when
      executionService.getAllStatus()

      // then
      .then(statusUpdates => {
        expect(statusUpdates.length).toEqual(3);
        expect(statusUpdates[0]).toEqual({ path: 'src/test/java/failures/failedTest.tcl', status: TestExecutionState.LastRunFailed });
        expect(statusUpdates[1]).toEqual({ path: 'runningTest.tcl', status: TestExecutionState.Running });
        expect(statusUpdates[2]).toEqual({ path: 'successfulTest.tcl', status: TestExecutionState.LastRunSuccessful });
      });
    })));
});
