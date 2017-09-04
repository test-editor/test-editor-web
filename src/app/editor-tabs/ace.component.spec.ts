import { AceComponent } from './ace.component';
import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { mock, when, anything, instance } from 'ts-mockito';
import { MessagingModule } from '@testeditor/messaging-service';

import { DocumentService } from './document.service';
import { Deferred } from 'prophecy/src/Deferred';

describe('AceComponent', () => {

  let fixture: ComponentFixture<AceComponent>;
  let component: AceComponent;

  beforeEach(async(() => {
    // Mock DocumentService
    let documentServiceMock = mock(DocumentService)

    // Initialize TestBed
    TestBed.configureTestingModule({
      imports: [
        MessagingModule.forRoot()
      ],
      declarations: [
        AceComponent
      ],
      providers: [
        { provide: DocumentService, useValue: instance(documentServiceMock) }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

});
