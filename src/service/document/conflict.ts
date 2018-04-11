import { Observable } from 'rxjs/Observable';

export class Conflict {
  constructor(readonly message: string, readonly backupFileRetriever: () => Observable<string>) { }
}

export function isConflict(conflict: Conflict | {}): conflict is Conflict {
  return (<Conflict>conflict).message !== undefined &&
    (<Conflict>conflict).backupFileRetriever !== undefined;
}
