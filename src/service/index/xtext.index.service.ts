import { Injectable } from '@angular/core';
import { IndexService, IndexDelta } from './index.service';
import { XtextIndexServiceConfig } from './xtext.index.service.config';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class XtextIndexService extends IndexService {

  private serviceUrl: string;

  constructor(private http: HttpClient, config: XtextIndexServiceConfig) {
    super();
    this.serviceUrl = config.serviceUrl;
  }

  refresh(): Promise<IndexDelta[]> {
    return this.http.post<IndexDelta[]>(this.serviceUrl + '/refresh', null).toPromise().catch(reject => []);
  }

}
