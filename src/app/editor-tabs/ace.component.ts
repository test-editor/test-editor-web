import { Component, Input, AfterViewInit, isDevMode } from '@angular/core';
import { Deferred } from 'prophecy/src/Deferred';

import { MessagingService } from '@testeditor/messaging-service';
import { DocumentService } from '../../service/document/document.service';
import { DirtyState } from './dirty-state';

import * as constants from '../config/app-config';
import * as events from './event-types';

import { SyntaxHighlightingService } from 'service/syntaxHighlighting/syntax.highlighting.service';

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

  constructor(private documentService: DocumentService, private messagingService: MessagingService,
    private syntaxHighlightingService: SyntaxHighlightingService) {
  }

  ngAfterViewInit(): void {
    this.editor = this.createEditor();
    this.editor.then(editor => this.initializeEditor(editor));
  }

  private createEditor(): Promise<any> {
    const editorId = `${this.tabId}-editor`;
    return this.findSyntaxDefinitionFile().then(syntaxDefinitionFilePath => {
      const config = {
        baseUrl: window.location.origin,
        serviceUrl: constants.appConfig.serviceUrls.xtextService,
        parent: editorId,
        dirtyElement: document.getElementsByClassName(this.tabId),
        loadFromServer: false,
        sendFullText: true,
        resourceId: this.path,
        syntaxDefinition: syntaxDefinitionFilePath,
        enableSaveAction: false // don't want the default xtext-save action
      };
      const deferred = createXtextEditor(config);
      return deferred.promise;
    });
  }

  private initializeEditor(editor: any): void {
    // Set initial content
    this.documentService.loadDocument(this.path).then(text => {
      this.setContent(editor, text);
      editor.xtextServices.editorContext.addDirtyStateListener(this.onDirtyChange.bind(this));
    }).catch(reason => {
      if (isDevMode()) {
        console.log(reason);
      }
      this.setContent(editor, `Could not load resource: ${this.path}\n\nReason:\n${reason}`);
      this.setReadOnly(true);
    });

    // Configure save action
    editor.commands.addCommand({
      name: 'angular-xtext-save',
      bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
      exec: this.save.bind(this)
    });

    this.focus();

    // TODO for debugging only
    window['editor'] = editor;
  }

  private setContent(editor: any, content: string): void {
    editor.setValue(content);
    this.setDirty(false);
    editor.session.selection.clearSelection();
  }

  private onDirtyChange(dirty: boolean): void {
    const dirtyState: DirtyState = {
      path: this.path,
      dirty: dirty
    };
    this.messagingService.publish(events.EDITOR_DIRTY_CHANGED, dirtyState);
  }

  private findSyntaxDefinitionFile(): Promise<string> {
    return this.syntaxHighlightingService.getSyntaxHighlighting(this.getFileExtension())
      .then(path => {
        console.log(`using syntax highlighting rules from "${path}"`);
        return path;
      })
      .catch(() => {
        console.log(`no syntax highlighting rules available for this file type ("${this.path}")`);
        return 'none';
      });
  }

  private getFileExtension(): string {
    const extensionBeginsAfter = this.path.lastIndexOf('.');
    if (extensionBeginsAfter !== -1 && this.path.length > extensionBeginsAfter + 1) {
      return this.path.substring(extensionBeginsAfter + 1);
    }
    return '';
  }

  public focus(): void {
    this.editor.then(editor => {
      editor.focus();
    });
  }

  public save(): void {
    this.editor.then(editor => {
      editor.setReadOnly(true);
      this.documentService.saveDocument(this.path, editor.getValue()).then(res => {
        this.setDirty(false);
        editor.setReadOnly(false);
        this.messagingService.publish(events.EDITOR_SAVE_COMPLETED, { path: this.path });
      }).catch(reason => {
        console.log(reason);
        editor.setReadOnly(false);
        this.messagingService.publish(events.EDITOR_SAVE_FAILED, { path: this.path, reason: reason });
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
