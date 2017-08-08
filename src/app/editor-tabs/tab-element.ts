export class TabElement {
  title: string;
  path: string;
  active: boolean;
  initialContent: Promise<string>;
}