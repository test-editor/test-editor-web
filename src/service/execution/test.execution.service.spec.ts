import { TestExecutionService, DefaultTestExecutionService } from './test.execution.service';
import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Response, ResponseOptions, XHRBackend, RequestMethod, HttpModule } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { inject, TestBed, fakeAsync } from '@angular/core/testing';
import { TestExecutionState } from './test.execution.state';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpClientModule } from '@angular/common/http';

export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_CREATED = 201;

describe('TestExecutionService', () => {
  let serviceConfig: TestExecutionServiceConfig;

  beforeEach(() => {
    serviceConfig = new TestExecutionServiceConfig();
    serviceConfig.serviceUrl = 'http://localhost:9080/tests';
    const dummyAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M';

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, HttpClientModule],
      providers: [
        { provide: TestExecutionService, useClass: DefaultTestExecutionService },
        { provide: TestExecutionServiceConfig, useValue: serviceConfig },
        HttpClient
      ]
    });
  });

  it('invokes REST endpoint with encoded path', fakeAsync(inject([HttpTestingController, TestExecutionService],
    (httpMock: HttpTestingController, executionService: TestExecutionService) => {
      // given
      const tclFilePath = 'path/to/file?.tcl';
      const testExecutionRequest = {
        url: serviceConfig.serviceUrl + '/execute?resource=path/to/file%3F.tcl',
        method: 'POST'
      };
      const mockResponse = new Response(new ResponseOptions({ status: HTTP_STATUS_CREATED }));

      // when
      executionService.execute(tclFilePath)

        // then
        .then(response => {
          expect(response.status).toBe(HTTP_STATUS_CREATED);
        });

      httpMock.match(testExecutionRequest)[0].flush(mockResponse);
    })));

  it('invokes REST test status endpoint', fakeAsync(inject([HttpTestingController, TestExecutionService],
    (httpMock: HttpTestingController, executionService: TestExecutionService) => {
      // given
      const tclFilePath = 'path/to/file.tcl';
      const resourceStatusRequest = {
        url: serviceConfig.serviceUrl + '/status?resource=' + tclFilePath + '&wait=true',
        method: 'GET'
      };
      const mockResponse = new Response(new ResponseOptions({
        body: 'IDLE',
        status: HTTP_STATUS_OK
      }));

      // when
      executionService.getStatus(tclFilePath)

        // then
        .then(testExecutionStatus => {
          expect(testExecutionStatus.path).toBe(tclFilePath);
          expect(testExecutionStatus.status).toBe(TestExecutionState.Idle);
        });

      httpMock.match(resourceStatusRequest)[0].flush(mockResponse);
    })));

  it('Translates server response to "statusAll" request', fakeAsync(inject([HttpTestingController, TestExecutionService],
    (httpMock: HttpTestingController, executionService: TestExecutionService) => {
      // given
      const statusAllRequest = {
        url: serviceConfig.serviceUrl + '/status/all',
        method: 'GET'
      };
      const mockResponse = new Response(new ResponseOptions({
        status: HTTP_STATUS_OK,
        body: '[ { "path": "src/test/java/failures/failedTest.tcl", "status": "FAILED"},\
                     { "path": "runningTest.tcl",                       "status": "RUNNING"},\
                     { "path": "successfulTest.tcl",                    "status": "SUCCESS"}]'
      }));

      // when
      executionService.getAllStatus()

        // then
        .then(statusUpdates => {
          expect(statusUpdates.length).toEqual(3);
          expect(statusUpdates[0]).toEqual({ path: 'src/test/java/failures/failedTest.tcl', status: TestExecutionState.LastRunFailed });
          expect(statusUpdates[1]).toEqual({ path: 'runningTest.tcl', status: TestExecutionState.Running });
          expect(statusUpdates[2]).toEqual({ path: 'successfulTest.tcl', status: TestExecutionState.LastRunSuccessful });
        });

      httpMock.match(statusAllRequest)[0].flush(mockResponse);
    })));
});
