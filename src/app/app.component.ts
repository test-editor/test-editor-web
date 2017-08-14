import { Component, OnInit, isDevMode } from '@angular/core';
import { MessagingService, Message } from '@testeditor/messaging-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'test-editor-web';

  constructor(private messagingService: MessagingService) {
    if (isDevMode()) {
      // log all received events in development mode
      messagingService.subscribeAll((message: Message) => {
        console.log(`Received message of type: ${message.type}`, message);
      });
    }
  }

}
