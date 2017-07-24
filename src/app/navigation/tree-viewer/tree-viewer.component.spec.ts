import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeViewerComponent } from './tree-viewer.component';
import { NavigationChannel } from '../../navigation-channel/navigation-channel';

describe('TreeViewerComponent', () => {
  let component: TreeViewerComponent;
  let fixture: ComponentFixture<TreeViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TreeViewerComponent ],
      providers: [ NavigationChannel ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
