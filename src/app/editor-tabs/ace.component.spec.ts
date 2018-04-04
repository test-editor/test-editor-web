import { AceComponent } from './ace.component';
import { tick, fakeAsync, async, ComponentFixture, TestBed } from '@angular/core/testing';
import { mock, when, instance, anyString } from 'ts-mockito';
import { MessagingModule, MessagingService } from '@testeditor/messaging-service';

import { Response, BaseResponseOptions } from '@angular/http';

import { DocumentService } from '../../service/document/document.service';
import { SyntaxHighlightingService } from 'service/syntaxHighlighting/syntax.highlighting.service';
import { ViewChild, Component } from '@angular/core';
import { AceClientsideSyntaxHighlightingService } from 'service/syntaxHighlighting/ace.clientside.syntax.highlighting.service';

@Component({
  selector: `app-host-component`,
  template: `<xtext-editor [path]="path" [tabId]="tabId"></xtext-editor>`
})
class TestHostComponent {
  public path: string;
  public tabId: string;

  @ViewChild(AceComponent)
  public aceComponentUnderTest: AceComponent;

}

describe('AceComponent', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let messagingService: MessagingService;
  const documentServiceMock = mock(DocumentService);

  beforeEach(async(() => {
    // Mock DocumentService
    const syntaxHighlightingServiceMock = mock(AceClientsideSyntaxHighlightingService);
    when(syntaxHighlightingServiceMock.getSyntaxHighlighting(anyString()))
      .thenReturn(Promise.resolve('path/to/syntax-highlighting-file.js'));

    // Initialize TestBed
    TestBed.configureTestingModule({
      imports: [
        MessagingModule.forRoot()
      ],
      declarations: [
        TestHostComponent, AceComponent
      ],
      providers: [
        { provide: DocumentService, useValue: instance(documentServiceMock) },
        { provide: SyntaxHighlightingService, useValue: instance(syntaxHighlightingServiceMock) }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    hostComponent.path = 'path/to/file';
    hostComponent.tabId = 'theTabID';
    // configure messaging
    messagingService = TestBed.get(MessagingService);
    fixture.detectChanges();

    // after all changes applied, replace editor with (synchronous) dummy
    const editorMockForSave = {
      setReadOnly: () => { },
      getValue: () => '',
      xtextServices: { editorContext: { setDirty: (flag) => { } } }
    };
    hostComponent.aceComponentUnderTest.editor = Promise.resolve(editorMockForSave);
  });

  it('should be created', () => {
    expect(hostComponent.aceComponentUnderTest).toBeTruthy();
  });

  it('publishes save completed event after successful save', fakeAsync(() => {
    // given
    when(documentServiceMock.saveDocument(anyString(), anyString())).thenReturn(
      Promise.resolve(new Response(new BaseResponseOptions()))
    );
    const editorSaveCompletedCallback = jasmine.createSpy('editorSaveCompletedCallback');
    messagingService.subscribe('editor.save.completed', editorSaveCompletedCallback);

    // when
    hostComponent.aceComponentUnderTest.save();
    tick();

    // then
    expect(editorSaveCompletedCallback).toHaveBeenCalledTimes(1);
    expect(editorSaveCompletedCallback).toHaveBeenCalledWith(jasmine.objectContaining({
      path: 'path/to/file',
    }));
  }));

  it('publishes save failed event after unsuccessful save', fakeAsync(() => {
    // given
    when(documentServiceMock.saveDocument(anyString(), anyString())).thenReturn(
      Promise.reject('some reason')
    );
    const editorSaveFailedCallback = jasmine.createSpy('editorSaveFailedCallback');
    messagingService.subscribe('editor.save.failed', editorSaveFailedCallback);

    // when
    hostComponent.aceComponentUnderTest.save();
    tick();

    // then
    expect(editorSaveFailedCallback).toHaveBeenCalledTimes(1);
    expect(editorSaveFailedCallback).toHaveBeenCalledWith(jasmine.objectContaining({
      path: 'path/to/file',
      reason: 'some reason'
    }));
  }));

});
