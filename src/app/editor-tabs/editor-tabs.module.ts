import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TabsModule, TooltipModule } from 'ngx-bootstrap';

import { AceComponent } from './ace.component';
import { EditorTabsComponent } from './editor-tabs.component';
import { DocumentService } from './document.service';
import { DocumentServiceConfig } from './document.service.config';

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

  static forRoot(config: DocumentServiceConfig): ModuleWithProviders {
    return {
      ngModule: EditorTabsModule,
      providers: [
        { provide: DocumentServiceConfig, useValue: config },
        DocumentService
      ]
    }
  }

}