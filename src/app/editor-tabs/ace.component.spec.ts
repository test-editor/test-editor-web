import { AceComponent, AceEditorZoneConfiguration } from './ace.component';
import { tick, fakeAsync, async, ComponentFixture, TestBed, flush } from '@angular/core/testing';
import { mock, when, instance, anyString, anything } from 'ts-mockito';
import { MessagingModule, MessagingService } from '@testeditor/messaging-service';
import { DocumentService } from '../service/document/document.service';
import { SyntaxHighlightingService } from '../service/syntaxHighlighting/syntax.highlighting.service';
import { ViewChild, Component } from '@angular/core';
import { AceClientsideSyntaxHighlightingService } from '../service/syntaxHighlighting/ace.clientside.syntax.highlighting.service';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { ModalDialogComponent } from '../dialogs/modal.dialog.component';
import { EDITOR_SAVE_FAILED, EDITOR_BUSY_OFF, EDITOR_BUSY_ON } from './event-types';
import { Conflict } from '@testeditor/testeditor-commons';

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
  let documentServiceMock: DocumentService;
  let editorContent: string;

  beforeEach(async(() => {
    // Mock DocumentService
    documentServiceMock = mock(DocumentService);
    const syntaxHighlightingServiceMock = mock(AceClientsideSyntaxHighlightingService);
    when(syntaxHighlightingServiceMock.getSyntaxHighlighting(anyString()))
      .thenReturn(Promise.resolve('path/to/syntax-highlighting-file.js'));

    // Initialize TestBed
    TestBed.configureTestingModule({
      imports: [
        MessagingModule.forRoot(),
        ModalModule.forRoot()
      ],
      declarations: [
        TestHostComponent, AceComponent, ModalDialogComponent
      ],
      providers: [
        { provide: DocumentService, useValue: instance(documentServiceMock) },
        { provide: SyntaxHighlightingService, useValue: instance(syntaxHighlightingServiceMock) },
        { provide: AceEditorZoneConfiguration, useValue: { useOutsideZone: false } }
      ]
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [ModalDialogComponent]
      }
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
    editorContent = '';
    const editorMockForSave = {
      getCursorPosition: () => { },
      moveCursorToPosition: (some: any) => { },
      setReadOnly: () => { },
      getValue: () => editorContent,
      setValue: (content: string) => editorContent = content,
      xtextServices: { editorContext: { setDirty: (flag) => { } } },
      session: { selection: { clearSelection: () => {} } },
      renderer: { $cursorLayer: { element: { style: { } } } },
      setOptions: () => { }
    };
    hostComponent.aceComponentUnderTest.editor = Promise.resolve(editorMockForSave);
  });

  it('should be created', () => {
    expect(hostComponent.aceComponentUnderTest).toBeTruthy();
  });

  it('publishes save completed event after successful save', fakeAsync(() => {
    // given
    when(documentServiceMock.saveDocument(anything(), anyString(), anyString())).thenReturn(Promise.resolve(''));
    when(documentServiceMock.loadDocument(anything(), hostComponent.path)).thenReturn(
      Promise.resolve('editor content reloaded from server after save'));

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
    when(documentServiceMock.saveDocument(anything(), anyString(), anyString())).thenReturn(
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

  it('publishes EDITOR_SAVE_FAILED message on save when document provider reports conflict', fakeAsync(() => {
    // given
    const resourcePath = hostComponent.path;

    when(documentServiceMock.saveDocument(anything(), resourcePath, anyString())).thenReturn(Promise.resolve(new Conflict('message')));

    const editorSaveFailedCallback = jasmine.createSpy('workspaceReloadCallback');
    messagingService.subscribe(EDITOR_SAVE_FAILED, editorSaveFailedCallback);

    // when
    hostComponent.aceComponentUnderTest.save();
    tick();

    // then
    expect(editorSaveFailedCallback).toHaveBeenCalledTimes(1);
  }));

  it('publishes EDITOR_BUSY_OFF even if save failed', fakeAsync(() => {
    // given
    const resourcePath = hostComponent.path;

    when(documentServiceMock.saveDocument(anything(), resourcePath, anyString())).thenReturn(Promise.resolve(new Conflict('message')));

    const editorSaveFailedCallback = jasmine.createSpy('workspaceReloadCallback');
    messagingService.subscribe(EDITOR_BUSY_OFF, editorSaveFailedCallback);

    // when
    hostComponent.aceComponentUnderTest.save();
    tick();

    // then
    expect(editorSaveFailedCallback).toHaveBeenCalledTimes(1);
  }));

  it('publishes EDITOR_BUSY_OFF event after successful save', fakeAsync(() => {
    // given
    when(documentServiceMock.saveDocument(anything(), anyString(), anyString())).thenReturn(Promise.resolve(''));
    when(documentServiceMock.loadDocument(anything(), hostComponent.path)).thenReturn(
      Promise.resolve('editor content reloaded from server after save'));

    const editorSaveCompletedCallback = jasmine.createSpy('editorSaveCompletedCallback');
    messagingService.subscribe(EDITOR_BUSY_OFF, editorSaveCompletedCallback);

    // when
    hostComponent.aceComponentUnderTest.save();
    tick();

    // then
    expect(editorSaveCompletedCallback).toHaveBeenCalledTimes(1);
  }));

  it('publishes EDITOR_BUSY_ON when saving', fakeAsync(() => {
    // given
    when(documentServiceMock.saveDocument(anything(), anyString(), anyString())).thenReturn(Promise.resolve(''));
    when(documentServiceMock.loadDocument(anything(), hostComponent.path)).thenReturn(
      Promise.resolve('editor content reloaded from server after save'));

    const editorSaveCompletedCallback = jasmine.createSpy('editorSaveCompletedCallback');
    messagingService.subscribe(EDITOR_BUSY_ON, editorSaveCompletedCallback);

    // when
    hostComponent.aceComponentUnderTest.save();
    tick();

    // then
    expect(editorSaveCompletedCallback).toHaveBeenCalledTimes(1);
  }));

});
