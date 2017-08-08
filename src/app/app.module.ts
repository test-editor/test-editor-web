import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MessagingModule } from '@testeditor/messaging-service';
import { LibModule } from '@testeditor/workspace-navigator';

import { AppComponent } from './app.component';
import { AceComponentComponent } from './ace-component/ace-component.component';
import { AceEditorDirective, AceEditorComponent } from 'ng2-ace-editor';

import * as constants from './config/app-config';

@NgModule({
  declarations: [
    AppComponent,
    AceComponentComponent,
    AceEditorComponent
  ],
  imports: [
    BrowserModule,
    MessagingModule.forRoot(),
    LibModule.forRoot({
      serviceUrl: constants.appConfig.serviceUrls.persistenceService,
      authorizationHeader: "admin:admin@example.com"
    })
  ],
  bootstrap: [AppComponent, AceComponentComponent]
})
export class AppModule { }
