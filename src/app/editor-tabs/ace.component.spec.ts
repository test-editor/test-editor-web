import { AceComponent } from './ace.component';
import { tick, fakeAsync, async, ComponentFixture, TestBed, flush } from '@angular/core/testing';
import { mock, when, instance, anyString, spy, verify } from 'ts-mockito';
import { MessagingModule, MessagingService } from '@testeditor/messaging-service';
import { DocumentService } from '../../service/document/document.service';
import { SyntaxHighlightingService } from 'service/syntaxHighlighting/syntax.highlighting.service';
import { ViewChild, Component, getDebugNode, DebugElement } from '@angular/core';
import { AceClientsideSyntaxHighlightingService } from 'service/syntaxHighlighting/ace.clientside.syntax.highlighting.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import { Conflict } from 'service/document/conflict';
import { By } from '@angular/platform-browser';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { ModalDialogComponent } from '../dialogs/modal.dialog.component';
import { NAVIGATION_OPEN, WORKSPACE_RELOAD_REQUEST } from './event-types';

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
        MessagingModule.forRoot(),
        ModalModule.forRoot()
      ],
      declarations: [
        TestHostComponent, AceComponent, ModalDialogComponent
      ],
      providers: [
        { provide: DocumentService, useValue: instance(documentServiceMock) },
        { provide: SyntaxHighlightingService, useValue: instance(syntaxHighlightingServiceMock) }
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
    const editorMockForSave = {
      setReadOnly: () => { },
      getValue: () => '',
      setValue: (content: string) => {},
      xtextServices: { editorContext: { setDirty: (flag) => { } } }
    };
    hostComponent.aceComponentUnderTest.editor = Promise.resolve(editorMockForSave);
  });

  it('should be created', () => {
    expect(hostComponent.aceComponentUnderTest).toBeTruthy();
  });

  it('publishes save completed event after successful save', fakeAsync(() => {
    // given
    when(documentServiceMock.saveDocument(anyString(), anyString())).thenReturn(Observable.of({}));

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
      Observable.throw('some reason')
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

  it('opens message dialog on save when document provider reports conflict', fakeAsync(() => {
    // given
    hostComponent.aceComponentUnderTest.editor.then(editor => {
      const resourcePath = hostComponent.path;
      const resourceContentRemote = 'remote content';
      const backupPath = resourcePath + '.local-backup';
      const editorSpy = spy(editor);
      const message = `The file '${resourcePath}' could not be saved due to concurrent modifications. ` +
        `Local changes were instead backed up to '${backupPath}'.`;

      when(documentServiceMock.saveDocument(resourcePath, anyString())).thenReturn(Observable.of(new Conflict(message, backupPath)));
      when(documentServiceMock.loadDocument(resourcePath)).thenReturn(Observable.of(resourceContentRemote));

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

      when(documentServiceMock.saveDocument(resourcePath, anyString())).thenReturn(Observable.of(new Conflict(message, backupPath)));
      when(documentServiceMock.loadDocument(resourcePath)).thenReturn(Observable.of(resourceContentRemote));

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
    });
  }));

  it('does not provide a button to open the backup file if no such file is reported by the conflict', fakeAsync(() => {
    // given
    hostComponent.aceComponentUnderTest.editor.then(editor => {
      const resourcePath = hostComponent.path;
      const resourceContentRemote = 'remote content';
      const message = `The file '${resourcePath}' could not be saved due to concurrent modifications.`;

      when(documentServiceMock.saveDocument(resourcePath, anyString())).thenReturn(Observable.of(new Conflict(message)));
      when(documentServiceMock.loadDocument(resourcePath)).thenReturn(Observable.of(resourceContentRemote));

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

      when(documentServiceMock.saveDocument(resourcePath, anyString())).thenReturn(Observable.of(new Conflict('message')));
      when(documentServiceMock.loadDocument(resourcePath)).thenReturn(Observable.of('remote content'));

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
