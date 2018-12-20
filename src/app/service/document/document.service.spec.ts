import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed, fakeAsync, tick, } from '@angular/core/testing';
import { DocumentServiceConfig } from './document.service.config';
import { DocumentService } from './document.service';
import { Conflict, HttpProviderService } from '@testeditor/testeditor-commons';
import { mock } from 'ts-mockito/lib/ts-mockito';
import { TabInformer } from '../../editor-tabs/editor-tabs.component';
import { MessagingModule, MessagingService } from '@testeditor/messaging-service';

class EmptyTabInformer implements TabInformer {
  getDirtyTabs(): string[] {
    return [];
  }
  getNonDirtyTabs(): string[] {
    return [];
  }
}

describe('DocumentService', () => {
  let serviceConfig: DocumentServiceConfig;
  let messagingService: MessagingService;
  let httpClient: HttpClient;
  let pullMatcher: any;

  beforeEach(() => {
    serviceConfig = new DocumentServiceConfig();
    serviceConfig.persistenceServiceUrl = 'http://localhost:9080';

    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        HttpClientTestingModule,
        MessagingModule.forRoot()
      ],
      providers: [
        { provide: DocumentServiceConfig, useValue: serviceConfig },
        DocumentService,
        HttpClient,
        HttpProviderService
      ]
    });
    messagingService = TestBed.get(MessagingService);
    httpClient = TestBed.get(HttpClient);
    const subscription = messagingService.subscribe('httpClient.needed', () => {
      subscription.unsubscribe();
      messagingService.publish('httpClient.supplied', { httpClient: httpClient });
    });

    pullMatcher = {
      method: 'POST',
      url: serviceConfig.persistenceServiceUrl + '/workspace/pull'
    };
  });

  it('saveDocument executes pull then put',
     fakeAsync(inject([HttpTestingController, DocumentService],
            async (httpMock: HttpTestingController, documentService: DocumentService) => {
      // given
      const tclFilePath = 'path/to/file.tcl';

      // when
      documentService.saveDocument(new EmptyTabInformer(), tclFilePath, 'new Content')
                .then(response => expect(response).toBe('result'));
              tick();

      // then

      httpMock.match(pullMatcher)[0].flush({
        failure: false, diffExists: false, headCommit: 'abcdef',
        changedResources: [],
        backedUpResources: [] // { backedUpResources: 'backedup', resource: tclFilePath }]
      });
      tick();

      httpMock.expectOne({ method: 'PUT' }).flush('result');
      tick();

      httpMock.verify();
      })));
});
