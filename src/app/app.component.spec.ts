import { TestBed, async } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {APP_BASE_HREF} from '@angular/common';

import { MessagingModule } from '@testeditor/messaging-service';

import { AppComponent } from './app.component';
import { AuthModule } from 'angular-auth-oidc-client';
import { HttpModule } from '@angular/http';
import { Routes, RouterModule } from '@angular/router'

const appRoutes: Routes = [
    { path: '', component: AppComponent }
  ]

describe('AppComponent', () => {
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
      providers: [{ provide: APP_BASE_HREF, useValue: '/' }]
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
