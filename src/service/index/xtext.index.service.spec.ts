import { async, TestBed, inject } from '@angular/core/testing';
import { HttpModule, XHRBackend, RequestMethod, Response, ResponseOptions } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { AuthConfig, AuthHttp } from 'angular2-jwt';
import { XtextIndexServiceConfig } from './xtext.index.service.config';
import { mock } from 'ts-mockito/lib/ts-mockito';
import { XtextIndexService } from './xtext.index.service';
import { IndexService, IndexDelta } from './index.service';

describe('XtextIndexService', () => {

  beforeEach(() => {
    const serviceConfig: XtextIndexServiceConfig = {
      serviceUrl: ''
    };

    const dummyAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M';

    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [
        { provide: XHRBackend, useClass: MockBackend },
        { provide: AuthConfig, useValue: new AuthConfig({ tokenGetter: () => dummyAuthToken }) },
        { provide: XtextIndexServiceConfig, useValue: serviceConfig },
        { provide: IndexService, useClass: XtextIndexService },
        AuthHttp
      ]
    });
  });


  it('processes results of type index delta', async(inject([XHRBackend, IndexService],
    (backend: MockBackend, indexService: IndexService) => {
      // given
      backend.connections.subscribe((connection: MockConnection) => {
        connection.mockRespond(new Response(new ResponseOptions({
          status: 204,
          body: [ { path: 'some/path/to/file' } ]
        })));
      });

      // when
      indexService.refresh().then((indexDelta: IndexDelta[]) => {

        // then
        expect(indexDelta.length).toEqual(1);
        expect(indexDelta[0]).toEqual({ path: 'some/path/to/file' });
      });
    })));

  it('processes empty results', async(inject([XHRBackend, IndexService],
    (backend: MockBackend, indexService: IndexService) => {
      // given
      backend.connections.subscribe((connection: MockConnection) => {
        connection.mockRespond(new Response(new ResponseOptions({
          status: 204,
          body: null
        })));
      });

      // when
      indexService.refresh().then((indexDelta: IndexDelta[]) => {

        // then
        expect(indexDelta).toBeNull();
      });
    })));

});
