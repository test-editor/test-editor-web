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
    this.subscription = this.messagingService.subscribe('navigation.open', (model: WorkspaceDocument) => {
      this.handleNavigationOpen(model);
    });
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private handleNavigationOpen(model: WorkspaceDocument): void {
    let existingTab = this.tabs.find(t => t.path === model.path);
    if (existingTab) {
      existingTab.active = true;
    } else {
      let newElement = {
        title: model.name,
        path: model.path,
        active: true,
        initialContent: model.content
      };
      this.tabs.push(newElement);
    }
    this.changeDetectorRef.detectChanges();
  }

  public removeTab(tab: TabElement): void {
    this.tabs.splice(this.tabs.indexOf(tab), 1);
  }

}
