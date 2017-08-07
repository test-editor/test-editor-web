import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabsModule, TooltipModule } from 'ngx-bootstrap';
import { MessagingModule } from '@testeditor/messaging-service';

import { AceComponentComponent } from './ace-component.component';
import { EditorTabsComponent } from './editor-tabs.component';

describe('EditorTabsComponent', () => {
  let component: EditorTabsComponent;
  let fixture: ComponentFixture<EditorTabsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        TabsModule.forRoot(),
        TooltipModule.forRoot(),
        MessagingModule.forRoot()
      ],
      declarations: [
        AceComponentComponent,
        EditorTabsComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditorTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
