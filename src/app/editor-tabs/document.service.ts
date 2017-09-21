import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptionsArgs } from '@angular/http';

import { OidcSecurityService } from 'angular-auth-oidc-client';

import 'rxjs/add/operator/toPromise';

import { DocumentServiceConfig } from './document.service.config';

@Injectable()
export class DocumentService {

  private serviceUrl: string;
  private requestOptions: RequestOptionsArgs;

  constructor(private http: Http, config: DocumentServiceConfig, public oidcSecurityService: OidcSecurityService) {
    this.serviceUrl = config.serviceUrl;
    try {
      let userData = this.oidcSecurityService.getPayloadFromIdToken();
      let authorization = userData !== '' ? userData.family_name.toLowerCase() + ":" + userData.email : config.authorizationHeader;
      this.requestOptions = {
        headers: new Headers({
          'Authorization': authorization
        })
      };
    } catch (Error) { }
  }

  loadDocument(path: string): Promise<Response> {
    let url = `${this.serviceUrl}/documents/${path}`;
    return this.http.get(url, this.requestOptions).toPromise();
  }

  saveDocument(path: string, content: string): Promise<Response> {
    let url = `${this.serviceUrl}/documents/${path}`;
    return this.http.put(url, content, this.requestOptions).toPromise();
  }

}
