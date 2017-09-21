export const EDITOR_ACTIVE = 'editor.active';
export const EDITOR_CLOSE = 'editor.close';
export const EDITOR_DIRTY_CHANGED = 'editor.dirtyStateChanged';
export const NAVIGATION_DELETED = 'navigation.deleted';
export const NAVIGATION_OPEN = 'navigation.open';
export const NAVIGATION_CLOSE = 'navigation.close';

export type NavigationDeletedPayload = {
  name: string,
  path: string,
  type: string
}

export type NavigationOpenPayload = {
  name: string,
  path: string
}
