import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MessagingModule } from '@testeditor/messaging-service';
import { WorkspaceNavigatorModule } from '@testeditor/workspace-navigator';

import { AppComponent } from './app.component';
import { EditorTabsModule } from './editor-tabs/editor-tabs.module';

import { Http, RequestOptions } from '@angular/http';
import { AuthHttp, AuthConfig } from 'angular2-jwt';

import * as constants from './config/app-config';

export function authHttpServiceFactory(http: Http, options: RequestOptions) {
  return new AuthHttp(new AuthConfig({
    tokenName: 'token',
		tokenGetter: (() => sessionStorage.getItem('token'))
	}), http, options);
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    MessagingModule.forRoot(),
    WorkspaceNavigatorModule.forRoot({
      persistenceServiceUrl: constants.appConfig.serviceUrls.persistenceService,
    }),
    EditorTabsModule.forRoot({
      persistenceServiceUrl: constants.appConfig.serviceUrls.persistenceService,
    })
  ],
  providers: [
    {
      provide: AuthHttp,
      useFactory: authHttpServiceFactory,
      deps: [Http, RequestOptions]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
