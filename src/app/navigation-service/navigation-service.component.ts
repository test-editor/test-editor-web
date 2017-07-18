import { Component, Injectable, OnInit } from '@angular/core';
import { Subject } from "rxjs/Subject";

@Component({
  selector: 'app-navigation-service',
  templateUrl: './navigation-service.component.html',
  styleUrls: ['./navigation-service.component.css']
})

@Injectable()
export class NavigationServiceComponent implements OnInit {

  private eventSource = new Subject<string>();
  event$ = this.eventSource.asObservable();

  constructor() { }

  ngOnInit() { }

  emit(message: string) {
    this.eventSource.next(message);
  }

}
