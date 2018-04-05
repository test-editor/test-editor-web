import { async, TestBed, inject } from '@angular/core/testing';
import { HttpModule, XHRBackend, Response, ResponseOptions } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { XtextIndexServiceConfig } from './xtext.index.service.config';
import { XtextIndexService } from './xtext.index.service';
import { IndexService, IndexDelta } from './index.service';
import { HttpClient } from '@angular/common/http';

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
        { provide: XtextIndexServiceConfig, useValue: serviceConfig },
        { provide: IndexService, useClass: XtextIndexService },
        HttpClient
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
