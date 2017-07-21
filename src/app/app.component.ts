import { Component } from '@angular/core';
import { NavigationChannelComponent } from './navigation-channel/navigation-channel.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [NavigationChannelComponent]
})
export class AppComponent {
  title = 'test-editor-web';

    constructor(private navigationChannel: NavigationChannelComponent) {
    navigationChannel.navEvent$.subscribe(navEvent => {
        console.log('Received navigation event in app-root:');
        console.log(navEvent);});
  }

}
