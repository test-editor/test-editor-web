import { DebugElement, Component } from '@angular/core';
import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { mock, when, anything, instance } from 'ts-mockito';

import { TabsModule, TooltipModule } from 'ngx-bootstrap';
import { MessagingModule, MessagingService } from '@testeditor/messaging-service';

import { AceComponent } from './ace.component';
import { EditorTabsComponent } from './editor-tabs.component';
import { DocumentService } from './document.service';
import { DocumentServiceConfig } from './document.service.config';

import { NAVIGATION_DELETED, NavigationDeletedPayload, NAVIGATION_OPEN, NavigationOpenPayload, EDITOR_ACTIVE, EDITOR_CLOSE } from './event-types';

describe('EditorTabsComponent', () => {

  let fixture: ComponentFixture<EditorTabsComponent>;
  let component: EditorTabsComponent;
  let tabset: DebugElement;
  let messagingService: MessagingService;
  let editorActiveCallback: jasmine.Spy;

  let fooDocument: NavigationOpenPayload = {
    name: 'foo',
    path: 'top/secret/foo'
  };

  let barDocument: NavigationOpenPayload = {
    name: 'bar',
    path: 'tropical/bar'
  };

  let openFoo = () => {
    messagingService.publish(NAVIGATION_OPEN, fooDocument);
    fixture.detectChanges();
  };

  let openFooAndBar = () => {
    messagingService.publish(NAVIGATION_OPEN, fooDocument);
    messagingService.publish(NAVIGATION_OPEN, barDocument);
    fixture.detectChanges();
  };

  function getNavItems(): DebugElement[] {
    return tabset.queryAll(By.css('.nav-item'));
  };

  function getActiveItem(): DebugElement {
    return tabset.query(By.css('.nav-item.active'));
  };

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
        MockedAceComponent,
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
    messagingService.subscribe(EDITOR_ACTIVE, editorActiveCallback);

    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('opens tab when event on messaging bus', () => {
    // when
    openFoo();

    // then
    expect(getNavItems().length).toBe(1);

    let activeItem = getActiveItem();
    expect(activeItem.nativeElement.innerText).toBe("foo");
  });

  it('opens second tab on second event', () => {
    // given
    openFoo();

    // when
    messagingService.publish(NAVIGATION_OPEN, barDocument);
    fixture.detectChanges();

    // then
    expect(getNavItems().length).toBe(2);
    expect(getActiveItem().nativeElement.innerText).toBe("bar");
  });

  it('reopens existing tab', () => {
    // given
    openFooAndBar();

    // when
    messagingService.publish(NAVIGATION_OPEN, fooDocument);
    fixture.detectChanges();

    // then
    expect(getNavItems().length).toBe(2);
    expect(getActiveItem().nativeElement.innerText).toBe("foo");
  });

  it('emits editor.active event on navigation.open event', () => {
    // when
    openFoo();

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
    openFoo();
    let editorCloseCallback = jasmine.createSpy('editorCloseCallback');
    messagingService.subscribe(EDITOR_CLOSE, editorCloseCallback);
    let tab = component.tabs[0];

    // when
    component.removeTab(tab);

    // then
    expect(editorCloseCallback).toHaveBeenCalledTimes(1);
    expect(editorCloseCallback).toHaveBeenCalledWith({ path: fooDocument.path });
  });

  it('closes tab when "navigation.deleted" event is received for file', () => {
    // given
    openFooAndBar();
    let fooDeletePayload: NavigationDeletedPayload = {
      name: 'foo',
      path: 'top/secret/foo',
      type: 'file'
    };
    let editorCloseCallback = jasmine.createSpy('editorCloseCallback');
    messagingService.subscribe(EDITOR_CLOSE, editorCloseCallback);

    // when
    messagingService.publish(NAVIGATION_DELETED, fooDeletePayload);
    fixture.detectChanges();

    // then
    expect(getNavItems().length).toBe(1);
    expect(getActiveItem().nativeElement.innerText).toBe("bar");

    expect(editorCloseCallback).toHaveBeenCalledTimes(1);
    expect(editorCloseCallback).toHaveBeenCalledWith({ path: fooDocument.path });
  });

  it('closes tab when "navigation.deleted" is received for parent folder', () => {
    // given
    openFooAndBar();
    let topDeletePayload: NavigationDeletedPayload = {
      name: 'top',
      path: 'top',
      type: 'folder'
    };

    // when
    messagingService.publish(NAVIGATION_DELETED, topDeletePayload);
    fixture.detectChanges();

    // then
    expect(getNavItems().length).toBe(1);
    expect(getActiveItem().nativeElement.innerText).toBe("bar");
  });

});

@Component({
  selector: 'xtext-editor',
  template: '<div>mocked-editor for path: "{{path}}" and tabId: "{{tabId}}"</div>'
})
class MockedAceComponent extends AceComponent {

  editorSpy: any;

  ngAfterViewInit(): void {
    this.editorSpy = jasmine.createSpyObj('editor', ['focus']);
    this.editor = Promise.resolve(this.editorSpy);
  }

}
