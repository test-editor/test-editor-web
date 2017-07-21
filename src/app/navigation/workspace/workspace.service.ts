import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { WorkspaceElement } from './workspace-element';
import 'rxjs/add/operator/toPromise';

const mockData: WorkspaceElement = {
  "name": "workspace (admin)",
  "path": "",
  "expanded": true,
  "type": "folder",
  "children": [
    {
      "name": "example.mydsl",
      "path": "example.mydsl",
      "expanded": false,
      "type": "file",
      "children": []
    },
    {
      "name": "some-folder",
      "path": "some-folder",
      "expanded": false,
      "type": "folder",
      "children": [
        { "name" : "empty-folder",
          "path": "some-folder/empty-folder",
          "expanded": false,
          "type": "folder",
          "children": [] },
        {
          "name": "some-subfolder",
          "path": "some-folder/some-subfolder",
          "expanded": false,
          "type": "folder",
          "children": [
            {
              "name": "afile.mydsl",
              "path": "some-folder/some-subfolder/afile.mydsl",
              "expanded": false,
              "type": "file",
              "children": []
            },
            {
              "name": "some-file",
              "path": "some-folder/some-subfolder/some-file",
              "expanded": false,
              "type": "some-file",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}

@Injectable()
export class WorkspaceService {

  private workspaceUrl = 'http://localhost:8080/workspace/list-files';

  constructor(private http: Http) { }

  createAuthorizationHeader(headers: Headers) {
    headers.append('Authorization', 'admin:admin@example.com');
  }

  listFiles(): Promise<WorkspaceElement> {
    let headers = new Headers();
    this.createAuthorizationHeader(headers);
    return this.http.get(this.workspaceUrl, { headers: headers }).toPromise().then(res => res.json()).catch(this.handleError)
    // return Promise.resolve(mockData);
  }
  
  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

}
