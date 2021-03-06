import { AfterViewInit, Component, Input, isDevMode, NgZone, OnDestroy } from '@angular/core';
import { MessagingService } from '@testeditor/messaging-service';
import { SNACKBAR_DISPLAY_NOTIFICATION, WORKSPACE_RELOAD_RESPONSE } from '@testeditor/test-navigator';
import { isConflict } from '@testeditor/testeditor-commons';
import { TestEditorConfiguration } from 'app/config/test-editor-configuration';
import { Deferred } from 'prophecy/src/Deferred';
import { Subscription } from 'rxjs';
import { DocumentService } from '../service/document/document.service';
import { SyntaxHighlightingService } from '../service/syntaxHighlighting/syntax.highlighting.service';
import { DirtyState } from './dirty-state';
import { TabInformer } from './editor-tabs.component';
import * as events from './event-types';

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

  saveActionRunning = false;
  oldCursorDisplayStyle: any = { }; // cursor style within the editor, saved by setCursorVisibility

  @Input() path: string;
  @Input() tabId: string;
  @Input() tabInformer: TabInformer;
  editor: Promise<any>;

  subscription: Subscription;

  constructor(public zone: NgZone, private documentService: DocumentService, private messagingService: MessagingService,
              private syntaxHighlightingService: SyntaxHighlightingService,
              private zoneConfiguration: AceEditorZoneConfiguration,
              private config: TestEditorConfiguration) {
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
          this.documentService.loadDocument(this.tabInformer, this.path).then(content => this.setContent(editor, content));
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

  private async initializeEditor(editor: any): Promise<void> {
    // Set initial content
    this.messagingService.publish(events.EDITOR_BUSY_ON, { });
    try { // wrap in try to make sure that EDITOR_BUSY_OFF is always published
      this.setContent(editor, '// loading ...\n');
      try {
        const text = await this.documentService.loadDocument(this.tabInformer, this.path);
        this.setContent(editor, text);
        editor.xtextServices.editorContext.addDirtyStateListener(this.onDirtyChange.bind(this));
      } catch (reason) {
        if (isDevMode()) {
          console.log(reason);
        }
        this.setContent(editor, `Could not load resource: ${this.path}\n\nReason:\n${reason}`);
        this.setReadOnly(true);
      }

      // Configure save action
      editor.commands.addCommand({
        name: 'angular-xtext-save',
        bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
        exec: this.save.bind(this)
      });

      this.focus(editor);

      // TODO for debugging only
      window['editor'] = editor;
    } catch (error) {
      if (isDevMode()) {
        console.log(error);
      }
    }
    this.messagingService.publish(events.EDITOR_BUSY_OFF, { });
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
    this.messagingService.publish(events.EDITOR_BUSY_ON, { });
    try { // wrap to make sure EDITOR_BUSY_OFF is always called
      const editor = await this.editor;
      const content = await this.documentService.loadDocument(this.tabInformer, this.path);
      this.setContent(editor, content);
    } catch (reason) {
      if (isDevMode()) {
        console.log(reason);
      }
    }
    this.messagingService.publish(events.EDITOR_BUSY_OFF, { });
  }

  public resize(): void {
    this.editor.then(editor => {
      editor.resize();
    });
  }

  public async focus(editor?: any) {
    if (!editor) {
      editor = await this.editor;
    }
    editor.focus();
  }

  private async createXtextConfig(resourcePath: string, tabId: string): Promise<any> {
    const editorId = `${tabId}-editor`;
    const syntaxDefinitionFilePath = await this.findSyntaxDefinitionFile();
    const isKnownLanguage = syntaxDefinitionFilePath !== AceComponent.UNKNOWN_LANGUAGE_SYNTAX_PATH;
    return {
      baseUrl: window.location.origin,
      serviceUrl: this.config.serviceUrls.xtextService,
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

  public async save(): Promise<void> {
    if (this.saveActionRunning) {
      console.warn('save action already running');
    } else {
      this.saveActionRunning = true;
      const originalPath = this.path;
      const editor = await this.editor;
      this.messagingService.publish(events.EDITOR_BUSY_ON, { });
      try {
        this.setCursorVisibility(editor, false);
        let status = await this.documentService.saveDocument(this.tabInformer, this.path, editor.getValue());
        if (isConflict(status) && (this.path !== originalPath)) {
          console.log(`rename of ${originalPath} to ${this.path} took place, retry save`);
          status = await this.documentService.saveDocument(this.tabInformer, this.path, editor.getValue());
        }
        if (isConflict(status)) {
          console.error(`saving ${this.path} failed`);
          this.messagingService.publish(events.EDITOR_SAVE_FAILED, { path: this.path, reason: status.message });
        } else {
          if (isDevMode()) {
            console.log(`start saving ${this.path}`);
          }
          const cursorPosition = editor.getCursorPosition();
          const content = editor.getValue();
          editor.setReadOnly(false);
          editor.setValue(content);
          editor.session.selection.clearSelection();
          editor.moveCursorToPosition(cursorPosition);
          editor.xtextServices.editorContext.setDirty(false);
          this.messagingService.publish(events.EDITOR_SAVE_COMPLETED, { path: this.path });
          if (isDevMode()) {
            console.log(`successfully saved ${this.path}`);
          }
        }
      } catch (error) {
        console.error(`saving ${this.path} failed`);
        console.error(error);
        this.messagingService.publish(events.EDITOR_SAVE_FAILED, { path: this.path, reason: error });
        this.messagingService.publish(SNACKBAR_DISPLAY_NOTIFICATION, {
          message: 'Failed to save your changes. Please retry or copy elsewhere.' });
      }
      this.setCursorVisibility(editor, true);
      this.messagingService.publish(events.EDITOR_BUSY_OFF, { });
      this.saveActionRunning = false;
    }
  }

  private setCursorVisibility(editor: any, visible: boolean) {
    if (visible) {
      editor.renderer.$cursorLayer.element.style.display = this.oldCursorDisplayStyle;
      editor.setOptions({readOnly: false, highlightActiveLine: true, highlightGutterLine: true});
      editor.setReadOnly(false);
    } else {
      editor.setOptions({readOnly: true, highlightActiveLine: false, highlightGutterLine: false});
      this.oldCursorDisplayStyle = editor.renderer.$cursorLayer.element.style.display;
      editor.renderer.$cursorLayer.element.style.display = 'none';
    }
  }

  public async isDirty(): Promise<boolean> {
    const editor = await this.editor;
    const result = editor.xtextServices.editorContext.isDirty();
    return result;
  }

  public setDirty(dirty: boolean): void {
    this.editor.then(editor => editor.xtextServices.editorContext.setDirty(dirty));
  }

  public setReadOnly(readOnly: boolean): void {
    this.editor.then(editor => editor.setReadOnly(readOnly));
  }

}
