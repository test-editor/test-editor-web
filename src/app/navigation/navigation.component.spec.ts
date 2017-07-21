import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';

import { WorkspaceService } from './workspace/workspace.service';
import { TreeViewerComponent } from './tree-viewer/tree-viewer.component';
import { NavigationComponent } from './navigation.component';
import { NavigationChannelComponent } from '../navigation-channel/navigation-channel.component';

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        NavigationComponent,
        TreeViewerComponent
      ],
      imports: [ HttpModule ],
      providers: [
        WorkspaceService,
        NavigationChannelComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
