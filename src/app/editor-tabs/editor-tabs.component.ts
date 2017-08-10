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
        title: document.name,
        path: document.path,
        active: true,
        initialContent: document.content
      };
      this.tabs.push(newElement);
    }
    this.changeDetectorRef.detectChanges();
  }

  public removeTab(tab: TabElement): void {
    this.tabs.splice(this.tabs.indexOf(tab), 1);
  }

}
