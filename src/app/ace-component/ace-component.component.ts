import { Component, OnInit, ViewChild } from '@angular/core';

declare var createXtextEditor: any;
declare var appConfig: any;

@Component({
    selector: 'xtext-editor',
    styleUrls: ['./ace-component.css'],
    template: `<div id="xtext-editor" class="xtext-editor"></div>`
})
export class AceComponentComponent {

    @ViewChild('editor') editor;

    ngAfterViewInit() {
      createXtextEditor('xtext-editor', 'example.tsl', appConfig.serviceUrls.xtextService);
    }

}
