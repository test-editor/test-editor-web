import { Component, Input, AfterViewInit, isDevMode, OnDestroy, NgZone } from '@angular/core';
import { Deferred } from 'prophecy/src/Deferred';

import { MessagingService } from '@testeditor/messaging-service';
import { DocumentService } from '../service/document/document.service';
import { DirtyState } from './dirty-state';

import * as constants from '../config/app-config';
import * as events from './event-types';

import { SyntaxHighlightingService } from '../service/syntaxHighlighting/syntax.highlighting.service';

import { isConflict, Conflict } from '../service/document/conflict';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ModalDialogComponent } from '../dialogs/modal.dialog.component';
import { Subscription } from 'rxjs/Subscription';
import { WORKSPACE_RELOAD_RESPONSE } from '@testeditor/workspace-navigator';

declare var createXtextEditor: (config: any) => Deferred;

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

  private createEditor(): Promise<any> {
    const editorId = `${this.tabId}-editor`;
    return this.findSyntaxDefinitionFile().then(syntaxDefinitionFilePath => {
      const isKnownLanguage = syntaxDefinitionFilePath !== AceComponent.UNKNOWN_LANGUAGE_SYNTAX_PATH;
      const config = {
        baseUrl: window.location.origin,
        serviceUrl: constants.appConfig.serviceUrls.xtextService,
        parent: editorId,
        dirtyElement: document.getElementsByClassName(this.tabId),
        loadFromServer: false,
        sendFullText: true,
        resourceId: this.path,
        syntaxDefinition: syntaxDefinitionFilePath,
        enableOccurrencesService: isKnownLanguage,
        enableValidationService: isKnownLanguage,
        enableSaveAction: false // don't want the default xtext-save action
      };
      const deferred = createXtextEditor(config);
      return deferred.promise;
    });
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

  private findSyntaxDefinitionFile(): Promise<string> {
    return this.syntaxHighlightingService.getSyntaxHighlighting(this.getFileExtension())
      .then(path => {
        console.log(`using syntax highlighting rules from "${path}"`);
        return path;
      })
      .catch(() => {
        console.log(`no syntax highlighting rules available for this file type ("${this.path}")`);
        return AceComponent.UNKNOWN_LANGUAGE_SYNTAX_PATH;
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
