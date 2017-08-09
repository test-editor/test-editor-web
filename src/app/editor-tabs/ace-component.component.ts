import { Component, Input } from '@angular/core';
import { Deferred } from 'prophecy/src/Deferred';

import * as constants from '../config/app-config'

declare var createXtextEditor: any;

@Component({
  selector: 'xtext-editor',
  styleUrls: ['./ace-component.css'],
  template: `<div [id]="myId" class="xtext-editor"><ng-content></ng-content></div>`
})
export class AceComponentComponent {

  static count: number = 0;

  @Input() initialContent: Promise<string>;
  editor: Promise<any>;
  myId: string;

  constructor() {
    let number = AceComponentComponent.count++;
    this.myId = `xtext-editor-${number}`;
  }

  ngAfterViewInit() {
    let deferred: Deferred = createXtextEditor(this.myId, constants.appConfig.serviceUrls.xtextService);
    this.editor = deferred.promise;
    Promise.all([this.editor, this.initialContent]).then(([editor, content]) => {
      editor.setValue(content);
    });
  }

}
