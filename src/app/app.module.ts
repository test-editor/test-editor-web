import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { NavigationModule } from './navigation/navigation.module'

import { AppComponent } from './app.component';
import { AceComponentComponent } from './ace-component/ace-component.component';

import { AceEditorDirective, AceEditorComponent } from 'ng2-ace-editor';

@NgModule({
  declarations: [
    AppComponent,
    AceComponentComponent,
    AceEditorComponent
  ],
  imports: [
    BrowserModule,
    NavigationModule
  ],
  providers: [],
  bootstrap: [AppComponent,AceComponentComponent]
})
export class AppModule { }
