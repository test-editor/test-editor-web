import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Injectable } from '@angular/core';
import { TestExecutionState } from './test.execution.state';
import { HttpClient } from '@angular/common/http';

export interface TestExecutionStatus {
  path: string;
  status: TestExecutionState;
}

export abstract class TestExecutionService {
  abstract execute(path: string): Promise<any>;
  abstract getStatus(path: string): Promise<TestExecutionStatus>;
  abstract getAllStatus(): Promise<TestExecutionStatus[]>;
}

@Injectable()
export class DefaultTestExecutionService extends TestExecutionService {

  private static readonly statusURLPath = '/status';
  private static readonly executeURLPath = '/execute';
  private static readonly statusAllURLPath = '/status/all';
  private serviceUrl: string;

  constructor(private http: HttpClient, config: TestExecutionServiceConfig) {
    super();
    this.serviceUrl = config.serviceUrl;
  }

  execute(path: string): Promise<any> {
    return this.http.post(this.getURL(path, DefaultTestExecutionService.executeURLPath), '').toPromise();
  }

  getStatus(path: string): Promise<TestExecutionStatus> {
    return this.http.get(this.getURL(path, DefaultTestExecutionService.statusURLPath) + '&wait=true', { responseType: 'text' })
      .toPromise().then(text => {
        const status: TestExecutionStatus = { path: path, status: this.toTestExecutionState(text) };
        return status;
      });
  }

  getAllStatus(): Promise<TestExecutionStatus[]> {
    return this.http.get<any[]>(`${this.serviceUrl}${DefaultTestExecutionService.statusAllURLPath}`).toPromise().then(status => {
      status.forEach((value) => { value.status = this.toTestExecutionState(value.status); });
      return status;
    });
  }

  private getURL(workspaceElementPath: string, urlPath: string = ''): string {
    const encodedPath = workspaceElementPath.split('/').map(encodeURIComponent).join('/');
    return `${this.serviceUrl}${urlPath}?resource=${encodedPath}`;
  }

  private toTestExecutionState(state: string): TestExecutionState {
    switch (state) {
      case 'RUNNING': return TestExecutionState.Running;
      case 'FAILED': return TestExecutionState.LastRunFailed;
      case 'SUCCESS': return TestExecutionState.LastRunSuccessful;
      case 'IDLE': return TestExecutionState.Idle;
      default: return TestExecutionState.Idle;
    }
  }

}
