import { Component } from '@angular/core';
import { NavigationChannel } from './navigation-channel/navigation-channel';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [NavigationChannel]
})
export class AppComponent {
  title = 'test-editor-web';

    constructor(private navigationChannel: NavigationChannel) {
    navigationChannel.navEvent$.subscribe(navEvent => {
        console.log('Received navigation event in app-root:');
        console.log(navEvent);});
  }

}
