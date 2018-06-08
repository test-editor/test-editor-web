import { async, TestBed, inject } from '@angular/core/testing';
import { XtextIndexServiceConfig } from './xtext.index.service.config';
import { XtextIndexService } from './xtext.index.service';
import { IndexService, IndexDelta } from './index.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('XtextIndexService', () => {

  let serviceConfig: XtextIndexServiceConfig;

  beforeEach(() => {
    serviceConfig = new XtextIndexServiceConfig();
    serviceConfig.serviceUrl = '';

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, HttpClientModule],
      providers: [
        { provide: XtextIndexServiceConfig, useValue: serviceConfig },
        { provide: IndexService, useClass: XtextIndexService },
        HttpClient
      ]
    });
  });


  it('processes results of type index delta', async(inject([HttpTestingController, IndexService],
    (httpMock: HttpTestingController, indexService: IndexService) => {
      // given
      const indexServiceRefreshRequest = {
        url: serviceConfig.serviceUrl + '/refresh',
        method: 'POST'
      };
      const mockResponse = [{ path: 'some/path/to/file' }];

      // when
      indexService.refresh().then((indexDelta: IndexDelta[]) => {

        // then
        expect(indexDelta.length).toEqual(1);
        expect(indexDelta[0]).toEqual({ path: 'some/path/to/file' });
      });

      httpMock.match(indexServiceRefreshRequest)[0].flush(mockResponse);
    })));

  it('processes empty results', async(inject([HttpTestingController, IndexService],
    (httpMock: HttpTestingController, indexService: IndexService) => {
      // given
      const indexServiceRefreshRequest = {
        url: serviceConfig.serviceUrl + '/refresh',
        method: 'POST'
      };
      const mockResponse = null;

      // when
      indexService.refresh().then((indexDelta: IndexDelta[]) => {

        // then
        expect(indexDelta).toBeNull();
      });

      httpMock.match(indexServiceRefreshRequest)[0].flush(mockResponse);
    })));

});
