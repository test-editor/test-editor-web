import { Component, Input, AfterViewInit, isDevMode, OnDestroy, NgZone } from '@angular/core';
import { Deferred } from 'prophecy/src/Deferred';

import { MessagingService } from '@testeditor/messaging-service';
import { DocumentService } from '../service/document/document.service';
import { DirtyState } from './dirty-state';

import * as events from './event-types';

import { SyntaxHighlightingService } from '../service/syntaxHighlighting/syntax.highlighting.service';

import { isConflict, Conflict } from '../service/document/conflict';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ModalDialogComponent } from '../dialogs/modal.dialog.component';
import { Subscription } from 'rxjs/Subscription';
import { WORKSPACE_RELOAD_RESPONSE } from '@testeditor/test-navigator';
import '../../assets/configuration.js';
declare var appConfig: Function;

declare var createXtextEditor: (config: any) => Deferred;
declare var reconfigureXtextEditor: (editor: any, config: any) => void;

export class AceEditorZoneConfiguration {
  useOutsideZone: boolean;
}

@Component({
  selector: 'xtext-editor',
  templateUrl: './ace.component.html',
  styleUrls: ['./ace.component.css']
})
export class AceComponent implements AfterViewInit, OnDestroy {

  static readonly UNKNOWN_LANGUAGE_SYNTAX_PATH = 'none';

  @Input() path: string;
  @Input() tabId: string;
  editor: Promise<any>;

  subscription: Subscription;

  constructor(public zone: NgZone, private documentService: DocumentService, private messagingService: MessagingService,
              private syntaxHighlightingService: SyntaxHighlightingService, private modalService: BsModalService,
              private zoneConfiguration: AceEditorZoneConfiguration) {
  }

  ngAfterViewInit(): void {
    if (this.zoneConfiguration.useOutsideZone) {
      this.zone.runOutsideAngular(() => {
        this.editor = this.createEditor();
      });
    } else {
      this.editor = this.createEditor();
    }
    this.editor.then(editor => this.initializeEditor(editor));
    this.subscription = this.messagingService.subscribe(WORKSPACE_RELOAD_RESPONSE, () => {
      this.editor.then(editor => {
        const dirty = editor.xtextServices.editorContext.isDirty();
        if (!dirty) {
          console.log('editor ' + this.path + ' reload because of workspace reload completed');
          this.documentService.loadDocument(this.path).subscribe(content => this.setContent(editor, content));
        } else {
          console.log('editor ' + this.path + ' reload skipped, because it is deemed dirty');
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private async createEditor(): Promise<any> {
    const config = await this.createXtextConfig(this.path, this.tabId);
    console.log('create editor with configuration');
    const deferred = createXtextEditor(config);
    return deferred.promise;
  }

  private initializeEditor(editor: any): void {
    // Set initial content
    this.documentService.loadDocument(this.path).subscribe(text => {
      this.setContent(editor, text);
      editor.xtextServices.editorContext.addDirtyStateListener(this.onDirtyChange.bind(this));
    }, reason => {
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

  private async findSyntaxDefinitionFile(): Promise<string> {
    try {
      const path = await this.syntaxHighlightingService.getSyntaxHighlighting(this.getFileExtension());
      console.log(`using syntax highlighting rules from "${path}"`);
      return path;
    } catch (error) {
      console.log(`no syntax highlighting rules available for this file type ("${this.path}")`);
      console.log(error);
      return AceComponent.UNKNOWN_LANGUAGE_SYNTAX_PATH;
    }
  }

  private getFileExtension(): string {
    const extensionBeginsAfter = this.path.lastIndexOf('.');
    if (extensionBeginsAfter !== -1 && this.path.length > extensionBeginsAfter + 1) {
      return this.path.substring(extensionBeginsAfter + 1);
    }
    return '';
  }

  public async reload(): Promise<void> {
    const editor = await this.editor;
    const content = await this.documentService.loadDocument(this.path).toPromise();
    this.setContent(editor, content);
}

  public resize(): void {
    this.editor.then(editor => {
      editor.resize();
    });
  }

  public focus(): void {
    this.editor.then(editor => {
      editor.focus();
    });
  }

  private async createXtextConfig(resourcePath: string, tabId: string): Promise<any> {
    const editorId = `${tabId}-editor`;
    const syntaxDefinitionFilePath = await this.findSyntaxDefinitionFile();
    const isKnownLanguage = syntaxDefinitionFilePath !== AceComponent.UNKNOWN_LANGUAGE_SYNTAX_PATH;
    return {
      baseUrl: window.location.origin,
      serviceUrl: appConfig().serviceUrls.xtextService,
      parent: editorId,
      dirtyElement: document.getElementsByClassName(tabId),
      loadFromServer: false,
      sendFullText: true,
      resourceId: resourcePath,
      syntaxDefinition: syntaxDefinitionFilePath,
      enableOccurrencesService: isKnownLanguage,
      enableValidationService: isKnownLanguage,
      enableSaveAction: false // don't want the default xtext-save action
    };
  }

  public async renameTo(newPath: string): Promise<void> {
    this.path = newPath;
    const editor = await this.editor;
    const config = await this.createXtextConfig(newPath, this.tabId);
    console.log('reconfigure editor with new configuration');
    reconfigureXtextEditor(editor, config);
  }

  public save(): void {
    this.editor.then(editor => {
      editor.setReadOnly(true);
      this.documentService.saveDocument(this.path, editor.getValue()).subscribe((status) => {
        if (isConflict(status)) {
          this.messagingService.publish(events.WORKSPACE_RELOAD_REQUEST, null);
          this.documentService.loadDocument(this.path).subscribe(content => {
            this.modalService.show(ModalDialogComponent, {initialState: this.getConflictDialogState(status)});
            this.setContent(editor, content);
          }, error => {
            this.modalService.show(ModalDialogComponent, {initialState: this.getConflictDialogState(status)});
            this.messagingService.publish(events.NAVIGATION_DELETED, {
              name: this.path.substr(this.path.lastIndexOf('/') + 1),
              path: this.path,
              type: 'file'});
          });
          this.messagingService.publish(events.EDITOR_SAVE_FAILED, { path: this.path, reason: status.message });
        } else {
          this.documentService.loadDocument(this.path).subscribe(content => this.setContent(editor, content));
          this.setDirty(false);
          this.messagingService.publish(events.EDITOR_SAVE_COMPLETED, { path: this.path });
        }
        editor.setReadOnly(false);

      }, error => {
        console.log(error);
        editor.setReadOnly(false);
        this.messagingService.publish(events.EDITOR_SAVE_FAILED, { path: this.path, reason: error });
      });
    });
  }

  public async isDirty() {
    return (await this.editor).xtextServices.editorContext.isDirty();
  }

  public setDirty(dirty: boolean): void {
    this.editor.then(editor => editor.xtextServices.editorContext.setDirty(dirty));
  }

  public setReadOnly(readOnly: boolean): void {
    this.editor.then(editor => editor.setReadOnly(readOnly));
  }

  private getConflictDialogState(status: Conflict) {
    const buttons = [{
      label: 'OK',
      onClick: (modalRef: BsModalRef) => { modalRef.hide(); }
    }];
    if (status.backupFilePath != null) {
      const decodedBackupFilePath = decodeURIComponent(status.backupFilePath);
      buttons.push({
        label: 'Open backup file',
        onClick: (modalRef: BsModalRef) => {
          this.messagingService.publish(events.NAVIGATION_OPEN, {
            name: decodedBackupFilePath.substr(this.path.lastIndexOf('/') + 1),
            path: decodedBackupFilePath
          });
          modalRef.hide();
        }
      });
    }

    return {
      message: status.message,
      buttons: buttons
    };
  }

}
