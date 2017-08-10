import { Component, Input, AfterViewInit } from '@angular/core';
import { Deferred } from 'prophecy/src/Deferred';

import { DocumentService } from './document.service';

import * as constants from '../config/app-config'

declare var createXtextEditor: (config: any) => Deferred;

@Component({
  selector: 'xtext-editor',
  templateUrl: './ace.component.html',
  styleUrls: ['./ace.component.css']
})
export class AceComponent implements AfterViewInit {

  @Input() path: string;
  @Input() tabId: string;
  editor: Promise<any>;

  constructor(private documentService: DocumentService) {
  }

  ngAfterViewInit(): void {
    this.editor = this.createEditor();
    this.editor.then(editor => this.initializeEditor(editor));
  }

  private createEditor(): Promise<any> {
    let editorId = `${this.tabId}-editor`;
    let config = {
      baseUrl: window.location.origin,
      serviceUrl: constants.appConfig.serviceUrls.xtextService,
      parent: editorId,
      dirtyElement: document.getElementsByClassName(this.tabId),
      loadFromServer: false,
      sendFullText: true,
      resourceId: this.path,
      syntaxDefinition: "xtext-resources/generated/mode-tsl",
      enableSaveAction: false // don't want the default xtext-save action
    }
    let deferred = createXtextEditor(config);
    return deferred.promise;
  }

  private initializeEditor(editor: any): void {
    // Set initial content
    this.documentService.loadDocument(this.path).then(response => {
      this.setContent(response.text());
    }).catch(reason => {
      this.setContent(`Could not load resource: ${this.path}\n\nReason:\n${reason}`);
      this.setReadOnly(true);
    });

    // Configure save action
    editor.commands.addCommand({
      name: 'angular-xtext-save',
      bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
      exec: this.save.bind(this)
    });

    // TODO for debugging only
    window["editor"] = editor;
  }

  private setContent(content: string): void {
    this.editor.then(editor => {
      editor.setValue(content);
      this.setDirty(false);
      editor.session.selection.clearSelection();
    });
  }

  public save(): void {
    this.editor.then(editor => {
      editor.setReadOnly(true);
      this.documentService.saveDocument(this.path, editor.getValue()).then(res => {
        this.setDirty(false);
        editor.setReadOnly(false);
      }).catch(reason => {
        console.log(reason);
        editor.setReadOnly(false);
      });
    });
  }

  public setDirty(dirty: boolean): void {
    this.editor.then(editor => editor.xtextServices.editorContext.setDirty(dirty));
  }

  public setReadOnly(readOnly: boolean): void {
    this.editor.then(editor => editor.setReadOnly(readOnly));
  }

}
