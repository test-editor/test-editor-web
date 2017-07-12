import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NavigationComponent } from './navigation.component';
import { TreeViewerComponent } from './tree-viewer/tree-viewer.component';

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
  ]
})
export class NavigationModule { }
