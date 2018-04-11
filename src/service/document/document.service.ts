import { Injectable } from '@angular/core';

import 'rxjs/add/operator/toPromise';

import { DocumentServiceConfig } from '../../service/document/document.service.config';
import { Conflict } from '../../service/document/conflict';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';


export const HTTP_STATUS_NO_CONTENT = 204;
export const HTTP_STATUS_CONFLICT = 409;
export const HTTP_HEADER_CONTENT_LOCATION = 'content-location';
@Injectable()
export class DocumentService {

  private serviceUrl: string;

  constructor(config: DocumentServiceConfig, private http: HttpClient) {
    this.serviceUrl = config.persistenceServiceUrl;
  }

  loadDocument(path: string): Observable<string> {
    const url = `${this.serviceUrl}/documents/${path}`;
    return this.http.get(url, { responseType: 'text' });
  }

  saveDocument(path: string, content: string): Observable<{} | Conflict> {
    const url = `${this.serviceUrl}/documents/${path}`;
    return this.http.put(url, content, { observe: 'response', responseType: 'text' }).map(response => {
      if (response.status === HTTP_STATUS_CONFLICT) {
        let backupFileRetriever: () => Observable<string> = null;
        if (response.headers.has(HTTP_HEADER_CONTENT_LOCATION)) {
          const backupFileURL = response.headers.get(HTTP_HEADER_CONTENT_LOCATION);
          backupFileRetriever = () => this.http.get(backupFileURL, { responseType: 'text'});
        }

        return new Conflict(response.body, backupFileRetriever);
      } else {
        return {};
      }
    });
  }
}
