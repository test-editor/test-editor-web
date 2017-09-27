import { Injectable } from '@angular/core';
import { Response } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';

import 'rxjs/add/operator/toPromise';

import { DocumentServiceConfig } from './document.service.config';

@Injectable()
export class DocumentService {

  private serviceUrl: string;

  constructor(private http: AuthHttp, config: DocumentServiceConfig) {
    this.serviceUrl = config.persistenceServiceUrl;
  }

  loadDocument(path: string): Promise<Response> {
    let url = `${this.serviceUrl}/documents/${path}`;
    return this.http.get(url).toPromise();
  }

  saveDocument(path: string, content: string): Promise<Response> {
    let url = `${this.serviceUrl}/documents/${path}`;
    return this.http.put(url, content).toPromise();
  }

}
