import { Injectable } from '@angular/core';
import { TestExecutionService, TestExecutionStatus } from './test.execution.service';
import { TestSuiteExecutionService, TestSuiteExecutionStatus } from './test-suite-execution.service';
import { TestExecutionState } from './test.execution.state';


/**
 * Provides the interface of TestExecutionService, but internally uses TestSuiteExecutionService.
 */
@Injectable()
export class TestExecutionSuiteAdapterService implements TestExecutionService {
  private readonly path2suite = new Map<string, string>();

  constructor(private suiteService: TestSuiteExecutionService) { }

  async execute(path: string): Promise<any> {
    const resourceURL = await this.suiteService.execute(path);
    if (resourceURL) {
      this.path2suite.set(path, resourceURL);
    } else {
      console.log(`warning: started a test suite run with test '${path}', but did not receive its resource URL.`);
    }
  }

  async getStatus(path: string): Promise<TestExecutionStatus & TestSuiteExecutionStatus> {
    let status = TestExecutionState.Idle;
    if (this.path2suite.has(path)) {
      status = (await this.suiteService.getStatus(this.path2suite.get(path))).status;
    }
    return {
      path: path,
      resourceURL: this.path2suite.get(path),
      status: status
    };
  }

  getAllStatus(): Promise<TestExecutionStatus[]> {
    throw new Error('Method not implemented.');
  }
}
