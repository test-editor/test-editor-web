import { UserActivityType } from './user-activity-config';
import { LabelProvider } from '@testeditor/testeditor-commons';
import { UserActivityLabelSubject } from '@testeditor/test-navigator';

export class TestEditorUserActivityLabelProvider extends LabelProvider<UserActivityLabelSubject> {
  getLabel(subject: UserActivityLabelSubject): string {
    return this.userString(subject.users) + ' ' + this.activityString(subject.activityType,
      subject.users.length < 2, subject.forChildElement);
  }

  private userString(users: string[]): string {
    switch (users.length) {
      case 0: return 'Somebody';
      case 1: return users[0];
      case 2: return users[0] + ' and ' + users[1];
      default: return users.slice(0, -1).join(', ') + ', and ' + users.slice(-1);
    }
  }

  private activityString(type: string, singular: boolean, forChildElement: boolean) {
    switch (type) {
      case UserActivityType.EXECUTED_TEST:
        return `${singular ? 'is' : 'are'} executing ${forChildElement ? 'a test in this folder' : 'this test'}`;
      case UserActivityType.OPENED_FILE:
        return `${singular ? 'has' : 'have'} opened ${forChildElement ? 'files in this folder' : 'this file'}`;
        case UserActivityType.SELECTED_FILE:
          return `${singular ? 'is' : 'are'} looking at ${forChildElement ? 'files in this folder' : 'this file'}`;
      case UserActivityType.CREATED_FILE:
        return `${singular ? 'has' : 'have'} created ${forChildElement ? 'elements in this folder' : 'this element'}`;
      case UserActivityType.DELETED_FILE:
        return `${singular ? 'has' : 'have'} deleted ${forChildElement ? 'elements in this folder' : 'this element'}`;
      case UserActivityType.OPENED_DIRTY_FILE: case UserActivityType.SELECTED_DIRTY_FILE:
        return `${singular ? 'has' : 'have'} unsaved changes in ${forChildElement ? 'files in this folder' : 'this file'}`;
        case UserActivityType.TYPING_INTO_FILE:
        return `${singular ? 'is' : 'are'} typing into ${forChildElement ? 'files in this folder' : 'this file'}`;
      default: return `${singular ? 'is' : 'are'} working on this`;
    }
  }

}
