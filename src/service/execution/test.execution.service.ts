import { Response } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';
import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { WorkspaceElement } from '@testeditor/workspace-navigator';
import { TestExecutionState } from './test.execution.state';

export interface TestExecutionStatus {
  path: string;
  status: TestExecutionState;
}

export abstract class TestExecutionService {
  abstract execute(path: string): Promise<Response>;
  abstract getStatus(path: string): Promise<TestExecutionStatus>;
  abstract getAllStatus(): Promise<TestExecutionStatus[]>;

}

@Injectable()
export class DefaultTestExecutionService extends TestExecutionService {

  private static readonly statusURLPath = '/status';
  private static readonly executeURLPath = '/execute';
  private static readonly statusAllURLPath = '/status/all';
  private serviceUrl: string;

  constructor(private http: AuthHttp, private config: TestExecutionServiceConfig) {
    super();
    this.serviceUrl = config.serviceUrl;
  }

  execute(path: string): Promise<Response> {
    return this.http.post(this.getURL(path, DefaultTestExecutionService.executeURLPath), '').toPromise();
  }

  getStatus(path: string): Promise<TestExecutionStatus> {
    return this.http.get(this.getURL(path, DefaultTestExecutionService.statusURLPath) + '&wait=true').toPromise().then(response => {
      const status: TestExecutionStatus = { path: path, status: this.toTestExecutionState(response.text()) };
      return status;
    });
  }

  getAllStatus(): Promise<TestExecutionStatus[]> {
    return this.http.get(`${this.serviceUrl}${DefaultTestExecutionService.statusAllURLPath}`).toPromise().then(response => {
      const status: any[] = response.json();
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
