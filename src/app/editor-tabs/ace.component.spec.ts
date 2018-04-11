import { AceComponent } from './ace.component';
import { tick, fakeAsync, async, ComponentFixture, TestBed } from '@angular/core/testing';
import { mock, when, instance, anyString, spy, verify } from 'ts-mockito';
import { MessagingModule, MessagingService } from '@testeditor/messaging-service';

import { Response, BaseResponseOptions } from '@angular/http';

import { DocumentService } from '../../service/document/document.service';
import { SyntaxHighlightingService } from 'service/syntaxHighlighting/syntax.highlighting.service';
import { ViewChild, Component } from '@angular/core';
import { AceClientsideSyntaxHighlightingService } from 'service/syntaxHighlighting/ace.clientside.syntax.highlighting.service';
import { HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/throw';
import { Conflict } from 'service/document/conflict';

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
      const documentServiceBaseURL = 'http://localhost/documents/';
      const resourcePath = hostComponent.path;
      const resourceContentRemote = 'remote content';
      const backupPath = resourcePath + '.local-backup';
      const editorSpy = spy(editor);
      const resourceContentLocal = 'local content';

      when(documentServiceMock.saveDocument(resourcePath, anyString())).thenReturn(Observable.of(
        new Conflict(`The file '${resourcePath}' could not be saved due to concurrent modifications. ` +
          `Local changes were instead backed up to '${backupPath}'.`, () => Observable.of(resourceContentLocal)
        ))
      );
      when(documentServiceMock.loadDocument(resourcePath)).thenReturn(Observable.of(resourceContentRemote));

      // when
      hostComponent.aceComponentUnderTest.save();

      // then
      tick();
      verify(editorSpy.setValue(resourceContentRemote)).once();
    });
  }));

});
