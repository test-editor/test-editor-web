import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TabsModule, TooltipModule } from 'ngx-bootstrap';

import { AceComponent } from './ace.component';
import { EditorTabsComponent } from './editor-tabs.component';

@NgModule({
  imports: [
    CommonModule,
    TabsModule.forRoot(),
    TooltipModule.forRoot()
  ],
  declarations: [
    AceComponent,
    EditorTabsComponent
  ],
  exports: [
    AceComponent,
    EditorTabsComponent
  ]
})
export class EditorTabsModule {
}