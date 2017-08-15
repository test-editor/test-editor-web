import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { MessagingService } from '@testeditor/messaging-service';
import { WorkspaceDocument } from '@testeditor/workspace-navigator';

import { TabElement } from './tab-element';
import { Element } from './element';

import * as events from './event-types';

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
  static uniqueTabId: number = 0;

  public tabs: TabElement[] = [];
  private subscription: Subscription;

  // changeDetectorRef - see https://github.com/angular/angular/issues/17572#issuecomment-309364246
  constructor(private messagingService: MessagingService, private changeDetectorRef: ChangeDetectorRef) {
  }

  public ngOnInit(): void {
    this.subscription = this.messagingService.subscribe(events.NAVIGATION_OPEN, (document: WorkspaceDocument) => {
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
      let element: Element = { path: tab.path };
      this.messagingService.publish(events.EDITOR_ACTIVE, element);
    }
  }

  public deselectTab(tab: TabElement): void {
    tab.active = false;
  }

  public removeTab(tab: TabElement): void {
    // TODO first we should check the dirty state of the editor?!
    // see http://valor-software.com/ngx-bootstrap/#/modals - Static modal
    this.tabs.splice(this.tabs.indexOf(tab), 1);
    let element: Element = { path: tab.path };
    this.messagingService.publish(events.EDITOR_CLOSE, element);
  }

}
