import { Response } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';
import { TestExecutionServiceConfig } from './test.execution.service.config';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { WorkspaceElement } from '@testeditor/workspace-navigator';
import { ElementState } from './element.state';

export interface TestExecutionStatus {
  path: string,
  status: string
}

export abstract class TestExecutionService {
  abstract execute(path: string): Promise<Response>;
  abstract getStatus(workspaceElement: WorkspaceElement): Promise<TestExecutionStatus>;
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

  getStatus(workspaceElement: WorkspaceElement): Promise<TestExecutionStatus> {
    return this.http.get(this.getURL(workspaceElement.path, DefaultTestExecutionService.statusURLPath) + '&wait=true').toPromise().then(response => {
      let status: TestExecutionStatus = { path: workspaceElement.path, status: response.text() };
      return status;
    });
  }

  getAllStatus(): Promise<TestExecutionStatus[]> {
    return this.http.get(`${this.serviceUrl}${DefaultTestExecutionService.statusAllURLPath}`).toPromise().then(response => {
      let status: TestExecutionStatus[] = response.json();
      return status;
    });
  }

  private getURL(workspaceElementPath: string, urlPath: string = ''): string {
    let encodedPath = workspaceElementPath.split('/').map(encodeURIComponent).join('/');
    return `${this.serviceUrl}${urlPath}?resource=${encodedPath}`;
  }

}
