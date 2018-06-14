import { TestBed, inject, async } from '@angular/core/testing';

import { TestSuiteExecutionService, DefaultTestSuiteExecutionService, AllStatusResponse } from './test-suite-execution.service';
import { HttpClientTestingModule, HttpTestingController, RequestMatch } from '@angular/common/http/testing';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TestSuiteExecutionServiceConfig } from './test-suite-execution.service.config';
import { TestExecutionState } from './test.execution.state';

describe('TestSuiteExecutionService', () => {
  let serviceConfig: TestSuiteExecutionServiceConfig;

  beforeEach(() => {
    serviceConfig = { testSuiteExecutionServiceUrl: 'http://localhost:9080/test-suite' };

    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, HttpClientModule ],
      providers: [ HttpClient,
        { provide: TestSuiteExecutionService, useClass: DefaultTestSuiteExecutionService},
        { provide: TestSuiteExecutionServiceConfig, useValue: serviceConfig }, ]
    });
  });

  it('should be created', inject([TestSuiteExecutionService], (service: TestSuiteExecutionService) => {
    expect(service).toBeTruthy();
  }));

  it('execute passes path list on as HTTP POST body', async(inject([TestSuiteExecutionService, HttpTestingController],
    (service: TestSuiteExecutionService, httpMock: HttpTestingController) => {
    // given
    const paths = [ 'path/to/first/test', 'path/to/a/differentTest' ];
    const testExecutionRequest: RequestMatch = {
      method: 'POST',
      url: serviceConfig.testSuiteExecutionServiceUrl + '/launch-new'
    };
    const mockResponse = 'http://example.org/1234/5678';

    // when
    service.execute(...paths);

    // then
    const testRequest = httpMock.expectOne(testExecutionRequest);
    expect(testRequest.request.body).toEqual(paths);
    testRequest.flush(null, {headers: {location: mockResponse}});
  })));

  it('execute returns location attribute of response header', async(inject([TestSuiteExecutionService, HttpTestingController],
    (service: TestSuiteExecutionService, httpMock: HttpTestingController) => {
    // given
    const paths = [ 'path/to/first/test', 'path/to/a/differentTest' ];
    const testExecutionRequest = {
      method: 'POST',
      url: serviceConfig.testSuiteExecutionServiceUrl + '/launch-new'
    };
    const mockResponse = 'http://example.org/1234/5678';

    // when
    service.execute(...paths)

    // then
    .then((actualResponse) => {
      expect(actualResponse).toEqual(mockResponse);
    });

    httpMock.expectOne(testExecutionRequest).flush(null, {headers: {location: mockResponse}});
  })));

  it('getStatus makes a GET request at the provided URL with query parameter "status" appended',
    async(inject([TestSuiteExecutionService, HttpTestingController],
    (service: TestSuiteExecutionService, httpMock: HttpTestingController) => {
    // given
    const testSuiteResourceURL = 'http://example.org/1234/5678';
    const testExecutionRequest: RequestMatch = {
      method: 'GET',
      url: testSuiteResourceURL + '?status&wait'
    };

    // when
    service.getStatus(testSuiteResourceURL);

    // then
    httpMock.expectOne(testExecutionRequest);
  })));

  it('getStatus returns TestSuiteExecutionStatus object containing the test state returned by the server',
    async(inject([TestSuiteExecutionService, HttpTestingController],
    (service: TestSuiteExecutionService, httpMock: HttpTestingController) => {
    // given
    const testSuiteResourceURL = 'http://example.org/1234/5678';
    const testExecutionRequest: RequestMatch = {
      method: 'GET',
      url: testSuiteResourceURL + '?status&wait'
    };

    // when
    service.getStatus(testSuiteResourceURL)

    // then
    .then((actualStatus) => {
      expect(actualStatus.resourceURL).toEqual(testSuiteResourceURL);
      expect(actualStatus.status).toEqual(TestExecutionState.Running);
    });

    httpMock.expectOne(testExecutionRequest).flush('RUNNING');
  })));

  it('getAllStatus makes the proper GET request',
    async(inject([TestSuiteExecutionService, HttpTestingController],
    (service: TestSuiteExecutionService, httpMock: HttpTestingController) => {
    // given
    const testExecutionRequest: RequestMatch = {
      method: 'GET',
      url: serviceConfig.testSuiteExecutionServiceUrl + '/status'
    };

    // when
    service.getAllStatus();

    // then
    httpMock.expectOne(testExecutionRequest);
  })));

  it('getAllStatus returns an array of TestSuiteExecutionStatus object',
    async(inject([TestSuiteExecutionService, HttpTestingController],
    (service: TestSuiteExecutionService, httpMock: HttpTestingController) => {
    // given
    const testExecutionRequest: RequestMatch = {
      method: 'GET',
      url: serviceConfig.testSuiteExecutionServiceUrl + '/status'
    };
    const mockResponse: AllStatusResponse[] = [
      { key: { suiteId: '1234', suiteRunId: '5678' }, status: 'RUNNING' },
      { key: { suiteId: '1234', suiteRunId: '4711' }, status: 'SUCCESS' },
      { key: { suiteId: '4321', suiteRunId: '1111' }, status: 'FAILED' },
      { key: { suiteId: '1234', suiteRunId: '9876' }, status: 'IDLE' },
    ];

    // when
    service.getAllStatus()

    // then
    .then((actualStatus) => {
      expect(actualStatus.length).toEqual(4);
      expect(actualStatus).toContain({
        resourceURL: serviceConfig.testSuiteExecutionServiceUrl + '/1234/5678',
        status: TestExecutionState.Running
      });
      expect(actualStatus).toContain({
        resourceURL: serviceConfig.testSuiteExecutionServiceUrl + '/1234/4711',
        status: TestExecutionState.LastRunSuccessful
      });
      expect(actualStatus).toContain({
        resourceURL: serviceConfig.testSuiteExecutionServiceUrl + '/4321/1111',
        status: TestExecutionState.LastRunFailed
      });
      expect(actualStatus).toContain({
        resourceURL: serviceConfig.testSuiteExecutionServiceUrl + '/1234/9876',
        status: TestExecutionState.Idle
      });
    });

    httpMock.expectOne(testExecutionRequest).flush(mockResponse);
  })));




});
