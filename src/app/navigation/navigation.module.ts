import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WorkspaceService } from './workspace/workspace.service';
import { TreeViewerComponent } from './tree-viewer/tree-viewer.component';
import { NavigationComponent } from './navigation.component';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    NavigationComponent
  ],
  declarations: [
    NavigationComponent,
    TreeViewerComponent
  ],
  providers: [
    WorkspaceService
  ]
})
export class NavigationModule { }
