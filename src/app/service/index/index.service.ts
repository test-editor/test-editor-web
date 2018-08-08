export abstract class IndexService {
  abstract refresh(): Promise<IndexDelta[]>;
  abstract reload(): Promise<any>;
}

export interface IndexDelta {
  path: string;
}
