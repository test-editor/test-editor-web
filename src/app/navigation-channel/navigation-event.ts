export class NavigationEventContent {
  path: string;
  name: string;
  additionalPayload: any;
}

export class NavigationEvent {
  source: string;
  type: string;
  content: NavigationEventContent;
}
