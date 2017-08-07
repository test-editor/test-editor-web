import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MessagingModule } from '@testeditor/messaging-service';
import { LibModule } from '@testeditor/workspace-navigator';

import { AppComponent } from './app.component';
import { AceEditorDirective, AceEditorComponent } from 'ng2-ace-editor';
import { EditorTabsModule } from './editor-tabs/editor-tabs.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    MessagingModule.forRoot(),
    LibModule.forRoot({
      serviceUrl: "http://localhost:9080/workspace",
      authorizationHeader: "admin:admin@example.com"
    }),
    EditorTabsModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
