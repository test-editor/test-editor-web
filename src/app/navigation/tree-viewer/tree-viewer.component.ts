import { Component, Input, OnInit } from '@angular/core';

import { WorkspaceElement } from '../workspace/workspace-element';

@Component({
  selector: 'nav-tree-viewer',
  templateUrl: './tree-viewer.component.html',
  styleUrls: ['./tree-viewer.component.css']
})
export class TreeViewerComponent implements OnInit {

  // workspace element types
  static readonly FOLDER = "folder";
  static readonly FILE   = "file";

  @Input() model: WorkspaceElement;

  constructor() { }

  ngOnInit() {
  }

  onClick() {
    switch (this.model.type) {
    case TreeViewerComponent.FOLDER:
      this.model.expanded = !this.model.expanded;
      console.log("toggle folder " + this.model.name + ", " + this.model.expanded);
      break;
    case TreeViewerComponent.FILE:
      console.log("open editor for file " + this.model.path);
      break;
    default:
      console.log("no action for type " + this.model.type);
    }
  }

  isFolderExpanded() : boolean {
    return this.model.expanded && this.model.children.length > 0 && this.model.type === TreeViewerComponent.FOLDER;
  }

  isFolderFolded() : boolean {
    return !this.model.expanded && this.model.children.length > 0 && this.model.type === TreeViewerComponent.FOLDER;
  }

  isEmptyFolder() : boolean {
    return this.model.children.length == 0 && this.model.type === TreeViewerComponent.FOLDER;
  }

  isFile() : boolean {
    return this.model.children.length == 0 && this.model.type === TreeViewerComponent.FILE;
  }

  isUnknown() : boolean {
    return this.model.type !== "file" && this.model.type !== TreeViewerComponent.FOLDER;
  }

}
