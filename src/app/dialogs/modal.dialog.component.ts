import { Component, ViewChild } from "@angular/core";
 
@Component({
    selector: 'modal-dialog',
    templateUrl: './modal.dialog.component.html',
    styleUrls: ['./modal.dialog.component.css']
  })

  export class ModalDialogComponent {
    message: string
    pathToBackupFile : string
    @ViewChild('staticModal') modal: any;


    openDialog(message: string, pathToBackupFile ? : string) {
        
        this.message = message
        this.modal.show()
    }
      
  }
