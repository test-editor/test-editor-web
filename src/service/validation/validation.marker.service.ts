import { WorkspaceElement } from '@testeditor/workspace-navigator';

export abstract class ValidationMarkerService {
  abstract getMarkerSummary(workspaceRoot: WorkspaceElement): Promise<ValidationSummary[]>;
}

export interface ValidationSummary {
  path: string,
  errors: number,
  warnings: number,
   infos: number
}
