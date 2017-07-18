import { Component } from '@angular/core';
import { NavigationServiceComponent } from './navigation-service/navigation-service.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [NavigationServiceComponent]
})
export class AppComponent {
  title = 'test-editor-web';

  constructor(private navigationService: NavigationServiceComponent) {
    navigationService.event$.subscribe(message => { console.log('AppComponent: '+message); });
  }

}
