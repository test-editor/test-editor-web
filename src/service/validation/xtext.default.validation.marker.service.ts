import { Injectable } from '@angular/core';
import { AuthHttp } from 'angular2-jwt';
import { ValidationMarkerService, ValidationSummary } from './validation.marker.service';
import { WorkspaceElement } from '@testeditor/workspace-navigator';
import { XtextDefaultValidationMarkerServiceConfig } from './xtext.default.validation.marker.service.config';

/**
 * This is a naive implementation using the REST endpoint for validation information
 * already provided by Xtext. This endpoint, however, provides more detailed information
 * on a per-file basis, and is therefore not well-suited to retrieve only a summary of
 * validation markers present on all files. This is a fallback that should be expected
 * to perform poorly.
*/
@Injectable()
export class XtextDefaultValidationMarkerService extends ValidationMarkerService {

  private serviceUrl: string;

  constructor(private http: AuthHttp, config: XtextDefaultValidationMarkerServiceConfig) {
    super();
    this.serviceUrl = config.serviceUrl;
  }

  getMarkerSummary(root: WorkspaceElement): Promise<ValidationSummary[]> {
    if (root.children != null && root.children.length > 0) {
      return root.children.reduce((accumulatorPromise: Promise<ValidationSummaryAccumulator>, child: WorkspaceElement) => {
        return accumulatorPromise.then((accumulator) => {
          return this.getMarkerSummary(child).then((childSummaries) => {
            // console.log(`ValidationSummaries for "${child.path}" are: ${JSON.stringify(childSummaries)}`);
            // console.log(`ValidationSummary of parent "${root.path}" is: ${JSON.stringify(accumulator.parentSummary)}`);
            accumulator.summaries = accumulator.summaries.concat(childSummaries);
            const childSummary = childSummaries.find((summary) => summary.path === child.path)
            accumulator.parentSummary.errors += childSummary.errors
            accumulator.parentSummary.warnings += childSummary.warnings
            accumulator.parentSummary.infos += childSummary.infos
            return accumulator;
          });
        });
      }, Promise.resolve({
        lastResponse: [],
        summaries: [],
        parentSummary: { path: root.path, errors: 0, warnings: 0, infos: 0 }
      } as ValidationSummaryAccumulator)).then((accumulatedSummaries: ValidationSummaryAccumulator) =>
        accumulatedSummaries.summaries.concat([accumulatedSummaries.parentSummary]));
    } else {
      return this.getMarkersForFile(root.path);
    }
  }

  private getMarkersForFile(path: string): Promise<ValidationSummary[]> {
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return this.http.get(`${this.serviceUrl}?resource=${encodedPath}`).toPromise().then((response) => {
      try {
        const validationResponse: ValidationServiceResponseType = response.json();
        return [{
          path: path,
          errors: validationResponse.issues.filter(issue => issue.severity === Severity.ERROR).length,
          warnings: validationResponse.issues.filter(issue => issue.severity === Severity.WARNING).length,
          infos: validationResponse.issues.filter(issue => issue.severity === Severity.INFO).length,
        }]
      } catch (error) {
        return this.logErrorAndAssumeDefault(path, error);
      }
    }, (rejected) => this.logErrorAndAssumeDefault(path, rejected));
  }

  private logErrorAndAssumeDefault(path: string, error: any): ValidationSummary[] {
    console.log(`An error occurred while trying to retrieve validation markers for "${path}": ${error}`);
    return [{path: path, errors: 0, warnings: 0, infos: 0}];
  }

}

enum Severity { ERROR = 'error', WARNING = 'warning', INFO = 'info'}

interface ValidationServiceResponseType {
  issues: {
    severity: Severity
  }[]
}

interface ValidationSummaryAccumulator {
  summaries: ValidationSummary[],
  parentSummary: ValidationSummary
}

function isValidationServiceResponseType(response: any): response is ValidationServiceResponseType {
  return response != null && response.issues != null && response.issues.every((issue) => issue.severity != null);
}
