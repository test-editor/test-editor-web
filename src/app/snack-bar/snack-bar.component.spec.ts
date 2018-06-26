import { async, ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';

import { SnackBarComponent } from './snack-bar.component';
import { SNACKBAR_DISPLAY_NOTIFICATION } from './snack-bar-event-types';
import { MessagingService, MessagingModule } from '@testeditor/messaging-service';
import { By } from '@angular/platform-browser';

describe('SnackBarComponent', () => {
  let component: SnackBarComponent;
  let fixture: ComponentFixture<SnackBarComponent>;
  let messagingService: MessagingService;
  const DEFAULT_TIMEOUT = 1500;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ MessagingModule.forRoot() ],
      declarations: [ SnackBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    messagingService = TestBed.get(MessagingService);
    fixture = TestBed.createComponent(SnackBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display notification on SNACKBAR_DISPLAY_NOTIFICATION event', fakeAsync(() => {
    // given
    const message = 'Hello, World!';

    // when
    messagingService.publish(SNACKBAR_DISPLAY_NOTIFICATION, {message: message});

    // then
    tick(DEFAULT_TIMEOUT - 1);
    fixture.detectChanges();
    const snackbar = fixture.debugElement.query(By.css('#snackbar'));
    flush();
    expect(snackbar.nativeElement.textContent).toEqual(message);
    expect(snackbar.classes['show']).toBeTruthy();
  }));

  it('should remove notification after default timeout', fakeAsync(() => {
    // given
    const message = 'Hello, World!';
    messagingService.publish(SNACKBAR_DISPLAY_NOTIFICATION, {message: message});
    tick(1);
    fixture.detectChanges();
    let snackbar = fixture.debugElement.query(By.css('#snackbar'));
    expect(snackbar.nativeElement.textContent).toEqual(message);
    expect(snackbar.classes['show']).toBeTruthy();

    // when
    tick(DEFAULT_TIMEOUT);
    fixture.detectChanges();

    // then
    snackbar = fixture.debugElement.query(By.css('#snackbar'));
    expect(snackbar.nativeElement.textContent).toEqual('');
    expect(snackbar.classes['show']).toBeFalsy();
  }));

  it('should display notification for the duration of the given custom timeout', fakeAsync(() => {
    // given
    const message = 'Hello, World!';
    const customTimeout = 4242;

    // when
    messagingService.publish(SNACKBAR_DISPLAY_NOTIFICATION, {message: message, timeout: customTimeout});

    // then
    tick(customTimeout - 1);
    fixture.detectChanges();
    const snackbar = fixture.debugElement.query(By.css('#snackbar'));
    flush();
    expect(snackbar.nativeElement.textContent).toEqual(message);
    expect(snackbar.classes['show']).toBeTruthy();
  }));

  it('should remove notification after custom timeout', fakeAsync(() => {
    // given
    const message = 'Hello, World!';
    const customTimeout = 4242;
    messagingService.publish(SNACKBAR_DISPLAY_NOTIFICATION, {message: message, timeout: customTimeout});
    tick(1);
    fixture.detectChanges();
    let snackbar = fixture.debugElement.query(By.css('#snackbar'));
    expect(snackbar.nativeElement.textContent).toEqual(message);
    expect(snackbar.classes['show']).toBeTruthy();

    // when
    tick(customTimeout);
    fixture.detectChanges();

    // then
    snackbar = fixture.debugElement.query(By.css('#snackbar'));
    expect(snackbar.nativeElement.textContent).toEqual('');
    expect(snackbar.classes['show']).toBeFalsy();
  }));
});
