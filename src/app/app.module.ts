import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule }    from '@angular/http';

import { NavigationModule } from './navigation/navigation.module'

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
    HttpModule,
    NavigationModule,
    NavigationChannelModule
  ],
  bootstrap: [AppComponent,AceComponentComponent]
})
export class AppModule { }
