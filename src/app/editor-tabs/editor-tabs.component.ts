import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { MessagingService } from '@testeditor/messaging-service';
import { WorkspaceDocument } from '@testeditor/workspace-navigator';

import { TabElement } from './tab-element';

@Component({
  selector: 'app-editor-tabs',
  // changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editor-tabs.component.html',
  styleUrls: ['./editor-tabs.component.css']
})
export class EditorTabsComponent implements OnInit, OnDestroy {

  static readonly EVENT_EDITOR_ACTIVE = 'editor.active';

  /** 
   * Provide unique id's for tabs to assign them a unique css class.
   * This is used for the dirty flag.
   */
  static uniqueTabId: number = 0;

  public tabs: TabElement[] = [];
  private subscription: Subscription;

  // changeDetectorRef - see https://github.com/angular/angular/issues/17572#issuecomment-309364246
  constructor(private messagingService: MessagingService, private changeDetectorRef: ChangeDetectorRef) {
  }

  public ngOnInit(): void {
    this.subscription = this.messagingService.subscribe('navigation.open', (document: WorkspaceDocument) => {
      this.handleNavigationOpen(document);
    });
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private handleNavigationOpen(document: WorkspaceDocument): void {
    let existingTab = this.tabs.find(t => t.path === document.path);
    if (existingTab) {
      this.selectTab(existingTab);
    } else {
      let newElement = {
        id: `editor-tab-${EditorTabsComponent.uniqueTabId++}`,
        title: document.name,
        path: document.path,
        active: false
      };
      this.tabs.push(newElement);
      this.selectTab(newElement);
    }
    this.changeDetectorRef.detectChanges();
  }

  public selectTab(tab: TabElement): void {
    if (!tab.active) {
      tab.active = true;
      this.messagingService.publish(EditorTabsComponent.EVENT_EDITOR_ACTIVE, tab.path);
    }
  }

  public deselectTab(tab: TabElement): void {
    tab.active = false;
  }

  public removeTab(tab: TabElement): void {
    // TODO first we should check the dirty state of the editor?!
    // see http://valor-software.com/ngx-bootstrap/#/modals - Static modal
    let index = this.tabs.indexOf(tab);
    this.tabs.splice(index, 1);
    if (this.tabs.length == 0) {
      this.messagingService.publish(EditorTabsComponent.EVENT_EDITOR_ACTIVE, '');
    }
  }

}
