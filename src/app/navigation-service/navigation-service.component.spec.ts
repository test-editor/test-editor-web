import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationServiceComponent } from './navigation-service.component';

describe('NavigationServiceComponent', () => {
  let component: NavigationServiceComponent;
  let fixture: ComponentFixture<NavigationServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavigationServiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
