import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AceComponentComponent } from './ace-component/ace-component.component';
import { NavigationComponent } from './navigation/navigation.component';

import { AceEditorDirective, AceEditorComponent } from 'ng2-ace-editor';

@NgModule({
  declarations: [
    AppComponent,
    AceComponentComponent,
    AceEditorComponent,
    NavigationComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent,AceComponentComponent]
})
export class AppModule { }
