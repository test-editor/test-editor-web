import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChildren, QueryList } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { MessagingService } from '@testeditor/messaging-service';
import { AceComponent } from './ace.component';
import { Element } from './element';
import { TabElement } from './tab-element';

import { NAVIGATION_DELETED, NAVIGATION_OPEN, NAVIGATION_CLOSE, NAVIGATION_RENAMED,
         EDITOR_ACTIVE, EDITOR_CLOSE, FILES_CHANGED, FILES_BACKEDUP,
         NavigationDeletedPayload, NavigationOpenPayload, NavigationRenamedPayload } from './event-types';


interface BackupEntry {
  resource: string;
  backupResource: string;
}

@Component({
  selector: 'app-editor-tabs',
  // changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editor-tabs.component.html',
  styleUrls: ['./editor-tabs.component.css']
})
export class EditorTabsComponent implements OnInit, OnDestroy {

  /**
   * Provide unique id's for tabs to assign them a unique css class.
   * This is used for the dirty flag.
   */
  static uniqueTabId = 0;

  @ViewChildren(AceComponent) editorComponents: QueryList<AceComponent>;
  public tabs: TabElement[] = [];
  private subscriptions: Subscription[] = [];

  // changeDetectorRef - see https://github.com/angular/angular/issues/17572#issuecomment-309364246
  constructor(private messagingService: MessagingService, private changeDetectorRef: ChangeDetectorRef) {
  }

  public ngOnInit(): void {
    this.subscriptions.push(this.messagingService.subscribe(
      FILES_CHANGED, (documents: Array<string>) =>
        documents.forEach((document) => this.reload(document))));
    this.subscriptions.push(this.messagingService.subscribe(
      FILES_BACKEDUP, (backupEntries: Array<BackupEntry>) =>
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
    this.editorComponents.forEach(editor => {
      if (editor.path === oldPath) {
        editor.renameTo(newPath);
      }
    });
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
    tab.active = false;
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

  private reload(document: String): void {
    console.log('reload ' + document);
    const editorFound = this.editorComponents.find((editor) => {
      console.log('check editor ' + editor.path);
      return editor.path === document;
    });
    if (editorFound) {
      editorFound.reload();
    } else {
      console.warn('reload of document ' + document + ' failed, since editor could not be found');
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

}
