import { Component, Input, OnInit } from '@angular/core';
import { NavigationServiceComponent } from '../../navigation-service/navigation-service.component';
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

  constructor(private navigationService: NavigationServiceComponent) {
      navigationService.event$.subscribe(message => { console.log('TreeViewerComponent: '+message); });
  }

  ngOnInit() {
  }

  onClick() {
    switch (this.model.type) {
    case TreeViewerComponent.FOLDER:
      this.model.expanded = !this.model.expanded;
      this.navigationService.emit("toggle folder " + this.model.name);
      break;
    case TreeViewerComponent.FILE:
      this.navigationService.emit("open editor for file " + this.model.path);
      break;
    default:
      this.navigationService.emit("clicked unknown filetype '" + this.model.type + "'");
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
