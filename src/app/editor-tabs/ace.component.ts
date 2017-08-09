import { Component, Input } from '@angular/core';
import { Deferred } from 'prophecy/src/Deferred';

import * as constants from '../config/app-config'

declare var createXtextEditor: any;

@Component({
  selector: 'xtext-editor',
  templateUrl: './ace.component.html',
  styleUrls: ['./ace.component.css']
})
export class AceComponent {

  @Input() initialContent: Promise<string>;
  @Input() tabId: string;
  editor: Promise<any>;
  id: string;

  ngAfterViewInit() {
    let editorId = `${this.tabId}-editor`;
    let deferred: Deferred = createXtextEditor(this.tabId, editorId, constants.appConfig.serviceUrls.xtextService);
    this.editor = deferred.promise;
    Promise.all([this.editor, this.initialContent]).then(([editor, content]) => {
      editor.setValue(content);
      editor.xtextServices.editorContext.setDirty(false);
    });
  }

}
