import { Component, Input, OnInit } from '@angular/core';

import { WorkspaceElement } from '../workspace/workspace-element';

@Component({
  selector: 'nav-tree-viewer',
  templateUrl: './tree-viewer.component.html',
  styleUrls: ['./tree-viewer.component.css']
})
export class TreeViewerComponent implements OnInit {

  @Input() model: WorkspaceElement;

  constructor() { }

  ngOnInit() {
  }

  onClick() {
    if (this.model.type == "folder") {
      this.model.expanded = !this.model.expanded;
      console.log("toggle folder " + this.model.name + ", " + this.model.expanded);
    } else if (this.model.type == "file") {
      console.log("open editor for file " + this.model.path);
    } else {
      console.log("no action for file type " + this.model.type);
    }
  }

  isFolderExpanded() : boolean {
    return this.model.expanded && this.model.children.length > 0 && this.model.type == "folder";
  }

  isFolderFolded() : boolean {
    return !this.model.expanded && this.model.children.length > 0 && this.model.type == "folder";
  }

  isEmptyFolder() : boolean {
    return this.model.children.length == 0 && this.model.type == "folder";
  }

  isFile() : boolean {
    return this.model.children.length == 0 && this.model.type == "file";
  }

  isUnknown() : boolean {
    return this.model.type !== "file" && this.model.type !== "folder";
  }

}
