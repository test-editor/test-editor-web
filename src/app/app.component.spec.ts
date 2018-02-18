import { TestBed, async } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {APP_BASE_HREF} from '@angular/common';

import { MessagingModule } from '@testeditor/messaging-service';

import { AppComponent } from './app.component';
import { AuthModule } from 'angular-auth-oidc-client';
import { HttpModule } from '@angular/http';
import { Routes, RouterModule } from '@angular/router'
import { WorkspaceNavigatorModule, PersistenceService } from '@testeditor/workspace-navigator';
import { mock, instance } from 'ts-mockito/lib/ts-mockito';
import { ValidationMarkerService } from '../service/validation/validation.marker.service';

const appRoutes: Routes = [
    { path: '', component: AppComponent }
  ]

describe('AppComponent', () => {
  const mockPersistenceService = mock(PersistenceService);
  const mockValidationMarkerService = mock(ValidationMarkerService);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        RouterModule.forRoot(appRoutes),
        MessagingModule.forRoot(),
        HttpModule,
        AuthModule.forRoot()
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: PersistenceService, useValue: instance(mockPersistenceService)},
        { provide: ValidationMarkerService, useValue: instance(mockValidationMarkerService)}
      ]
    }).compileComponents();
  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it(`should have as title 'app'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('test-editor-web');
  }));

});
