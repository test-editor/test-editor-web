import { Component, OnInit, ViewChild } from '@angular/core';

import * as constants from '../config/app-config'

declare var createXtextEditor: any;

@Component({
    selector: 'xtext-editor',
    styleUrls: ['./ace-component.css'],
    template: `<div id="xtext-editor" class="xtext-editor"></div>`
})
export class AceComponentComponent {

    @ViewChild('editor') editor;

    ngAfterViewInit() {
      createXtextEditor('xtext-editor', 'example.tsl', constants.appConfig.serviceUrls.xtextService);
    }

}
