import { StyleProvider } from '@testeditor/testeditor-commons';
import { UserActivityType } from './user-activity-config';

export class TestEditorUserActivityStyleProvider extends StyleProvider {
  getCssClasses(key: string): string {
    switch (key) {
      case UserActivityType.EXECUTED_TEST:
        return 'fa fa-cog user-activity';
      case UserActivityType.OPENED_FILE:
        return 'fa fa-file-o user-activity';
        case UserActivityType.SELECTED_FILE:
        return 'fa fa-file user-activity';
      case UserActivityType.CREATED_FILE:
        return 'fa fa-plus-circle user-activity';
      case UserActivityType.DELETED_FILE:
        return 'fa fa-times-circle user-activity';
      case UserActivityType.SELECTED_DIRTY_FILE:
        return 'fa fa-file-text user-activity';
      case UserActivityType.OPENED_DIRTY_FILE:
        return 'fa fa-file-text-o user-activity';
        case UserActivityType.TYPING_INTO_FILE:
        return 'fa fa-keyboard-o user-activity';
      default: return this.getDefaultCssClasses();
    }
  }

  getDefaultCssClasses(): string {
    return 'fa fa-user user-activity';
  }
}
