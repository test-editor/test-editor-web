import { UserActivityEvent } from '@testeditor/user-activity';
import { NAVIGATION_OPEN, EDITOR_CLOSE, EDITOR_DIRTY_CHANGED, EDITOR_ACTIVE, EDITOR_INACTIVE, EDITOR_SAVE_COMPLETED,
  NAVIGATION_RENAMED } from '../editor-tabs/event-types';
import { NAVIGATION_CREATED, NAVIGATION_DELETED } from '@testeditor/test-navigator';

export enum UserActivityType {
  EXECUTED_TEST = 'executed.test',

  OPENED_FILE = 'opened.file',
  SELECTED_FILE = 'selected.file',
  OPENED_DIRTY_FILE = 'opened.dirty.file',
  SELECTED_DIRTY_FILE = 'selected.dirty.file',
  TYPING_INTO_FILE =  'typing.into.file',

  CREATED_FILE = 'created.file',
  DELETED_FILE = 'deleted.file',
  RENAMED_FILE = 'renamed.file',
  SAVED_FILE = 'saved.file'
}

export class UserActivityConfig {
  static readonly PERSISTENT_ACTIVITY_TIMEOUT_SECS = 60;

  // TODO consider importing event names from sub-projects (but this requires them to expose their outgoing events through their public api)
  static readonly TEST_EXECUTION_STARTED = 'test.execution.started';
  static readonly TEST_EXECUTION_FINISHED = 'test.execution.finished';
  static readonly TEST_EXECUTION_FAILED = 'test.execution.failed';

  static readonly FILE_EDITING_GROUP = 'file.editing.group';

  events: UserActivityEvent[] = [
    { name: UserActivityConfig.TEST_EXECUTION_STARTED, activityType: UserActivityType.EXECUTED_TEST, active: true, elementKey: 'path' },
    { name: UserActivityConfig.TEST_EXECUTION_FINISHED, activityType: UserActivityType.EXECUTED_TEST, active: false, elementKey: 'path' },
    { name: UserActivityConfig.TEST_EXECUTION_FAILED, activityType: UserActivityType.EXECUTED_TEST, active: false, elementKey: 'path' },


    { name: NAVIGATION_OPEN, active: true, elementKey: 'id', group: UserActivityConfig.FILE_EDITING_GROUP,
      activityType: [{ to: UserActivityType.OPENED_FILE}] },
    { name: EDITOR_ACTIVE, active: true, elementKey: 'path', group: UserActivityConfig.FILE_EDITING_GROUP,
      activityType: [{ to: UserActivityType.SELECTED_FILE },
                     { from: UserActivityType.OPENED_FILE, to: UserActivityType.SELECTED_FILE },
                     { from: UserActivityType.OPENED_DIRTY_FILE, to: UserActivityType.SELECTED_DIRTY_FILE }]},
    { name: EDITOR_INACTIVE, active: true, elementKey: 'path', group: UserActivityConfig.FILE_EDITING_GROUP,
      activityType: [{ from: UserActivityType.SELECTED_FILE, to: UserActivityType.OPENED_FILE },
                     { from: UserActivityType.SELECTED_DIRTY_FILE, to: UserActivityType.OPENED_DIRTY_FILE }]},
    { name: EDITOR_DIRTY_CHANGED, active: (payload) => payload.dirty, elementKey: 'path', group: UserActivityConfig.FILE_EDITING_GROUP,
      activityType: [{ from: UserActivityType.SELECTED_FILE, to: UserActivityType.SELECTED_DIRTY_FILE }]},
    { name: EDITOR_DIRTY_CHANGED, active: (payload) => !payload.dirty, elementKey: 'path', group: UserActivityConfig.FILE_EDITING_GROUP,
      activityType: [{ from: UserActivityType.SELECTED_DIRTY_FILE, to: UserActivityType.SELECTED_FILE }]},
    { name: EDITOR_SAVE_COMPLETED, elementKey: 'path', group: UserActivityConfig.FILE_EDITING_GROUP, active: true,
      activityType: [{ from: UserActivityType.SELECTED_DIRTY_FILE, to: UserActivityType.SELECTED_FILE }]},
    { name: EDITOR_CLOSE, activityType: UserActivityConfig.FILE_EDITING_GROUP, active: false, elementKey: 'path' },


    { name: NAVIGATION_CREATED, activityType: UserActivityType.CREATED_FILE, active: true, elementKey: 'path',
      timeout: UserActivityConfig.PERSISTENT_ACTIVITY_TIMEOUT_SECS },
    { name: NAVIGATION_DELETED, activityType: UserActivityType.DELETED_FILE, active: true, elementKey: 'id',
      timeout: UserActivityConfig.PERSISTENT_ACTIVITY_TIMEOUT_SECS },
    { name: NAVIGATION_RENAMED, activityType: UserActivityType.RENAMED_FILE, active: true, elementKey: 'oldPath', newElementKey: 'newPath',
      timeout: UserActivityConfig.PERSISTENT_ACTIVITY_TIMEOUT_SECS },
    { name: EDITOR_SAVE_COMPLETED, activityType: UserActivityType.SAVED_FILE, active: true, elementKey: 'path',
      timeout: UserActivityConfig.PERSISTENT_ACTIVITY_TIMEOUT_SECS }
  ];
}
