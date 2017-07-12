import { Component, Input, OnInit } from '@angular/core';

import { WorkspaceElement } from '../workspace/workspace-element';

@Component({
  selector: 'nav-tree-viewer',
  templateUrl: './tree-viewer.component.html',
  styleUrls: ['./tree-viewer.component.css']
})
export class TreeViewerComponent implements OnInit {

  @Input() root: WorkspaceElement;

  constructor() { }

  ngOnInit() {
  }

}
