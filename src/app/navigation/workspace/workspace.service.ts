import { Injectable } from '@angular/core';

import { WorkspaceElement } from './workspace-element';

const mockData: WorkspaceElement = {
  "name": "workspace (admin)",
  "path": "",
  "children": [
    {
      "name": "example.mydsl",
      "path": "example.mydsl",
      "children": []
    },
    {
      "name": "some-folder",
      "path": "some-folder",
      "children": [
        {
          "name": "some-subfolder",
          "path": "some-folder/some-subfolder",
          "children": [
            {
              "name": "afile.mydsl",
              "path": "some-folder/some-subfolder/afile.mydsl",
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
  
  listFiles(): Promise<WorkspaceElement> {
    return Promise.resolve(mockData);
  }
  
}