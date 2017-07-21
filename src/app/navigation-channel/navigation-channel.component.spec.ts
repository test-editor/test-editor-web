import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationChannelComponent } from './navigation-channel.component';

describe('NavigationChannelComponent', () => {
  let component: NavigationChannelComponent;
  let fixture: ComponentFixture<NavigationChannelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavigationChannelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
