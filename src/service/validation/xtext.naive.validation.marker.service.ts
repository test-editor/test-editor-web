import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';
import { AuthHttp } from 'angular2-jwt';
import { ValidationMarkerService, ValidationSummary } from './validation.marker.service';
import { WorkspaceElement } from '@testeditor/workspace-navigator';
import { XtextValidationMarkerServiceConfig } from './xtext.validation.marker.service.config';
import { ElementType } from '@testeditor/workspace-navigator';

/**
 * This is a naive implementation using the REST endpoint for validation information
 * already provided by Xtext. This endpoint, however, provides more detailed information
 * on a per-file basis, and is therefore not well-suited to retrieve only a summary of
 * validation markers present on all files. This is a fallback that should be expected
 * to perform poorly.
*/
@Injectable()
export class XtextNaiveValidationMarkerService extends ValidationMarkerService {

  private serviceUrl: string;

  constructor(private http: AuthHttp, config: XtextValidationMarkerServiceConfig) {
    super();
    this.serviceUrl = config.serviceUrl;
  }

  getAllMarkerSummaries(root: WorkspaceElement): Promise<ValidationSummary[]> {
    if (root.children != null && root.children.length > 0) {
      return root.children.reduce((accumulatorPromise: Promise<ValidationSummaryAccumulator>, child: WorkspaceElement) => {
        return accumulatorPromise.then((accumulator) => {
          return this.getAllMarkerSummaries(child).then((childSummaries) => {
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
      return this.getMarkersForFile(root);
    }
  }

  private getMarkersForFile(root: WorkspaceElement): Promise<ValidationSummary[]> {
    const httpOptions = {
      headers: new Headers({
        'Content-Type':  'application/x-www-form-urlencoded; charset=UTF-8'
      })
    };
    const fulltext = encodeURIComponent(root['fulltext']).replace(/%20/g, '+');
    return this.http.post(`${this.serviceUrl}/validate?resource=${encodeURIComponent(root.path)}`,
      `fullText=${fulltext}`, httpOptions).toPromise().then((response) => {
      try {
        const validationResponse: ValidationServiceResponseType = response.json();
        return [{
          path: root.path,
          errors: validationResponse.issues.filter(issue => issue.severity === Severity.ERROR).length,
          warnings: validationResponse.issues.filter(issue => issue.severity === Severity.WARNING).length,
          infos: validationResponse.issues.filter(issue => issue.severity === Severity.INFO).length,
        }]
      } catch (error) {
        return this.logErrorAndAssumeDefault(root.path, error);
      }
    }, (rejected) => this.logErrorAndAssumeDefault(root.path, rejected));
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
