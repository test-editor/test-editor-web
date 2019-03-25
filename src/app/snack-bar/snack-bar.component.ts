import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessagingService } from '@testeditor/messaging-service';
import { SNACKBAR_DISPLAY_NOTIFICATION, SnackbarMessage } from './snack-bar-event-types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-snack-bar',
  templateUrl: './snack-bar.component.html',
  styleUrls: ['./snack-bar.component.css']
})
export class SnackBarComponent implements OnInit, OnDestroy {
  message = '';
  show = false;
  hide = false; // since this one starts an animation it is not simply !show
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
    this.hide = false;
    const timeout = snackbarMessage.timeout ? snackbarMessage.timeout : 1500;
    setTimeout(() => {
      console.log('notification timeout reached.');
      this.show = false;
      this.hide = true;
      setTimeout(() => { // wait until animation finished
        this.message = '';
        this.hide = false;
      }, 1000);
    }, timeout);
  }
}
