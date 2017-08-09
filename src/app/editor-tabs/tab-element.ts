export class TabElement {
  id: string;
  title: string;
  path: string;
  active: boolean;
  initialContent: Promise<string>;
}