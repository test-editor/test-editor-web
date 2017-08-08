import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MessagingModule } from '@testeditor/messaging-service';
import { WorkspaceNavigatorModule } from '@testeditor/workspace-navigator';

import { AppComponent } from './app.component';
import { EditorTabsModule } from './editor-tabs/editor-tabs.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    MessagingModule.forRoot(),
    WorkspaceNavigatorModule.forRoot({
      serviceUrl: "http://localhost:9080",
      authorizationHeader: "admin:admin@example.com"
    }),
    EditorTabsModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
