import { Injectable } from '@angular/core';
import { ValidationMarkerService, ValidationSummary } from './validation.marker.service';
import { ElementType, WorkspaceElement } from '@testeditor/workspace-navigator';
import { XtextValidationMarkerServiceConfig } from './xtext.validation.marker.service.config';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class XtextDefaultValidationMarkerService extends ValidationMarkerService {

  private serviceUrl: string;

  constructor(private http: HttpClient, config: XtextValidationMarkerServiceConfig) {
    super();
    this.serviceUrl = config.serviceUrl;
  }

  getAllMarkerSummaries(workspaceRoot: WorkspaceElement): Promise<ValidationSummary[]> {
    return this.http.get<ValidationSummary[]>(this.serviceUrl).toPromise()
      .then((leafSummaries: ValidationSummary[]) => {
        const summaryMap = this.mapSummariesByPath(leafSummaries);
        this.recurseAndAggregateValidationSummaries(workspaceRoot, summaryMap);
        return Array.from(summaryMap.values());
      },
      reject => []);
  }

  private mapSummariesByPath(summaries: ValidationSummary[]): Map<string, ValidationSummary> {
    const leafSummaryMap = new Map<string, ValidationSummary>();
    summaries.forEach((summary) => {
      if (leafSummaryMap.has(summary.path)) {
        const existingValidationSummary = leafSummaryMap.get(summary.path);
        this.addToValidationSummary(existingValidationSummary, summary);
        existingValidationSummary.errors += summary.errors;
        existingValidationSummary.warnings += summary.warnings;
        existingValidationSummary.infos += summary.infos;
      } else {
        leafSummaryMap.set(summary.path, summary);
      }
    });
    return leafSummaryMap;
  }

  private recurseAndAggregateValidationSummaries(root: WorkspaceElement,
      summaryMap: Map<string, ValidationSummary>): ValidationSummary {
    if (root.type === ElementType.Folder && root.children != null && root.children.length > 0) {
      summaryMap.set(root.path, root.children.reduce(
        (parentSummary: ValidationSummary, child: WorkspaceElement) =>
          this.addToValidationSummary(parentSummary, this.recurseAndAggregateValidationSummaries(child, summaryMap)),
        { path: root.path, errors: 0, warnings: 0, infos: 0 } as ValidationSummary));
    } else if (!summaryMap.has(root.path)) {
      summaryMap.set(root.path, { path: root.path, errors: 0, warnings: 0, infos: 0 });
    }
    return summaryMap.get(root.path);
  }

  private addToValidationSummary(accumulator: ValidationSummary, increment: ValidationSummary): ValidationSummary {
    accumulator.errors += increment.errors;
    accumulator.warnings += increment.warnings;
    accumulator.infos += increment.infos;
    return accumulator;
  }
}
