import { Component, Injectable, OnInit } from '@angular/core';
import { Subject } from "rxjs/Subject";
import { NavigationEvent } from './navigation-event';

@Injectable()
export class NavigationChannel {

  private navigationSource = new Subject<NavigationEvent>();
  navEvent$ = this.navigationSource.asObservable();

  emitNavEvent(navigationEvent: NavigationEvent) {
    this.navigationSource.next(navigationEvent);
  }

}
