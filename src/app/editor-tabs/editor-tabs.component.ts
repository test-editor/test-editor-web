import { ChangeDetectorRef, Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { MessagingService } from '@testeditor/messaging-service';
import { Subscription } from 'rxjs';
import { AceComponent } from './ace.component';
import { Element } from './element';
import { TabElement } from './tab-element';
import { NAVIGATION_DELETED, NAVIGATION_OPEN, NAVIGATION_CLOSE, NAVIGATION_RENAMED,
         EDITOR_ACTIVE, EDITOR_CLOSE, FILES_CHANGED, FILES_BACKEDUP, EDITOR_INACTIVE,
         EDITOR_BUSY_ON, EDITOR_BUSY_OFF,
         NavigationDeletedPayload, NavigationOpenPayload, NavigationRenamedPayload,
         FilesBackedupPayload, FilesChangedPayload, BackupEntry, EDITOR_OPEN } from './event-types';
import { SNACKBAR_DISPLAY_NOTIFICATION } from '../snack-bar/snack-bar-event-types';

export interface TabInformer {
  getDirtyTabs(): Promise<string[]>;
  getNonDirtyTabs(): Promise<string[]>;
  handleFileChange(document: string): Promise<void>;
  handleBackupEntry(backupEntry: BackupEntry): void;
}

@Component({
  selector: 'app-editor-tabs',
  // changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editor-tabs.component.html',
  styleUrls: ['./editor-tabs.component.css']
})
export class EditorTabsComponent implements OnInit, OnDestroy, TabInformer {

  /**
   * Provide unique id's for tabs to assign them a unique css class.
   * This is used for the dirty flag.
   */
  static uniqueTabId = 0;

  readonly EDITOR_BUSY_CLASS = 'grayout visible';
  readonly EDITOR_IDLE_CLASS = 'grayout hidden';

  private snackbarEditorBusyTimeout = undefined;

  editorBusyClass = this.EDITOR_IDLE_CLASS;
  @ViewChildren(AceComponent) editorComponents: QueryList<AceComponent>;
  public tabs: TabElement[] = [];
  public tabInformer: TabInformer;
  private subscriptions: Subscription[] = [];

  // changeDetectorRef - see https://github.com/angular/angular/issues/17572#issuecomment-309364246
  constructor(private messagingService: MessagingService, private changeDetectorRef: ChangeDetectorRef) {
    this.tabInformer = this;
  }

  public ngOnInit(): void {
    this.subscriptions.push(this.messagingService.subscribe(
      FILES_CHANGED, (documents: FilesChangedPayload) =>
        documents.forEach((document) => this.handleFileChange(document))));
    this.subscriptions.push(this.messagingService.subscribe(
      FILES_BACKEDUP, (backupEntries: FilesBackedupPayload) =>
        backupEntries.forEach((backupEntry) => this.handleBackupEntry(backupEntry))));
    this.subscriptions.push(this.messagingService.subscribe(NAVIGATION_DELETED, (document: NavigationDeletedPayload) => {
      this.handleNavigationDeleted(document);
    }));
    this.subscriptions.push(this.messagingService.subscribe(NAVIGATION_OPEN, (document: NavigationOpenPayload) => {
      this.handleNavigationOpen(document);
    }));
    this.subscriptions.push(this.messagingService.subscribe(NAVIGATION_CLOSE, () => {
      this.clearTabs();
    }));
    this.subscriptions.push(this.messagingService.subscribe(NAVIGATION_RENAMED, (payload) => {
      this.handleNavigationRenamed(payload);
    }));
    this.subscriptions.push(this.messagingService.subscribe(EDITOR_BUSY_ON, () => {
      this.editorBusyClass = this.EDITOR_BUSY_CLASS;
      this.snackbarEditorBusyTimeout = setTimeout(() => { // make sure that after timeout the application is unlocked
        this.messagingService.publish(EDITOR_BUSY_OFF, { });
        this.messagingService.publish(SNACKBAR_DISPLAY_NOTIFICATION, { message: 'Editor action timed out. Please check your workspace.' });
        this.changeDetectorRef.detectChanges();
      }, 30000);
      this.changeDetectorRef.detectChanges();
    }));
    this.subscriptions.push(this.messagingService.subscribe(EDITOR_BUSY_OFF, () => {
      clearTimeout(this.snackbarEditorBusyTimeout);
      this.editorBusyClass = this.EDITOR_IDLE_CLASS;
      this.changeDetectorRef.detectChanges();
    }));
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private handleNavigationDeleted(document: NavigationDeletedPayload): void {
    if (document.type === 'folder') {
      this.handleNavigationFolderDeleted(document.id);
    } else {
      this.handleNavigationFileDeleted(document.id);
    }
  }

  private handleNavigationFolderDeleted(path: string): void {
    const tabsToRemove = this.findTabsBelowFolder(path);
    tabsToRemove.forEach(tab => this.removeTab(tab));
  }

  private handleNavigationFileDeleted(path: string): void {
    const existingTab = this.findTab(path);
    if (existingTab) {
      this.removeTab(existingTab);
    } // else: no open tab -> nothing to do
  }

  private handleNavigationOpen(document: NavigationOpenPayload): void {
    const existingTab = this.findTab(document.id);
    if (existingTab) {
      this.selectTab(existingTab);
    } else {
      this.createNewTab(document);
    }
    this.changeDetectorRef.detectChanges();
  }

  private handleNavigationRenamed(payload: NavigationRenamedPayload): void {
    this.findDescendantTabs(payload.oldPath).forEach((tab) => {
      this.renameTab(tab, tab.path, payload.newPath + tab.path.substring(payload.oldPath.length));
    });
  }

  private renameTab(tab: any, oldPath: string, newPath: string) {
    tab.path = newPath;
    tab.title = newPath.split('/').pop();
    const editorFound = this.editorComponents.find(editor => editor.path === oldPath);
    if (editorFound) {
      editorFound.renameTo(newPath);
    }
    this.changeDetectorRef.detectChanges();
  }

  private createNewTab(document: NavigationOpenPayload): void {
    const newElement = {
      id: `editor-tab-${EditorTabsComponent.uniqueTabId++}`,
      title: document.name,
      path: document.id,
      active: false
    };
    this.tabs.push(newElement);
    this.selectTab(newElement);
  }

  private findTab(path: string): TabElement {
    return this.tabs.find(tab => tab.path === path);
  }

  private findDescendantTabs(parentPath: string): TabElement[] {
    return this.tabs.filter(tab => tab.path.startsWith(parentPath));
  }

  private findTabsBelowFolder(folder: string): TabElement[] {
    const folderNameWithSlash = folder.endsWith('/') ? folder : folder + '/';
    return this.tabs.filter(tab => tab.path.startsWith(folderNameWithSlash));
  }

  public clearTabs(): void {
    const originalLen = this.tabs.length;
    for (let i = 0; i < originalLen; i++) { // iterated at most originalLen times!
      this.removeTab(this.tabs[0]);
    }
  }

  public selectTab(tab: TabElement): void {
    if (!tab.active) {
      tab.active = true;
      const element: Element = { path: tab.path };
      this.messagingService.publish(EDITOR_ACTIVE, element);
    }
    const component = this.editorComponents.find(element => element.tabId === tab.id);
    if (component) {
      component.focus();
      component.resize();
    }
  }

  public resize() {
    this.editorComponents.forEach(editor => editor.resize());
  }

  public deselectTab(tab: TabElement): void {
    if (tab.active) {
      tab.active = false;
      this.messagingService.publish(EDITOR_INACTIVE, { path: tab.path });
    }
  }

  // TODO first we should check the dirty state of the editor?!
  // see http://valor-software.com/ngx-bootstrap/#/modals - Static modal
  public removeTab(tab: TabElement): void {
    // Remove the tab from the list
    const index = this.tabs.indexOf(tab);
    this.tabs.splice(index, 1);
    const element: Element = { path: tab.path };
    this.messagingService.publish(EDITOR_CLOSE, element);

    // If the tab was active, select a new one to be active
    if (tab.active) {
      const nextIndexToSelect = index > 0 ? index - 1 : index;
      const tabToSelect = this.tabs[nextIndexToSelect];
      if (tabToSelect) {
        this.selectTab(tabToSelect);
      }
    }
  }

  async handleFileChange(document: string): Promise<void> {
    const editorFound = this.editorComponents.find((editor) => editor.path === document);
    if (editorFound && !(await editorFound.isDirty())) {
      editorFound.reload();
    } else {
      console.warn('requested reload of document ' + document + ' discarded, since editor could not be found or is dirty');
    }
  }

  handleBackupEntry(backupEntry: BackupEntry): void {
    const existingTab = this.findTab(backupEntry.resource);
    if (existingTab) {
      this.renameTab(existingTab, backupEntry.resource, backupEntry.backupResource);
      // inform other listeners that a new file is present, the old file tab was closed, the new file tab was opened
      const oldElement: Element = { path: backupEntry.resource };
      this.messagingService.publish(EDITOR_CLOSE, oldElement);
      const newElement: Element = { path: backupEntry.backupResource };
      this.messagingService.publish(EDITOR_OPEN, newElement);
    } else {
      console.warn('backup entry reported, but no tab with oldpath ' + backupEntry.resource + ' found!');
    }
  }

  async getNonDirtyTabs(): Promise<string[]> {
    const result = [];
    for (const tab of this.tabs) {
      const editorFound = this.editorComponents.find(editor => editor.path === tab.path);
      if (editorFound && !(await editorFound.isDirty())) {
        result.push(tab.path);
      }
    }
    return result;
  }

  async getDirtyTabs(): Promise<string[]> {
    const result = [];
    for (const tab of this.tabs) {
      const editorFound = this.editorComponents.find(editor => editor.path === tab.path);
      if (editorFound && (await editorFound.isDirty())) {
        result.push(tab.path);
      }
    }
    return result;
  }

}
