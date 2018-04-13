import { ModalDialogComponent } from './modal.dialog.component';
import { async, TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ModalModule } from 'ngx-bootstrap';



describe('ModalDialogComponent', () => {
    let modalDialog: ModalDialogComponent;
    let fixture: ComponentFixture<ModalDialogComponent>;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [ModalModule.forRoot()],
        declarations: [
          ModalDialogComponent
        ]
      }).compileComponents();
    }));

    beforeEach(() => {
    fixture = TestBed.createComponent(ModalDialogComponent);
    modalDialog = fixture.debugElement.componentInstance;

    // configure messaging
      fixture.detectChanges();
    });

    it('should open the modalDialog with explicit messages', async(() => {
        // given
        const message = 'What the Hack !!!';

        // when
        modalDialog.openDialog(message);

        // then
        // tslint:disable-next-line:no-unused-expression
        fixture.debugElement.query(By.css('#modal-dialog')).nativeElement.innerText === message;
        // tslint:ensable-next-line:no-unused-expression

      }));
});
