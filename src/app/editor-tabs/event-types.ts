export const EDITOR_ACTIVE = 'editor.active';
export const EDITOR_INACTIVE = 'editor.inactive';
export const EDITOR_CLOSE = 'editor.close';
export const EDITOR_OPEN = 'editor.open';
export const EDITOR_DIRTY_CHANGED = 'editor.dirtyStateChanged';
export const EDITOR_SAVE_COMPLETED = 'editor.save.completed';
export const EDITOR_SAVE_FAILED = 'editor.save.failed';
export const NAVIGATION_OPEN = 'navigation.open';
export const NAVIGATION_DELETED = 'navigation.deleted';
export const NAVIGATION_CLOSE = 'navigation.close';
export const WORKSPACE_RELOAD_REQUEST = 'workspace.reload.request';
export const NAVIGATION_RENAMED = 'navigation.renamed';

export interface NavigationDeletedPayload {
  name: string;
  id: string;
  type: string;
}

export interface NavigationOpenPayload {
  name: string;
  id: string;
}

export interface EditorSaveFailedPayload {
  id: string;
  reason: any;
}

export interface EditorSaveCompletedPayload {
  id: string;
}

export interface NavigationRenamedPayload {
  oldPath: string;
  newPath: string;
}

export interface BackupEntry {
  resource: string;       // path / file id
  backupResource: string; // path / file id
}
export type FilesBackedupPayload = BackupEntry[];
export const FILES_BACKEDUP = 'files.backedup';

export type FilesChangedPayload = string[];
export const FILES_CHANGED = 'files.changed';

// export interface EditorDirtyChangedPayload extends DirtyState { };
