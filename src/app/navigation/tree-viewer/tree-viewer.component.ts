import { Component, Input, OnInit } from '@angular/core';
import { NavigationChannelComponent } from '../../navigation-channel/navigation-channel.component';
import { NavigationEventType } from '../../navigation-channel/navigation-event';
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

  @Input() model: WorkspaceElement;

  constructor(private navigationChannel: NavigationChannelComponent) {
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
    this.navigationChannel.emitNavEvent({ source: TreeViewerComponent.EVENT_SOURCE, type: NavigationEventType.selectTreeElement, content: { path: this.model.path, name: this.model.name }});
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
