import { Component, OnInit, isDevMode } from '@angular/core';
import { MessagingService, Message } from '@testeditor/messaging-service';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'test-editor-web';

  constructor(public auth: AuthService, messagingService: MessagingService) {
    auth.handleAuthentication();
    if (!auth.isAuthenticated()) {
      auth.login();
    }
    if (isDevMode()) {
      // log all received events in development mode
      messagingService.subscribeAll((message: Message) => {
        console.log(`Received message of type: ${message.type}`, message);
      });
      // for development purposes, store 'john doe' token as long as no definite login is implemented that provides an appropriate token
      sessionStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huLmRvZUBnbWFpbC5jb20ifQ.G96r0gWRtYfUaEb9XHQp3A4zoovFLJLfx86f5qz-Vl8');
    }
  }

}
