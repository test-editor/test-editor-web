import { Component, Injectable, OnInit } from '@angular/core';
import { Subject } from "rxjs/Subject";
import { NavigationEvent } from './navigation-event';

@Component({
  selector: 'navigation-channel',
  templateUrl: './navigation-channel.component.html',
  styleUrls: ['./navigation-channel.component.css']
})

@Injectable()
export class NavigationChannelComponent implements OnInit {

  private eventSource = new Subject<string>();
  event$ = this.eventSource.asObservable();

  private navigationSource = new Subject<NavigationEvent>();
  navEvent$ = this.navigationSource.asObservable();

  constructor() { }

  ngOnInit() { }

  emit(message: string) {
    this.eventSource.next(message);
  }

  emitNavEvent(navigationEvent: NavigationEvent) {
    this.navigationSource.next(navigationEvent);
  }

}
