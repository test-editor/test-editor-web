import { SyntaxHighlightingService } from 'service/syntaxHighlighting/syntax.highlighting.service';


export class AceClientsideSyntaxHighlightingService implements SyntaxHighlightingService {
  private static readonly syntaxHighlightings = new Map([
    ['tsl', 'xtext-resources/generated/mode-tsl'],
    ['tcl', 'xtext-resources/generated/mode-tcl'],
    ['tml', 'xtext-resources/generated/mode-tcl'],
    ['config', 'xtext-resources/generated/mode-tcl'],
    ['aml', 'xtext-resources/generated/mode-aml']]);

  getSyntaxHighlighting(extension: string): Promise<any> {
    const map = AceClientsideSyntaxHighlightingService.syntaxHighlightings;
    if (map.has(extension)) {
      return Promise.resolve(map.get(extension));
    }
    return Promise.reject(`No syntax highlighting available for language extension "${extension}"`);
  }

}
