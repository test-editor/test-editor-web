import { Injectable } from '@angular/core';

import { WorkspaceElement } from './workspace-element';

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
  
  listFiles(): Promise<WorkspaceElement> {
    return Promise.resolve(mockData);
  }
  
}
