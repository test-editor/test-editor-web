import { Component, Input, OnInit } from '@angular/core';
import { NavigationChannel } from '../../navigation-channel/navigation-channel';
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

  static readonly EVENT_SOURCE = "tree-viewer";
  static readonly CLICK_NAV_EVENT_TYPE = "selectTreeElement";

  @Input() model: WorkspaceElement;

  constructor(private navigationChannel: NavigationChannel) {
    navigationChannel.navEvent$.subscribe(navEvent => {
      if (navEvent.source !== TreeViewerComponent.EVENT_SOURCE) {
        console.log("Received navigation event:");
        console.log(navEvent);
      }
    }); // e.g. react on selected editor to open tree accordingly
  }

  ngOnInit() {
  }

  onClick() {
    this.navigationChannel.emitNavEvent({
      source: TreeViewerComponent.EVENT_SOURCE,
      type: TreeViewerComponent.CLICK_NAV_EVENT_TYPE,
      content: { path: this.model.path, name: this.model.name, additionalPayload: "TODO: put file content here" }
    });
    if (this.model.type === TreeViewerComponent.FOLDER) {
      this.model.expanded = !this.model.expanded;
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
