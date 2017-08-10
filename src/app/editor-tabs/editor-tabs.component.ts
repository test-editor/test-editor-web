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
      this.tabs.forEach(tab => tab.active = false);
      existingTab.active = true;
    } else {
      let newElement = {
        id: `editor-tab-${EditorTabsComponent.uniqueTabId++}`,
        title: document.name,
        path: document.path,
        active: true
      };
      this.tabs.push(newElement);
    }
    this.changeDetectorRef.detectChanges();
  }

  public removeTab(tab: TabElement): void {
    // TODO first we should check the dirty state of the editor?!
    // see http://valor-software.com/ngx-bootstrap/#/modals - Static modal
    this.tabs.splice(this.tabs.indexOf(tab), 1);
  }

}
