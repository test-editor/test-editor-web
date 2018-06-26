import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessagingService } from '@testeditor/messaging-service';
import { SNACKBAR_DISPLAY_NOTIFICATION, SnackbarMessage } from './snack-bar-event-types';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-snack-bar',
  templateUrl: './snack-bar.component.html',
  styleUrls: ['./snack-bar.component.css']
})
export class SnackBarComponent implements OnInit, OnDestroy {
  message = '';
  show = false;
  subscription: Subscription;

  constructor(private messagingService: MessagingService) { }

  ngOnInit() {
    this.subscription = this.messagingService.subscribe(SNACKBAR_DISPLAY_NOTIFICATION, (msg) => this.showNotification(msg));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private showNotification(snackbarMessage: SnackbarMessage) {
    console.log('showing notification: ' + JSON.stringify(snackbarMessage, null, 2));
    this.message = snackbarMessage.message;
    this.show = true;
    const timeout = snackbarMessage.timeout ? snackbarMessage.timeout : 1500;
    setTimeout(() => {
      console.log('notification timeout reached.');
      this.message = '';
      this.show = false;
    }, timeout);
  }
}
