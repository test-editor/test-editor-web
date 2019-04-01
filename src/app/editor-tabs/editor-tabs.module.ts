import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { HttpProviderService } from '@testeditor/testeditor-commons';
import { TestEditorConfiguration } from 'app/config/test-editor-configuration';
import { TabsModule, TooltipModule } from 'ngx-bootstrap';
import { DocumentService } from '../service/document/document.service';
import { DocumentServiceConfig } from '../service/document/document.service.config';
import { AceClientsideSyntaxHighlightingService } from '../service/syntaxHighlighting/ace.clientside.syntax.highlighting.service';
import { SyntaxHighlightingService } from '../service/syntaxHighlighting/syntax.highlighting.service';
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

  static forRoot(config: DocumentServiceConfig, testEditorConfig: TestEditorConfiguration): ModuleWithProviders {
    return {
      ngModule: EditorTabsModule,
      providers: [
        { provide: DocumentServiceConfig, useValue: config },
        { provide: SyntaxHighlightingService, useClass: AceClientsideSyntaxHighlightingService },
        DocumentService,
        HttpProviderService,
        { provide: TestEditorConfiguration, useValue: testEditorConfig }
      ]
    };
  }

}
