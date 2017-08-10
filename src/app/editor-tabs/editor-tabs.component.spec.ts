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

describe('EditorTabsComponent', () => {

  let fixture: ComponentFixture<EditorTabsComponent>;
  let component: EditorTabsComponent;
  let tabset: DebugElement;
  let messagingService: MessagingService;

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
    messagingService = TestBed.get(MessagingService);
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('opens tab when event on messaging bus', () => {
    // when
    messagingService.publish('navigation.open', fooDocument);
    fixture.detectChanges();

    // then
    let navItems = tabset.queryAll(By.css('.nav-item'));
    expect(navItems.length).toBe(1);

    let activeItem = tabset.query(By.css('.nav-item.active'));
    expect(activeItem.nativeElement.innerText).toBe("foo");
  });

  it('opens second tab on second event', () => {
    // given
    messagingService.publish('navigation.open', fooDocument);
    fixture.detectChanges();

    // when
    messagingService.publish('navigation.open', barDocument);
    fixture.detectChanges();

    // then
    let navItems = tabset.queryAll(By.css('.nav-item'));
    expect(navItems.length).toBe(2);

    let activeItem = tabset.query(By.css('.nav-item.active'));
    expect(activeItem.nativeElement.innerText).toBe("bar");
  });

  it('reopens existing tab', () => {
    // given
    messagingService.publish('navigation.open', fooDocument);
    messagingService.publish('navigation.open', barDocument);
    fixture.detectChanges();

    // when
    messagingService.publish('navigation.open', fooDocument);
    fixture.detectChanges();

    // then
    let navItems = tabset.queryAll(By.css('.nav-item'));
    expect(navItems.length).toBe(2);

    let activeItem = tabset.query(By.css('.nav-item.active'));
    expect(activeItem.nativeElement.innerText).toBe("foo");
  });

});
