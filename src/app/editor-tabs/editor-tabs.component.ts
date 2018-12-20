import { ChangeDetectorRef, Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { MessagingService } from '@testeditor/messaging-service';
import { Subscription } from 'rxjs/Subscription';
import { AceComponent } from './ace.component';
import { Element } from './element';
import { BackupEntry, EDITOR_ACTIVE, EDITOR_CLOSE, EDITOR_INACTIVE, FilesBackedupPayload, FilesChangedPayload,
  FILES_BACKEDUP, FILES_CHANGED, NavigationDeletedPayload, NavigationOpenPayload, NavigationRenamedPayload,
  NAVIGATION_CLOSE, NAVIGATION_DELETED, NAVIGATION_OPEN, NAVIGATION_RENAMED } from './event-types';
import { TabElement } from './tab-element';

import { NAVIGATION_DELETED, NAVIGATION_OPEN, NAVIGATION_CLOSE, NAVIGATION_RENAMED,
         EDITOR_ACTIVE, EDITOR_CLOSE, FILES_CHANGED, FILES_BACKEDUP,
         NavigationDeletedPayload, NavigationOpenPayload, NavigationRenamedPayload,
  FilesBackedupPayload, FilesChangedPayload, BackupEntry } from './event-types';

export interface TabInformer {
  getDirtyTabs(): string[];
  getNonDirtyTabs(): string[];
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
    const existingTab = this.findTab(payload.oldPath);
    if (existingTab) {
      this.renameTab(existingTab, payload.oldPath, payload.newPath);
    }
  }

  private renameTab(tab: any, oldPath: string, newPath: string) {
    tab.path = newPath;
    tab.title = newPath.split('/').pop();
    const editorFound = this.editorComponents.find(editor => editor.path === oldPath);
    if (editorFound) {
      editorFound.renameTo(newPath);
    }
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

  private async handleFileChange(document: string): Promise<void> {
    const editorFound = this.editorComponents.find((editor) => editor.path === document);
    if (editorFound && !(await editorFound.isDirty())) {
      editorFound.reload();
    } else {
      console.warn('reload of document ' + document + ' failed, since editor could not be found or is dirty');
    }
  }

  private handleBackupEntry(backupEntry: BackupEntry): void {
    const existingTab = this.findTab(backupEntry.resource);
    if (existingTab) {
      this.renameTab(existingTab, backupEntry.resource, backupEntry.backupResource);
    } else {
      console.warn('backup entry reported, but no tab with oldpath ' + backupEntry.resource + ' found!');
    }
  }

  getNonDirtyTabs(): string[] {
    return this.tabs.filter((tab) => {
      const editorFound = this.editorComponents.find(editor => editor.path === tab.id);
      if (editorFound) {
        return !editorFound.isDirty();
      } else {
        return false;
      }
    }).map((tab) => tab.id);
  }

  getDirtyTabs(): string[] {
    return this.tabs.filter((tab) => {
      const editorFound = this.editorComponents.find(editor => editor.path === tab.id);
      if (editorFound) {
        return editorFound.isDirty();
      } else {
        return false;
      }
    }).map((tab) => tab.id);
  }

}
