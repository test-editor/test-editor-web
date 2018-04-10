import { Injectable } from '@angular/core';

import 'rxjs/add/operator/toPromise';

import { DocumentServiceConfig } from '../../service/document/document.service.config';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class DocumentService {

  private serviceUrl: string;

  constructor(config: DocumentServiceConfig, private http: HttpClient) {
    this.serviceUrl = config.persistenceServiceUrl;
  }

  loadDocument(path: string): Promise<string> {
    const url = `${this.serviceUrl}/documents/${path}`;
    return this.http.get(url, { responseType: 'text' }).toPromise();
  }

  saveDocument(path: string, content: string): Promise<any> {
    const url = `${this.serviceUrl}/documents/${path}`;
    return this.http.put(url, content).toPromise();
  }

}
