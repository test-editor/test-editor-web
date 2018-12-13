import { UserActivityEvent } from '@testeditor/user-activity';
import { NAVIGATION_OPEN, EDITOR_CLOSE } from '../editor-tabs/event-types';
import { NAVIGATION_CREATED } from '@testeditor/test-navigator';

export enum UserActivityType {
  EXECUTED_TEST = 'executed.test',
  OPENED_FILE = 'opened.file',
  CREATED_FILE = 'created.file'
}

export class UserActivityConfig {
  static readonly PERSISTENT_ACTIVITY_TIMEOUT_SECS = 300;

  // TODO consider importing event names from sub-projects (but this requires them to expose their outgoing events through their public api)
  static readonly TEST_EXECUTION_STARTED = 'test.execution.started';
  static readonly TEST_EXECUTION_FINISHED = 'test.execution.finished';
  static readonly TEST_EXECUTION_FAILED = 'test.execution.failed';

  events: UserActivityEvent[] = [
    { name: UserActivityConfig.TEST_EXECUTION_STARTED, activityType: UserActivityType.EXECUTED_TEST, active: true, elementKey: 'path' },
    { name: UserActivityConfig.TEST_EXECUTION_FINISHED, activityType: UserActivityType.EXECUTED_TEST, active: false, elementKey: 'path' },
    { name: UserActivityConfig.TEST_EXECUTION_FAILED, activityType: UserActivityType.EXECUTED_TEST, active: false, elementKey: 'path' },

    { name: NAVIGATION_OPEN, activityType: UserActivityType.OPENED_FILE, active: true, elementKey: 'id' },
    { name: EDITOR_CLOSE, activityType: UserActivityType.OPENED_FILE, active: false, elementKey: 'path' },

    { name: NAVIGATION_CREATED, activityType: UserActivityType.CREATED_FILE, active: true, elementKey: 'path',
      timeout: UserActivityConfig.PERSISTENT_ACTIVITY_TIMEOUT_SECS },
  ];
}
