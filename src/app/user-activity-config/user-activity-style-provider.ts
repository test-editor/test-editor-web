import { StyleProvider } from '@testeditor/testeditor-commons';
import { UserActivityType } from './user-activity-config';

export class TestEditorUserActivityStyleProvider extends StyleProvider {
  getCssClasses(key: string): string {
    switch (key) {
      case UserActivityType.EXECUTED_TEST:
        return 'fa fa-cog user-activity';
      case UserActivityType.OPENED_FILE:
        return 'fa fa-file user-activity';
      case UserActivityType.CREATED_FILE:
        return 'fa plus-circle user-activity';
      default: return this.getDefaultCssClasses();
    }
  }

  getDefaultCssClasses(): string {
    return 'fa fa-user user-activity';
  }
}
