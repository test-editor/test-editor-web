import { ElementType, IndicatorFieldSetup, WorkspaceElementInfo } from '@testeditor/workspace-navigator';
import { ElementState } from '../../service/execution/element.state';

/**
 * Note: the Angular AOT compiler does not support function expressions in decorators,
 * see e.g. https://github.com/angular/angular/issues/10789. Since the indicator field
 * setup is included into the integration app's NgModule decorator, this is worked
 * around by defining and exporting dedicated functions here.
 */

const testStatusField = {
  condition: isTclFile,
  states: [{
    condition: testIsRunning,
    cssClasses: 'fa fa-spinner fa-spin',
    label: runningLabel,
  }, {
    condition: testHasSucceeded,
    cssClasses: 'fa fa-circle test-success',
    label: succeededLabel,
  }, {
    condition: testHasFailed,
    cssClasses: 'fa fa-circle test-failure',
    label: failedLabel,
  }]
};

const validationStatusField = {
  condition: isValid,
  states: [{
    condition: hasValidationErrors,
    cssClasses: 'fa fa-exclamation-circle validation-errors',
    label: validationStatusLabel
  }, {
    condition: hasValidationWarningsNoErrors,
    cssClasses: 'fa fa-exclamation-triangle validation-warnings',
    label: validationStatusLabel
  }, {
    condition: hasValidationInfosNoErrorsWarnings,
    cssClasses: 'fa fa-info-circle validation-infos',
    label: validationStatusLabel
  }]
}

export const testEditorIndicatorFieldSetup: IndicatorFieldSetup = {
  fields: [validationStatusField, testStatusField]
};

export function isTclFile(element: WorkspaceElementInfo): boolean {
  return element && element.name.endsWith('.tcl');
}

export function testIsRunning(marker: any): boolean {
  return marker.testStatus === ElementState.Running;
}

export function testHasSucceeded(marker: any): boolean {
  return marker.testStatus === ElementState.LastRunSuccessful;
}

export function testHasFailed(marker: any): boolean {
  return marker.testStatus === ElementState.LastRunFailed;
}

export function runningLabel(marker: any): string {
  return `Test "${marker.name}" is running`;
}

export function succeededLabel(marker: any): string {
  return `Last run of test "${marker.name}" was successful`;
}

export function failedLabel(marker: any): string {
  return `Last run of test "${marker.name}" has failed`;
}


export function isValid(element: WorkspaceElementInfo) {
  return element !== undefined;
}

export function hasValidationErrors(marker: any) {
  return isValidationMarker(marker) && marker.validation.errors > 0;
}

export function hasValidationWarningsNoErrors(marker: any) {
  return isValidationMarker(marker) && marker.validation.errors <= 0 && marker.validation.warnings > 0;
}

export function hasValidationInfosNoErrorsWarnings(marker: any) {
  return isValidationMarker(marker) && marker.validation.errors <= 0
    && marker.validation.warnings <= 0 && marker.validation.infos > 0;
}

export function validationStatusLabel(marker: any): string {
  let label = '';
  if (isValidationMarker(marker)) {
    if (marker.validation.errors > 0) {
      label += `${marker.validation.errors} error(s)`;
    }
    if (marker.validation.warnings > 0) {
      if (label.length > 0) {
        label += ', ';
      }
      label += `${marker.validation.warnings} warning(s)`
    }
    if (marker.validation.infos > 0) {
      if (label.length > 0) {
        label += ', ';
      }
      label += `${marker.validation.infos} info(s)`
    }
  }
  return label;
}

function isValidationMarker(marker: any): boolean {
  return marker != null && marker.validation != null;
}
