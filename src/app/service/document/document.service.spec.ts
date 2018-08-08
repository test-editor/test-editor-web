import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed, } from '@angular/core/testing';
import { Conflict } from './conflict';
import { DocumentServiceConfig } from './document.service.config';
import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let serviceConfig: DocumentServiceConfig;

  beforeEach(() => {
    serviceConfig = new DocumentServiceConfig();
    serviceConfig.persistenceServiceUrl = 'http://localhost:9080';

    TestBed.configureTestingModule({
      imports: [HttpClientModule, HttpClientTestingModule],
      providers: [
        { provide: DocumentServiceConfig, useValue: serviceConfig },
        DocumentService,
        HttpClient
      ]
    });
  });

  it('saveDocument returns Conflict object if HTTP status code is CONFLICT',
    inject([HttpTestingController, DocumentService],
    (httpMock: HttpTestingController, documentService: DocumentService) => {
      // given
      const tclFilePath = 'path/to/file.tcl';
      const message = `The file '${tclFilePath}' already exists.`;
      const backupFilePath = 'path/to/file.tcl.local-backup';
      const mockResponse = {status: 409, statusText: 'Conflict', headers: new HttpHeaders().set('content-location', backupFilePath) };

      const expectedResult = new Conflict(message, backupFilePath);

      // when
      const actualObservableResult = documentService.saveDocument(tclFilePath, 'new Content');

      // then
      actualObservableResult.subscribe(actualResult => {
        expect(actualResult).toEqual(expectedResult);
      });

      const actualRequest = httpMock.expectOne({ method: 'PUT' });
      expect(actualRequest.request.url).toEqual('http://localhost:9080/documents/path/to/file.tcl');
      actualRequest.flush(message, mockResponse);
    }));
});
