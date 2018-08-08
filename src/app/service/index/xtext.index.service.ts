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

  /*
   * load potential deltas into the index
   */
  refresh(): Promise<IndexDelta[]> {
    return this.http.post<IndexDelta[]>(this.serviceUrl + '/refresh', null).toPromise().catch(reject => []);
  }

  /*
   * reload does no delta processing but rebuilds the index 'from scratch'.
   * this operation is costly since it triggers a gradle rebuild of the project.
   * it is useful for cases where the delta processing did not catch 'all' deltas.
   */
  reload(): Promise<any> {
    return this.http.post(this.serviceUrl + '/reload', null).toPromise().catch(reject => null);
  }
}
