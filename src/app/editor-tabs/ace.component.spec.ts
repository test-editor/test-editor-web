import { AceComponent } from './ace.component';
import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { mock, when, anything, instance, anyString } from 'ts-mockito';
import { MessagingModule } from '@testeditor/messaging-service';

import { DocumentService } from '../../service/document/document.service';
import { Deferred } from 'prophecy/src/Deferred';
import { SyntaxHighlightingService } from 'service/syntaxHighlighting/syntax.highlighting.service';
import { ViewChild, Component } from '@angular/core';
import { AceClientsideSyntaxHighlightingService } from 'service/syntaxHighlighting/ace.clientside.syntax.highlighting.service';

describe('AceComponent', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async(() => {
    // Mock DocumentService
    const documentServiceMock = mock(DocumentService);
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
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(hostComponent.aceComponentUnderTest).toBeTruthy();
  });

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

});
