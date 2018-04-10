import { TestExecutionService, DefaultTestExecutionService } from './test.execution.service';
import { TestExecutionServiceConfig } from './test.execution.service.config';
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
        method: 'POST',
        url: serviceConfig.serviceUrl + '/execute?resource=path/to/file%3F.tcl'
      };
      const mockResponse = 'something';

      // when
      executionService.execute(tclFilePath)

        // then
        .then(response => {
          expect(response).toBe('something');
        });

      httpMock.match(testExecutionRequest)[0].flush(mockResponse);
    })));

  it('invokes REST test status endpoint', fakeAsync(inject([HttpTestingController, TestExecutionService],
    (httpMock: HttpTestingController, executionService: TestExecutionService) => {
      // given
      const tclFilePath = 'path/to/file.tcl';
      const resourceStatusRequest = {
        method: 'GET',
        url: serviceConfig.serviceUrl + '/status?resource=' + tclFilePath + '&wait=true'
      };
      const mockResponse = {
        status: 'IDLE',
        path: tclFilePath
      };

      // when
      executionService.getStatus(tclFilePath)

        // then
        .then(testExecutionStatus => {
          expect(testExecutionStatus).toEqual({ path: tclFilePath, status: TestExecutionState.Idle});
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
      const mockResponse =
        [{ 'path': 'src/test/java/failures/failedTest.tcl', 'status': 'FAILED'},
         { 'path': 'runningTest.tcl',                       'status': 'RUNNING'},
         { 'path': 'successfulTest.tcl',                    'status': 'SUCCESS'}];

      // when
      executionService.getAllStatus()

        // then
        .then(statusUpdates => {
          expect(statusUpdates).toEqual([{ path: 'src/test/java/failures/failedTest.tcl', status: TestExecutionState.LastRunFailed },
                                         { path: 'runningTest.tcl',                       status: TestExecutionState.Running },
                                         { path: 'successfulTest.tcl',                    status: TestExecutionState.LastRunSuccessful }]);
        });

      httpMock.match(statusAllRequest)[0].flush(mockResponse);
    })));
});
