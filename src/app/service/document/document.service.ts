import { Injectable } from '@angular/core';

import 'rxjs/add/operator/toPromise';

import { DocumentServiceConfig } from '../../service/document/document.service.config';
import { Conflict } from '../../service/document/conflict';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';


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
    return this.http.get(url, { responseType: 'text', observe: 'response' })
      .map(response => response.body)
      .catch(response => new ErrorObservable(response.error));
  }

  saveDocument(path: string, content: string): Observable<{} | Conflict> {
    const url = `${this.serviceUrl}/documents/${path}`;
    return this.http.put(url, content, { observe: 'response', responseType: 'text' })
      .map(response => ({}))
      .catch(response => {
      if (response.status === HTTP_STATUS_CONFLICT) {
        const keys = response.headers.keys();
        keys.map(key => console.log(`${key}: ${response.headers.get(key)}`));
        let backupFilePath: string = null;
        if (response.headers.has(HTTP_HEADER_CONTENT_LOCATION)) {
          backupFilePath = response.headers.get(HTTP_HEADER_CONTENT_LOCATION);
        }

        return Observable.of(new Conflict(response.error, backupFilePath));
      } else {
        Observable.throw(new Error(response.error));
      }
    });
  }
}
