import { Component, OnInit, ViewChild } from '@angular/core';

declare var createXtextEditor: any;

@Component({
    selector: 'xtext-editor',
    styleUrls: ['./ace-component.css'],
    template: `<div [id]="myId" class="xtext-editor"></div>`
})
export class AceComponentComponent {

    static count: number = 0;

    @ViewChild('editor') editor;
    myId: string;

    constructor() {
        let number = AceComponentComponent.count++;
        this.myId = `xtext-editor-${number}`;
    }

    ngAfterViewInit() {
        createXtextEditor(this.myId, 'example.tsl');
    }

}
