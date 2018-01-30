export abstract class SyntaxHighlightingService {
  abstract getSyntaxHighlighting(extension: string): Promise<any>;
}
