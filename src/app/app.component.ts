import { Component } from '@angular/core';
import { NavigationChannelComponent } from './navigation-channel/navigation-channel.component';
import { NavigationEventType, NavigationEventService } from './navigation-channel/navigation-event';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [NavigationChannelComponent]
})
export class AppComponent {
  title = 'test-editor-web';

    constructor(private navigationChannel: NavigationChannelComponent, private eventService: NavigationEventService) {
    navigationChannel.navEvent$.subscribe(navEvent => {
        console.log('AppComponent, navEvent: ' + eventService.toString(navEvent)); });
  }

}
