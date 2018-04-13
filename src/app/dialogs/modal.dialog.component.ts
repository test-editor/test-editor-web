import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';

interface DialogConfig {
  message: string;
  title?: string;
  buttons: {
    label: string,
    onClick: (modalRef: BsModalRef) => void
  }[];
}

@Component({
    selector: 'app-modal-dialog',
    templateUrl: './modal.dialog.component.html',
    styleUrls: ['./modal.dialog.component.css']
  })
  export class ModalDialogComponent implements DialogConfig {
    message: string;
    title = 'Warning';
    buttons = [{
      label: 'OK',
      onClick: (modalRef: BsModalRef) => modalRef.hide()
    }];

    constructor(public modalRef: BsModalRef) {}
  }
