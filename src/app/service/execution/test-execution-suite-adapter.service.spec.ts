import { TestBed, inject, async } from '@angular/core/testing';

import { TestExecutionSuiteAdapterService } from './test-execution-suite-adapter.service';
import { TestSuiteExecutionService, DefaultTestSuiteExecutionService } from './test-suite-execution.service';
import { mock, instance, when, verify, anyString } from 'ts-mockito/lib/ts-mockito';
import { TestExecutionState } from './test.execution.state';

describe('TestExecutionSuiteAdapterService', () => {
  const suiteResourceUrlForTesting = 'http://example.org/test-suite/123/456';
  let mockDelegateService: TestSuiteExecutionService;

  beforeEach(async(() => {
    mockDelegateService = mock(DefaultTestSuiteExecutionService);
    when(mockDelegateService.execute(anyString())).thenReturn(Promise.resolve(suiteResourceUrlForTesting));
    when(mockDelegateService.getStatus(suiteResourceUrlForTesting + '?status')).thenReturn(Promise.resolve({
      resourceURL: suiteResourceUrlForTesting, status: TestExecutionState.Running }));
    TestBed.configureTestingModule({
      providers: [
        TestExecutionSuiteAdapterService,
        { provide: TestSuiteExecutionService, useValue: instance(mockDelegateService) }
      ]
    }).compileComponents();
  }));

  it('should be created', inject([TestExecutionSuiteAdapterService], (service: TestExecutionSuiteAdapterService) => {
    expect(service).toBeTruthy();
  }));

  it('execute delegates to TestSuiteExecutionService::execute', inject([TestExecutionSuiteAdapterService],
    async (service: TestExecutionSuiteAdapterService) => {
    // given
    const path = '/path/to/some/file';

    // when
    await service.execute(path);

    // then
    verify(mockDelegateService.execute(path)).once();
  }));

  it('returns the status of a previously started test suite', inject([TestExecutionSuiteAdapterService],
    async (service: TestExecutionSuiteAdapterService) => {
    // given
    const path = '/path/to/some/file';
    await service.execute(path);

    // when
    const testExecutionStatus = await service.getStatus(path);

    // then
    expect(testExecutionStatus.path).toEqual(path);
    expect(testExecutionStatus.status).toEqual(TestExecutionState.Running);
    verify(mockDelegateService.getStatus(suiteResourceUrlForTesting + '?status')).once();
  }));

  it('returns test status IDLE when there is no known test suite for a given path', inject([TestExecutionSuiteAdapterService],
    async (service: TestExecutionSuiteAdapterService) => {
    // given
    const path = '/path/to/some/file';

    // when
    const testExecutionStatus = await service.getStatus(path);

    // then
    expect(testExecutionStatus.path).toEqual(path);
    expect(testExecutionStatus.status).toEqual(TestExecutionState.Idle);
    verify(mockDelegateService.getStatus(suiteResourceUrlForTesting + '?status')).never();
  }));
});
