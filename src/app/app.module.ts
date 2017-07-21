import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { NavigationModule } from './navigation/navigation.module'

import { AppComponent } from './app.component';
import { AceComponentComponent } from './ace-component/ace-component.component';

import { AceEditorDirective, AceEditorComponent } from 'ng2-ace-editor';
import { NavigationChannelComponent } from './navigation-channel/navigation-channel.component';

@NgModule({
  declarations: [
    AppComponent,
    AceComponentComponent,
    AceEditorComponent,
    NavigationChannelComponent
  ],
  imports: [
    BrowserModule,
    NavigationModule
  ],
  bootstrap: [AppComponent,AceComponentComponent]
})
export class AppModule { }
