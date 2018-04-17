export class Conflict {
  constructor(readonly message: string, readonly backupFilePath?: string) { }
}

export function isConflict(conflict: Conflict | {}): conflict is Conflict {
  return (<Conflict>conflict).message !== undefined;
}
