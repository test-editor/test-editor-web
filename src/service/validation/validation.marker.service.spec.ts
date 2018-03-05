import { TestBed, inject } from '@angular/core/testing';
import { HttpModule, XHRBackend, RequestMethod, Response, ResponseOptions } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { AuthConfig, AuthHttp } from 'angular2-jwt';
import { XtextValidationMarkerServiceConfig } from './xtext.validation.marker.service.config';
import { ElementType, WorkspaceElement } from '@testeditor/workspace-navigator';
import { mock } from 'ts-mockito/lib/ts-mockito';
import { ValidationMarkerService, ValidationSummary } from './validation.marker.service';
import { XtextNaiveValidationMarkerService } from './xtext.naive.validation.marker.service';
import { async } from '@angular/core/testing';

describe('ValidationMarkerService', () => {

  beforeEach(() => {
    const serviceConfig: XtextValidationMarkerServiceConfig = {
      serviceUrl: ''
    }

    const dummyAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M';

    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [
        { provide: XHRBackend, useClass: MockBackend},
        { provide: AuthConfig, useValue: new AuthConfig({tokenGetter: () => dummyAuthToken}) },
        { provide: XtextValidationMarkerServiceConfig, useValue: serviceConfig },
        { provide: ValidationMarkerService, useClass: XtextNaiveValidationMarkerService},
        AuthHttp
      ]
    });
  });

  it('retrieves markers for single file', async(inject([XHRBackend, ValidationMarkerService],
    (backend: MockBackend, validationMarkerService: ValidationMarkerService) => {
    // given
    const sampleFile: WorkspaceElement = { path: 'sample/path/file.txt', name: 'file.txt', children: [], type: ElementType.File };
    backend.connections.subscribe((connection: MockConnection) => {
      connection.mockRespond(new Response(new ResponseOptions({
        status: 200,
        body: sampleResponseBody
      })));
    })

    // when
    validationMarkerService.getAllMarkerSummaries(sampleFile)

    // then
    .then((summaries: ValidationSummary[]) => {
      expect(summaries.length).toEqual(1);
      expect(summaries[0].path).toEqual(sampleFile.path);
      expect(summaries[0].errors).toEqual(3);
      expect(summaries[0].warnings).toEqual(2);
      expect(summaries[0].infos).toEqual(6);
    });
  })));

  it('retrieves markers for multiple (nested) files and folders', async(inject([XHRBackend, ValidationMarkerService],
    (backend: MockBackend, validationMarkerService: ValidationMarkerService) => {
    // given
    backend.connections.subscribe((connection: MockConnection) => {
      connection.mockRespond(new Response(new ResponseOptions({
        status: 200,
        body: sampleResponseBody
      })));
    })

    // when
    validationMarkerService.getAllMarkerSummaries(root)

    // then
    .then((summaries: ValidationSummary[]) => {
      expect(summaries).toEqual(expectedValidationMarkersForSampleResponse);
    });
  })));

  it('handles errors in responses gracefully', async(inject([XHRBackend, ValidationMarkerService],
    (backend: MockBackend, validationMarkerService: ValidationMarkerService) => {
    // given
    let connectionCounter = 0;
    backend.connections.subscribe((connection: MockConnection) => {
      if (connectionCounter++ % 2) {
        connection.mockRespond(new Response(new ResponseOptions({
          status: 200,
          body: sampleResponseBody
        })));
      } else {
        connection.mockError(new Error('Error while requesting validation markers'));
      }
    });

    // when
    validationMarkerService.getAllMarkerSummaries(root).then((summaries: ValidationSummary[]) => {

    // then
    expect(connectionCounter).toEqual(numberOfWorkspaceLeafs);
    expect(summaries.sort()).toEqual(expectedValdationMarkersWithErrors.sort());
  });
  })));

  [undefined, null, '', '{ issues:'].forEach((malformedBody) => {
    it(`handles malformed bodies ("${malformedBody}") in responses gracefully`, async(inject([XHRBackend, ValidationMarkerService],
      (backend: MockBackend, validationMarkerService: ValidationMarkerService) => {
      // given
      const sampleFile: WorkspaceElement = { path: 'sample/path/file.txt', name: 'file.txt', children: [], type: ElementType.File };
      backend.connections.subscribe((connection: MockConnection) => {
        connection.mockRespond(new Response(new ResponseOptions({
          status: 200,
          body: null
        })));
      })

      // when
      validationMarkerService.getAllMarkerSummaries(sampleFile).then((summaries: ValidationSummary[]) => {

      // then
        expect(summaries.length).toEqual(1);
        expect(summaries[0].path).toEqual(sampleFile.path);
        expect(summaries[0].errors).toEqual(0);
        expect(summaries[0].warnings).toEqual(0);
        expect(summaries[0].infos).toEqual(0);
      });
    })));
  });

  const sampleResponseBody = '{"issues":[\
    {"description":"WebBrowser cannot be resolved.","severity":"error","line":19,"column":13,"offset":553,"length":10},\
    {"description":"WebBrowser cannot be resolved.","severity":"error","line":33,"column":13,"offset":925,"length":10},\
    {"description":"component/mask is not defined in aml","severity":"warning","line":19,"column":13,"offset":553,"length":10},\
    {"description":"test step could not resolve fixture","severity":"info","line":20,"column":4,"offset":567,"length":5},\
    {"description":"No ComponentElement found.","severity":"error","line":20,"column":10,"offset":573,"length":9},\
    {"description":"test step could not resolve fixture","severity":"info","line":21,"column":4,"offset":586,"length":6},\
    {"description":"test step could not resolve fixture","severity":"info","line":25,"column":4,"offset":709,"length":4},\
    {"description":"test step could not resolve fixture","severity":"info","line":29,"column":12,"offset":815,"length":3},\
    {"description":"component/mask is not defined in aml","severity":"warning","line":33,"column":13,"offset":925,"length":10},\
    {"description":"test step could not resolve fixture","severity":"info","line":34,"column":4,"offset":939,"length":4},\
    {"description":"test step could not resolve fixture","severity":"info","line":35,"column":4,"offset":961,"length":5}]}';

  const firstChild: WorkspaceElement = {
    name: 'firstChild',
    path: 'root/firstChild',
    type: ElementType.File,
    children: []
  };
  const greatGrandChild1: WorkspaceElement = {
    name: 'greatGrandChild1',
    path: 'root/middleChild/grandChild/greatGrandChild1',
    type: ElementType.File,
    children: []
  };
  const greatGrandChild2: WorkspaceElement = {
    name: 'greatGrandChild2',
    path: 'root/middleChild/grandChild/greatGrandChild2',
    type: ElementType.File,
    children: []
  };
  const grandChild: WorkspaceElement = {
    name: 'grandChild',
    path: 'root/middleChild/grandChild',
    type: ElementType.Folder,
    children: [greatGrandChild1, greatGrandChild2]
  };
  const middleChild: WorkspaceElement = {
    name: 'middleChild',
    path: 'root/middleChild',
    type: ElementType.Folder,
    children: [grandChild]
  };
  const lastChild: WorkspaceElement = {
    name: 'lastChild',
    path: 'root/lastChild',
    type: ElementType.File,
    children: []
  };

   /**
   * + root
   *   - firstChild
   *   + middleChild
   *     + grandChild
   *       - greatGrandChild1
   *       - greatGrandChild2
   *   - lastChild
   */
  const root: WorkspaceElement = {
    name: 'folder',
    path: 'root',
    type: ElementType.Folder,
    children: [firstChild, middleChild, lastChild],
  };

  const numberOfWorkspaceLeafs = 4;

  const expectedValidationMarkersForSampleResponse = [
    {path: firstChild.path, errors: 3, warnings: 2, infos: 6},
    {path: greatGrandChild1.path, errors: 3, warnings: 2, infos: 6},
    {path: greatGrandChild2.path, errors: 3, warnings: 2, infos: 6},
    {path: grandChild.path, errors: 6, warnings: 4, infos: 12},
    {path: middleChild.path, errors: 6, warnings: 4, infos: 12},
    {path: lastChild.path, errors: 3, warnings: 2, infos: 6},
    {path: root.path, errors: 12, warnings: 8, infos: 24},
  ]

  const expectedValdationMarkersWithErrors = [
    {path: firstChild.path, errors: 0, warnings: 0, infos: 0},
    {path: greatGrandChild1.path, errors: 3, warnings: 2, infos: 6},
    {path: greatGrandChild2.path, errors: 0, warnings: 0, infos: 0},
    {path: grandChild.path, errors: 3, warnings: 2, infos: 6},
    {path: middleChild.path, errors: 3, warnings: 2, infos: 6},
    {path: lastChild.path, errors: 3, warnings: 2, infos: 6},
    {path: root.path, errors: 6, warnings: 4, infos: 12},
  ]
});
