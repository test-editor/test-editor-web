import { DebugElement, Component, AfterViewInit } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { mock, when, instance, anyString } from 'ts-mockito';

import { TabsModule, TooltipModule, ModalModule } from 'ngx-bootstrap';
import { MessagingModule, MessagingService } from '@testeditor/messaging-service';

import { AceComponent } from './ace.component';
import { EditorTabsComponent } from './editor-tabs.component';
import { DocumentService } from '../service/document/document.service';

import { NAVIGATION_DELETED, NAVIGATION_OPEN,
         EDITOR_ACTIVE, EDITOR_CLOSE,
         NavigationDeletedPayload, NavigationOpenPayload } from './event-types';
import { AceClientsideSyntaxHighlightingService } from '../service/syntaxHighlighting/ace.clientside.syntax.highlighting.service';
import { SyntaxHighlightingService } from '../service/syntaxHighlighting/syntax.highlighting.service';

@Component({
  selector: 'xtext-editor',
  template: '<div>mocked-editor for path: "{{path}}" and tabId: "{{tabId}}"</div>'
})
class MockedAceComponent extends AceComponent implements AfterViewInit {

  editorSpy: any;

  ngAfterViewInit(): void {
    this.editorSpy = jasmine.createSpyObj('editor', ['focus']);
    this.editor = Promise.resolve(this.editorSpy);
  }

}

describe('EditorTabsComponent', () => {

  let fixture: ComponentFixture<EditorTabsComponent>;
  let component: EditorTabsComponent;
  let tabset: DebugElement;
  let messagingService: MessagingService;
  let editorActiveCallback: jasmine.Spy;

  const fooDocument: NavigationOpenPayload = {
    name: 'foo',
    path: 'top/secret/foo'
  };

  const barDocument: NavigationOpenPayload = {
    name: 'bar',
    path: 'tropical/bar'
  };

  const openFoo = () => {
    messagingService.publish(NAVIGATION_OPEN, fooDocument);
    fixture.detectChanges();
  };

  const openFooAndBar = () => {
    messagingService.publish(NAVIGATION_OPEN, fooDocument);
    messagingService.publish(NAVIGATION_OPEN, barDocument);
    fixture.detectChanges();
  };

  function getNavItems(): DebugElement[] {
    return tabset.queryAll(By.css('.nav-item'));
  }

  function getActiveItem(): DebugElement {
    return tabset.query(By.css('.nav-item.active > a > span'));
  }

  beforeEach(async(() => {
    // Mock DocumentService
    const documentServiceMock = mock(DocumentService);
    const syntaxHighlightingServiceMock = mock(AceClientsideSyntaxHighlightingService);
    when(syntaxHighlightingServiceMock.getSyntaxHighlighting(anyString()))
      .thenReturn(Promise.resolve('path/to/syntax-highlighting-file.js'));

    // Initialize TestBed
    TestBed.configureTestingModule({
      imports: [
        TabsModule.forRoot(),
        TooltipModule.forRoot(),
        MessagingModule.forRoot(),
        ModalModule.forRoot()
      ],
      declarations: [
        MockedAceComponent,
        EditorTabsComponent
      ],
      providers: [
        { provide: DocumentService, useValue: instance(documentServiceMock) },
        { provide: SyntaxHighlightingService, useValue: instance(syntaxHighlightingServiceMock) }
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

    const activeItem = getActiveItem();
    expect(activeItem.nativeElement.innerText).toBe('foo');
  });

  it('opens second tab on second event', () => {
    // given
    openFoo();

    // when
    messagingService.publish(NAVIGATION_OPEN, barDocument);
    fixture.detectChanges();

    // then
    expect(getNavItems().length).toBe(2);
    expect(getActiveItem().nativeElement.innerText).toBe('bar');
  });

  it('reopens existing tab', () => {
    // given
    openFooAndBar();

    // when
    messagingService.publish(NAVIGATION_OPEN, fooDocument);
    fixture.detectChanges();

    // then
    expect(getNavItems().length).toBe(2);
    expect(getActiveItem().nativeElement.innerText).toBe('foo');
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
    const navItems = tabset.queryAll(By.css('.nav-item > a > span'));
    const foo = navItems.find(item => item.nativeElement.innerText === 'foo');

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
    const navItems = tabset.queryAll(By.css('.nav-link'));
    const bar = navItems.find(item => item.query(By.css('span')).nativeElement.innerText === 'bar');
    const closeIcon = bar.query(By.css('.bs-remove-tab'));

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
    const editorCloseCallback = jasmine.createSpy('editorCloseCallback');
    messagingService.subscribe(EDITOR_CLOSE, editorCloseCallback);
    const tab = component.tabs[0];

    // when
    component.removeTab(tab);

    // then
    expect(editorCloseCallback).toHaveBeenCalledTimes(1);
    expect(editorCloseCallback).toHaveBeenCalledWith({ path: fooDocument.path });
  });

  it('closes tab when "navigation.deleted" event is received for file', () => {
    // given
    openFooAndBar();
    const fooDeletePayload: NavigationDeletedPayload = {
      name: 'foo',
      path: 'top/secret/foo',
      type: 'file'
    };
    const editorCloseCallback = jasmine.createSpy('editorCloseCallback');
    messagingService.subscribe(EDITOR_CLOSE, editorCloseCallback);

    // when
    messagingService.publish(NAVIGATION_DELETED, fooDeletePayload);
    fixture.detectChanges();

    // then
    expect(getNavItems().length).toBe(1);
    expect(getActiveItem().nativeElement.innerText).toBe('bar');

    expect(editorCloseCallback).toHaveBeenCalledTimes(1);
    expect(editorCloseCallback).toHaveBeenCalledWith({ path: fooDocument.path });
  });

  it('closes tab when "navigation.deleted" is received for parent folder', () => {
    // given
    openFooAndBar();
    const topDeletePayload: NavigationDeletedPayload = {
      name: 'top',
      path: 'top',
      type: 'folder'
    };

    // when
    messagingService.publish(NAVIGATION_DELETED, topDeletePayload);
    fixture.detectChanges();

    // then
    expect(getNavItems().length).toBe(1);
    expect(getActiveItem().nativeElement.innerText).toBe('bar');
  });

});
