import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { LibModule } from '@testeditor/workspace-navigator';

import { AppComponent } from './app.component';
import { AceComponentComponent } from './ace-component/ace-component.component';
import { AceEditorDirective, AceEditorComponent } from 'ng2-ace-editor';

import { NavigationChannelModule } from './navigation-channel/navigation-channel.module'

@NgModule({
  declarations: [
    AppComponent,
    AceComponentComponent,
    AceEditorComponent
  ],
  imports: [
    BrowserModule,
    NavigationChannelModule,
    LibModule.forRoot({
      serviceUrl: "http://localhost:9080/workspace",
      authorizationHeader: "admin:admin@example.com"
    })
  ],
  bootstrap: [AppComponent, AceComponentComponent]
})
export class AppModule { }
