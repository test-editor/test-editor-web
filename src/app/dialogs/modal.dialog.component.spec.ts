import { ModalDialogComponent } from './modal.dialog.component';
import { async, TestBed, ComponentFixture, fakeAsync, flush } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ModalModule, BsModalService, BsModalRef } from 'ngx-bootstrap';
import { Component, DebugElement, getDebugNode } from '@angular/core';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';

@Component({
  selector: `app-host-component`,
  template: ``
})
class TestHostComponent {
  constructor(public modalService: BsModalService) {}
}

describe('ModalDialogComponent', () => {
    let hostComponent: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;
    let currentModal: BsModalRef;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [ModalModule.forRoot()],
        declarations: [
          TestHostComponent, ModalDialogComponent
        ]
      }).overrideModule(BrowserDynamicTestingModule, {
        set: {
          entryComponents: [ModalDialogComponent]
        }
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(TestHostComponent);
      hostComponent = fixture.debugElement.componentInstance;
      fixture.detectChanges();
    });

    afterEach(fakeAsync(() => {
      if (currentModal) {
        currentModal.hide();
        flush();
      }
    }));

    it('should open the modal dialog with the provided message and a default title', fakeAsync(() => {
        // given
        const expectedMessage = 'This is the message shown to the user.';
        const expectedDefaultTitle = 'Warning';
        const initialState = {
          message: expectedMessage
        };

        // when
        currentModal = hostComponent.modalService.show(ModalDialogComponent, {initialState});

        // then
        flush();
        const dialogDebugElement = getDebugNode(fixture.debugElement.nativeElement.parentNode.lastChild) as DebugElement;

        expect(dialogDebugElement.query(By.css('#modal-dialog-message')).nativeElement.innerText).toEqual(expectedMessage);
        expect(dialogDebugElement.query(By.css('#modal-dialog-title')).nativeElement.innerText).toEqual(expectedDefaultTitle);
        // TODO check that the dialog is actually *modal*, i.e. nothing else can be interacted with
      }));

      it('should open the modal dialog with the provided message and title', fakeAsync(() => {
        // given
        const expectedMessage = 'This is the message shown to the user.';
        const expectedTitle = 'Warning';
        const initialState = {
          message: expectedMessage,
          title: expectedTitle
        };

        // when
        currentModal = hostComponent.modalService.show(ModalDialogComponent, {initialState});

        // then
        flush();
        const dialogDebugElement = getDebugNode(fixture.debugElement.nativeElement.parentNode.lastChild) as DebugElement;

        expect(dialogDebugElement.query(By.css('#modal-dialog-message')).nativeElement.innerText).toEqual(expectedMessage);
        expect(dialogDebugElement.query(By.css('#modal-dialog-title')).nativeElement.innerText).toEqual(expectedTitle);
      }));

      it('should close the modal dialog when button is clicked', fakeAsync(() => {
        // given
        const initialState = { message: 'This is the message shown to the user.' };
        currentModal = hostComponent.modalService.show(ModalDialogComponent, {initialState});

        const dialogDebugElement = getDebugNode(fixture.debugElement.nativeElement.parentNode.lastChild) as DebugElement;
        const closeButton = dialogDebugElement.query(By.css('#modal-dialog-close')).nativeElement;
        flush();

        // when
        closeButton.click();

        // then
        flush();
        expect(dialogDebugElement.query(By.css('#modal-dialog-close'))).toBeNull();
      }));

      it('should open the modal dialog with the provided buttons', fakeAsync(() => {
        // given
        let okClicked = false;
        let cancelClicked = false;
        const initialState = {
          message: 'Click on a button, please.',
          buttons: [{
            label: 'OK',
            onClick: () => okClicked = true
          }, {
            label: 'Cancel',
            onClick: () => cancelClicked = true
          }]
        };
        currentModal = hostComponent.modalService.show(ModalDialogComponent, {initialState});

        const dialogDebugElement = getDebugNode(fixture.debugElement.nativeElement.parentNode.lastChild) as DebugElement;
        const okButton = dialogDebugElement.query(By.css('#modal-dialog-button-0')).nativeElement as HTMLElement;
        const cancelButton = dialogDebugElement.query(By.css('#modal-dialog-button-1')).nativeElement as HTMLElement;
        flush();

        // when
        okButton.click();
        cancelButton.click();

        // then
        flush();
        expect(okClicked).toBeTruthy();
        expect(cancelClicked).toBeTruthy();
      }));

      it('should allow to close the dialog with a provided button', fakeAsync(() => {
        // given
        const initialState = {
          message: 'Click the button to close the dialog.',
          buttons: [{
            label: 'Close',
            onClick: (modalRef) => modalRef.hide()
          }]
        };
        currentModal = hostComponent.modalService.show(ModalDialogComponent, {initialState});

        const dialogDebugElement = getDebugNode(fixture.debugElement.nativeElement.parentNode.lastChild) as DebugElement;
        const button = dialogDebugElement.query(By.css('#modal-dialog-button-0')).nativeElement as HTMLElement;
        flush();

        // when
        button.click();

        // then
        flush();
        expect(dialogDebugElement.query(By.css('#modal-dialog-close'))).toBeNull();
      }));

      it('should allow to close the dialog with the default button', fakeAsync(() => {
        // given
        const initialState = {
          message: 'Click the button to close the dialog.'
        };
        currentModal = hostComponent.modalService.show(ModalDialogComponent, {initialState});

        const dialogDebugElement = getDebugNode(fixture.debugElement.nativeElement.parentNode.lastChild) as DebugElement;
        const button = dialogDebugElement.query(By.css('#modal-dialog-button-0')).nativeElement as HTMLElement;
        flush();

        // when
        button.click();

        // then
        flush();
        expect(dialogDebugElement.query(By.css('#modal-dialog-close'))).toBeNull();
      }));
});
