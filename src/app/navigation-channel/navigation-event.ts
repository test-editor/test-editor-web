export enum NavigationEventType {
  selectTreeElement,    // some tree element is selected
  closeEditor,          // an editor is closed
  focusEditor           // an editor receives focus
}

export class NavigationEventContent {
  path: string;
  name: string;
}

export class NavigationEvent {
  source: string;
  type: NavigationEventType;
  content: NavigationEventContent;
}
