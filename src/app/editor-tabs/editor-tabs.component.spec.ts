import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { mock, when, anything, instance } from 'ts-mockito';

import { TabsModule, TooltipModule } from 'ngx-bootstrap';
import { MessagingModule, MessagingService } from '@testeditor/messaging-service';
import { WorkspaceDocument } from '@testeditor/workspace-navigator';

import { AceComponent } from './ace.component';
import { EditorTabsComponent } from './editor-tabs.component';
import { DocumentService } from './document.service';
import { DocumentServiceConfig } from './document.service.config';

import * as events from './event-types';

describe('EditorTabsComponent', () => {

  let fixture: ComponentFixture<EditorTabsComponent>;
  let component: EditorTabsComponent;
  let tabset: DebugElement;
  let messagingService: MessagingService;
  let editorActiveCallback: jasmine.Spy;

  let fooDocument: WorkspaceDocument = {
    name: 'foo',
    path: 'top/secret/foo',
    content: Promise.resolve('foo fighters')
  };

  let barDocument: WorkspaceDocument = {
    name: 'bar',
    path: 'tropical/bar',
    content: Promise.resolve('a bottle of rum')
  };

  let openFooAndBar = () => {
    messagingService.publish(events.NAVIGATION_OPEN, fooDocument);
    messagingService.publish(events.NAVIGATION_OPEN, barDocument);
    fixture.detectChanges();
  }

  beforeEach(async(() => {
    // Mock DocumentService
    let documentServiceMock = mock(DocumentService)

    // Initialize TestBed
    TestBed.configureTestingModule({
      imports: [
        TabsModule.forRoot(),
        TooltipModule.forRoot(),
        MessagingModule.forRoot()
      ],
      declarations: [
        AceComponent,
        EditorTabsComponent
      ],
      providers: [
        { provide: DocumentService, useValue: instance(documentServiceMock) }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditorTabsComponent);
    component = fixture.componentInstance;
    tabset = fixture.debugElement.query(By.css('tabset'));

    // configure messaging
    messagingService = TestBed.get(MessagingService);
    editorActiveCallback = jasmine.createSpy('editorActiveCallback');
    messagingService.subscribe(events.EDITOR_ACTIVE, editorActiveCallback);

    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('opens tab when event on messaging bus', () => {
    // when
    messagingService.publish(events.NAVIGATION_OPEN, fooDocument);
    fixture.detectChanges();

    // then
    let navItems = tabset.queryAll(By.css('.nav-item'));
    expect(navItems.length).toBe(1);

    let activeItem = tabset.query(By.css('.nav-item.active'));
    expect(activeItem.nativeElement.innerText).toBe("foo");
  });

  it('opens second tab on second event', () => {
    // given
    messagingService.publish(events.NAVIGATION_OPEN, fooDocument);
    fixture.detectChanges();

    // when
    messagingService.publish(events.NAVIGATION_OPEN, barDocument);
    fixture.detectChanges();

    // then
    let navItems = tabset.queryAll(By.css('.nav-item'));
    expect(navItems.length).toBe(2);

    let activeItem = tabset.query(By.css('.nav-item.active'));
    expect(activeItem.nativeElement.innerText).toBe("bar");
  });

  it('reopens existing tab', () => {
    // given
    openFooAndBar();

    // when
    messagingService.publish(events.NAVIGATION_OPEN, fooDocument);
    fixture.detectChanges();

    // then
    let navItems = tabset.queryAll(By.css('.nav-item'));
    expect(navItems.length).toBe(2);

    let activeItem = tabset.query(By.css('.nav-item.active'));
    expect(activeItem.nativeElement.innerText).toBe("foo");
  });

  it('emits editor.active event on navigation.open event', () => {
    // when
    messagingService.publish(events.NAVIGATION_OPEN, fooDocument);

    // then
    expect(editorActiveCallback).toHaveBeenCalledTimes(1);
    expect(editorActiveCallback).toHaveBeenCalledWith({ path: fooDocument.path });
  });

  it('emits editor.active event on tab switch', () => {
    // given
    openFooAndBar();
    editorActiveCallback.calls.reset();
    let navItems = tabset.queryAll(By.css('.nav-item > a'));
    let foo = navItems.find(item => item.nativeElement.innerText === "foo")

    // when
    foo.nativeElement.click();
    fixture.detectChanges();

    // then
    expect(editorActiveCallback).toHaveBeenCalledTimes(1);
    expect(editorActiveCallback).toHaveBeenCalledWith({ path: fooDocument.path });
  });

  it('emits editor.active event when tab is removed', () => {
    // given
    openFooAndBar();
    editorActiveCallback.calls.reset();
    let navItems = tabset.queryAll(By.css('.nav-item > a'));
    let bar = navItems.find(item => item.nativeElement.innerText === "bar")
    let closeIcon = bar.query(By.css('span.glyphicon'));

    // when
    closeIcon.nativeElement.click();

    // then
    expect(editorActiveCallback).toHaveBeenCalledWith({ path: fooDocument.path });
    // there seems to be a problem running in Jasmine... maybe $event.preventDefault()
    // does not work? Thee is one more event triggered with barDocument.path but
    // this does not happen in the real app :-S
  });

  it('emits editor.close event when tab is closed', () => {
    // given
    messagingService.publish(events.NAVIGATION_OPEN, fooDocument);
    let editorCloseCallback = jasmine.createSpy('editorCloseCallback');
    messagingService.subscribe(events.EDITOR_CLOSE, editorCloseCallback);
    let tab = component.tabs[0];

    // when
    component.removeTab(tab);

    // then
    expect(editorCloseCallback).toHaveBeenCalledTimes(1);
    expect(editorCloseCallback).toHaveBeenCalledWith({ path: fooDocument.path });
  });

});
