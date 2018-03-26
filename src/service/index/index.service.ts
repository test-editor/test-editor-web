export abstract class IndexService {
  abstract refresh(): Promise<IndexDelta[]>;
}

export interface IndexDelta {
  path: string
}
