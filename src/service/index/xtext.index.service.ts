import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';
import { IndexService, IndexDelta } from './index.service';
import { XtextIndexServiceConfig } from './xtext.index.service.config';

@Injectable()
export class XtextIndexService extends IndexService {

  private serviceUrl: string;

  constructor(private http: AuthHttp, config: XtextIndexServiceConfig) {
    super();
    this.serviceUrl = config.serviceUrl;
  }

  refresh(): Promise<IndexDelta[]> {
    return this.http.get(this.serviceUrl+'/refresh').toPromise().then(response => response.json(), reject => [])
  }

}
