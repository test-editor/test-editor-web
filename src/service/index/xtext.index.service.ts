import { Injectable } from '@angular/core';
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
    return this.http.post(this.serviceUrl + '/refresh', null).toPromise().then(response => response.json(), reject => []);
  }

}
