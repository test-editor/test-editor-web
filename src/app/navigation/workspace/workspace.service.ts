import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { WorkspaceElement } from './workspace-element';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class WorkspaceService {

  private workspaceUrl = 'http://localhost:9080/workspace/list-files';

  constructor(private http: Http) { }

  createDummyHeader(): Headers {
    const headers = new Headers();
    headers.append('Authorization', 'admin:admin@example.com');
    return headers;
  }

  listFiles(): Promise<WorkspaceElement> {
    const headers = this.createDummyHeader();
    return this.http.get(this.workspaceUrl, { headers: headers }).toPromise()
      .then(response => response.json())
      .catch(this.handleError);
  }
  
  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

}
