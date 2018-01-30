import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TabsModule, TooltipModule } from 'ngx-bootstrap';

import { AceComponent } from './ace.component';
import { EditorTabsComponent } from './editor-tabs.component';
import { DocumentService } from '../../service/document/document.service';
import { DocumentServiceConfig } from '../../service/document/document.service.config';
import { SyntaxHighlightingService } from '../../service/syntaxHighlighting/syntax.highlighting.service';
import { AceClientsideSyntaxHighlightingService } from '../../service/syntaxHighlighting/ace.clientside.syntax.highlighting.service';

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
        { provide: SyntaxHighlightingService, useClass: AceClientsideSyntaxHighlightingService },
        DocumentService
      ]
    }
  }

}
