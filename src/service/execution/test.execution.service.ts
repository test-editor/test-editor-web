import { Response } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';
import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { WorkspaceElement } from '@testeditor/workspace-navigator';
import { ElementState } from './element.state';

export interface TestExecutionStatus {
  path: string,
  status: ElementState
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

  constructor(private http: AuthHttp, config: TestExecutionServiceConfig) {
    super();
    this.serviceUrl = config.testExecutionServiceUrl;
  }

  execute(path: string): Promise<Response> {
    return this.http.post(this.getURL(path, DefaultTestExecutionService.executeURLPath), '').toPromise();
  }

  getStatus(path: string): Promise<TestExecutionStatus> {
    return this.http.get(this.getURL(path, DefaultTestExecutionService.statusURLPath) + '&wait=true').toPromise().then(response => {
      let status: TestExecutionStatus = { path: path, status: this.toElementState(response.text()) };
      return status;
    });
  }

  getAllStatus(): Promise<TestExecutionStatus[]> {
    return this.http.get(`${this.serviceUrl}${DefaultTestExecutionService.statusAllURLPath}`).toPromise().then(response => {
      let status: any[] = response.json();
      status.forEach((value) => { value.status = this.toElementState(value.status) })
      return status;
    });
  }

  private getURL(workspaceElementPath: string, urlPath: string = ''): string {
    let encodedPath = workspaceElementPath.split('/').map(encodeURIComponent).join('/');
    return `${this.serviceUrl}${urlPath}?resource=${encodedPath}`;
  }

  private toElementState(state: string): ElementState {
    switch (state) {
      case 'RUNNING': return ElementState.Running;
      case 'FAILED': return ElementState.LastRunFailed;
      case 'SUCCESS': return ElementState.LastRunSuccessful;
      case 'IDLE': return ElementState.Idle;
      default: return ElementState.Idle;
    }
  }

}
