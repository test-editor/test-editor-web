import { AceComponent, AceEditorZoneConfiguration } from './ace.component';
import { tick, fakeAsync, async, ComponentFixture, TestBed, flush } from '@angular/core/testing';
import { mock, when, instance, anyString, spy, verify, anything } from 'ts-mockito';
import { MessagingModule, MessagingService } from '@testeditor/messaging-service';
import { DocumentService } from '../service/document/document.service';
import { SyntaxHighlightingService } from '../service/syntaxHighlighting/syntax.highlighting.service';
import { ViewChild, Component, getDebugNode, DebugElement } from '@angular/core';
import { AceClientsideSyntaxHighlightingService } from '../service/syntaxHighlighting/ace.clientside.syntax.highlighting.service';
import { By } from '@angular/platform-browser';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { ModalDialogComponent } from '../dialogs/modal.dialog.component';
import { NAVIGATION_OPEN, WORKSPACE_RELOAD_REQUEST } from './event-types';
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
      setReadOnly: () => { },
      getValue: () => editorContent,
      setValue: (content: string) => editorContent = content,
      xtextServices: { editorContext: { setDirty: (flag) => { } } },
      session: { selection: { clearSelection: () => {} } }
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
    flush();
  }));

  it('reloads editor content on successful save to account for concurrent, non-conflicting, automatically merged changes', fakeAsync(() => {
    // given
    hostComponent.aceComponentUnderTest.editor.then((editor) => {
      editorContent = 'local editor content';
      const editorContentAfterMerge = 'editor content after merge';
      const editorSpy = spy(editor);

      when(documentServiceMock.saveDocument(anything(), hostComponent.path, editorContent)).thenReturn(Promise.resolve(''));
      when(documentServiceMock.loadDocument(anything(), hostComponent.path)).thenReturn(Promise.resolve(editorContentAfterMerge));

      // when
      hostComponent.aceComponentUnderTest.save();
      tick();

      // then
      verify(editorSpy.setValue(editorContentAfterMerge)).once();
      expect().nothing();
      flush();
    });
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
    flush();
  }));

  it('opens message dialog on save when document provider reports conflict', fakeAsync(() => {
    // given
    hostComponent.aceComponentUnderTest.editor.then(editor => {
      const resourcePath = hostComponent.path;
      const resourceContentRemote = 'remote content';
      const backupPath = resourcePath + '.local-backup';
      const editorSpy = spy(editor);
      const message = `The file '${resourcePath}' could not be saved due to concurrent modifications. ` +
        `Local changes were instead backed up to '${backupPath}'.`;

      when(documentServiceMock.saveDocument(anything(), resourcePath, anyString())).thenReturn(
        Promise.resolve(new Conflict(message, backupPath)));
      when(documentServiceMock.loadDocument(anything(), resourcePath)).thenReturn(Promise.resolve(resourceContentRemote));

      // when
      hostComponent.aceComponentUnderTest.save();

      // then
      flush();
      verify(editorSpy.setValue(resourceContentRemote)).once();
      const dialogDebugElement = getDebugNode(fixture.debugElement.nativeElement.parentNode.lastChild) as DebugElement;
      expect(dialogDebugElement.query(By.css('#modal-dialog-message')).nativeElement.innerText).toEqual(message);
      expect(dialogDebugElement.query(By.css('#modal-dialog-button-0')).nativeElement.innerText).toEqual('OK');
      expect(dialogDebugElement.query(By.css('#modal-dialog-button-1')).nativeElement.innerText).toEqual('Open backup file');

      // cleanup
      dialogDebugElement.query(By.css('#modal-dialog-close')).nativeElement.click();
      flush();
    });
  }));

  it('sends bus message to open backup file and closes the dialog when the corresponding button is clicked', fakeAsync(() => {
    // given
    hostComponent.aceComponentUnderTest.editor.then(editor => {
      const resourcePath = hostComponent.path;
      const resourceContentRemote = 'remote content';
      const backupPath = resourcePath + '.local-backup';
      const message = `The file '${resourcePath}' could not be saved due to concurrent modifications. ` +
        `Local changes were instead backed up to '${backupPath}'.`;

      when(documentServiceMock.saveDocument(anything(), resourcePath, anyString())).thenReturn(
        Promise.resolve(new Conflict(message, backupPath)));
      when(documentServiceMock.loadDocument(anything(), resourcePath)).thenReturn(Promise.resolve(resourceContentRemote));

      hostComponent.aceComponentUnderTest.save();
      flush();
      const dialogDebugElement = getDebugNode(fixture.debugElement.nativeElement.parentNode.lastChild) as DebugElement;
      const openBackupButton = dialogDebugElement.query(By.css('#modal-dialog-button-1')).nativeElement;

      const openBackupFileCallback = jasmine.createSpy('openBackupFileCallback');
      messagingService.subscribe(NAVIGATION_OPEN, openBackupFileCallback);

      // when
      openBackupButton.click();

      // then
      flush();
      expect(dialogDebugElement.query(By.css('#modal-dialog-button-1'))).toBeFalsy();
      expect(openBackupFileCallback).toHaveBeenCalledTimes(1);
      expect(openBackupFileCallback).toHaveBeenCalledWith(jasmine.objectContaining({
        name: 'file.local-backup',
        path: backupPath,
      }));
      flush();
    });
  }));

  it('does not provide a button to open the backup file if no such file is reported by the conflict', fakeAsync(() => {
    // given
    hostComponent.aceComponentUnderTest.editor.then(editor => {
      const resourcePath = hostComponent.path;
      const resourceContentRemote = 'remote content';
      const message = `The file '${resourcePath}' could not be saved due to concurrent modifications.`;

      when(documentServiceMock.saveDocument(anything(), resourcePath, anyString())).thenReturn(Promise.resolve(new Conflict(message)));
      when(documentServiceMock.loadDocument(anything(), resourcePath)).thenReturn(Promise.resolve(resourceContentRemote));

      // when
      hostComponent.aceComponentUnderTest.save();

      // then
      flush();
      const dialogDebugElement = getDebugNode(fixture.debugElement.nativeElement.parentNode.lastChild) as DebugElement;
      const openBackupButton = dialogDebugElement.query(By.css('#modal-dialog-button-1'));
      expect(openBackupButton).toBeFalsy();

      // cleanup
      dialogDebugElement.query(By.css('#modal-dialog-close')).nativeElement.click();
      flush();
    });
  }));

  it('publishes WORKSPACE_RELOAD_REQUEST message on save when document provider reports conflict', fakeAsync(() => {
    // given
    hostComponent.aceComponentUnderTest.editor.then(editor => {
      const resourcePath = hostComponent.path;

      when(documentServiceMock.saveDocument(anything(), resourcePath, anyString())).thenReturn(Promise.resolve(new Conflict('message')));
      when(documentServiceMock.loadDocument(anything(), resourcePath)).thenReturn(Promise.resolve('remote content'));

      const workspaceReloadCallback = jasmine.createSpy('workspaceReloadCallback');
      messagingService.subscribe(WORKSPACE_RELOAD_REQUEST, workspaceReloadCallback);

      // when
      hostComponent.aceComponentUnderTest.save();

      // then
      flush();
      const dialogDebugElement = getDebugNode(fixture.debugElement.nativeElement.parentNode.lastChild) as DebugElement;
      expect(workspaceReloadCallback).toHaveBeenCalledTimes(1);

      // cleanup
      dialogDebugElement.query(By.css('#modal-dialog-close')).nativeElement.click();
      flush();
    });
  }));

});
