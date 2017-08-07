import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import { MessagingService } from '@testeditor/messaging-service';

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
    this.subscription = this.messagingService.subscribe('navigation.open', (model) => {
      if (model.type === "file") {
        this.handleNavigationOpenOnFile(model);
      }
    });
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private handleNavigationOpenOnFile(model: any): void {
    let existingTab = this.tabs.find(t => t.path === model.path);
    if (existingTab) {
      // TODO active handling sucks a bit, doesn't it?!
      existingTab.active = true;
      this.changeDetectorRef.detectChanges();
    } else {
      let newElement = {
        title: model.name,
        path: model.path,
        content: `Content for ${model.path}`,
        active: true
      };
      this.tabs.push(newElement);
      this.changeDetectorRef.detectChanges();
    }
  }

  public removeTab(tab: TabElement): void {
    this.tabs.splice(this.tabs.indexOf(tab), 1);
  }

}
