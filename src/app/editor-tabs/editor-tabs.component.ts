import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChildren, QueryList } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { MessagingService } from '@testeditor/messaging-service';
import { AceComponent } from './ace.component';
import { Element } from './element';
import { TabElement } from './tab-element';

import { NAVIGATION_DELETED, NAVIGATION_OPEN, NAVIGATION_CLOSE,
         EDITOR_ACTIVE, EDITOR_CLOSE,
         NavigationDeletedPayload, NavigationOpenPayload } from './event-types';

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
    this.subscriptions.push(this.messagingService.subscribe(NAVIGATION_DELETED, (document: NavigationDeletedPayload) => {
      this.handleNavigationDeleted(document);
    }));
    this.subscriptions.push(this.messagingService.subscribe(NAVIGATION_OPEN, (document: NavigationOpenPayload) => {
      this.handleNavigationOpen(document);
    }));
    this.subscriptions.push(this.messagingService.subscribe(NAVIGATION_CLOSE, () => {
      this.clearTabs();
    }));
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private handleNavigationDeleted(document: NavigationDeletedPayload): void {
    if (document.type === 'folder') {
      this.handleNavigationFolderDeleted(document.path);
    } else {
      this.handleNavigationFileDeleted(document.path);
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
    const existingTab = this.findTab(document.path);
    if (existingTab) {
      this.selectTab(existingTab);
    } else {
      this.createNewTab(document);
    }
    this.changeDetectorRef.detectChanges();
  }

  private createNewTab(document: NavigationOpenPayload): void {
    const newElement = {
      id: `editor-tab-${EditorTabsComponent.uniqueTabId++}`,
      title: document.name,
      path: document.path,
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
    }
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

}
