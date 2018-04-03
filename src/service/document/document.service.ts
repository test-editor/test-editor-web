import { Injectable } from '@angular/core';
import { Response } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';

import { OidcSecurityService } from 'angular-auth-oidc-client';

import 'rxjs/add/operator/toPromise';

import { DocumentServiceConfig } from '../../service/document/document.service.config';

@Injectable()
export class DocumentService {

  private serviceUrl: string;

  constructor(private http: AuthHttp, config: DocumentServiceConfig) {
    this.serviceUrl = config.persistenceServiceUrl;
  }

  loadDocument(path: string): Promise<Response> {
    const url = `${this.serviceUrl}/documents/${path}`;
    return this.http.get(url).toPromise();
  }

  saveDocument(path: string, content: string): Promise<Response> {
    const url = `${this.serviceUrl}/documents/${path}`;
    return this.http.put(url, content).toPromise();
  }

}
