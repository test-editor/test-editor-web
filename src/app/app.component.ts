import { Component, OnInit } from '@angular/core';
import { MessagingService } from '@testeditor/messaging-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'test-editor-web';
  lastModelName: string;

  constructor(private messagingService: MessagingService) {
  }

  ngOnInit(): void {
    this.messagingService.subscribe('navigation.open', (model) => {
      console.log(`Received 'navigation.open' on '${model.name}'.`);
      this.lastModelName = model.name;
    });
  }

}
