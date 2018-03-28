export const EDITOR_ACTIVE = 'editor.active';
export const EDITOR_CLOSE = 'editor.close';
export const EDITOR_DIRTY_CHANGED = 'editor.dirtyStateChanged';
export const EDITOR_SAVE_COMPLETED = 'editor.save.completed';
export const EDITOR_SAVE_FAILED = 'editor.save.failed';
export const NAVIGATION_OPEN = 'navigation.open';
export const NAVIGATION_DELETED = 'navigation.deleted';
export const NAVIGATION_CLOSE = 'navigation.close';

export type NavigationDeletedPayload = {
  name: string,
  path: string,
  type: string
};

export type NavigationOpenPayload = {
  name: string,
  path: string
};

export type EditorSaveFailedPayload = {
  path: string,
  reason: any
};

export type EditorSaveCompletedPayload = {
  path: string
};
