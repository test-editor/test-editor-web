import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TabsModule, TooltipModule } from 'ngx-bootstrap';

import { AceComponentComponent } from './ace-component.component';
import { EditorTabsComponent } from './editor-tabs.component';

@NgModule({
  imports: [
    CommonModule,
    TabsModule.forRoot(),
    TooltipModule.forRoot()
  ],
  declarations: [
    AceComponentComponent,
    EditorTabsComponent
  ],
  exports: [
    AceComponentComponent,
    EditorTabsComponent
  ]
})
export class EditorTabsModule {
}