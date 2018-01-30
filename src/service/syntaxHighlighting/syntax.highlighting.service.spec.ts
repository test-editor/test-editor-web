import { AceClientsideSyntaxHighlightingService } from 'service/syntaxHighlighting/ace.clientside.syntax.highlighting.service';

describe('AceClientsideSyntaxHighlightingService', () => {

  let serviceUnderTest: AceClientsideSyntaxHighlightingService;

  beforeEach(() => {
    serviceUnderTest = new AceClientsideSyntaxHighlightingService();
  });

  it('throws exception for unknown language', () => {
    // given
    const unknownLanguageExtension = 'unknown';

    // when
    const actualExceptionReason = serviceUnderTest.getSyntaxHighlighting(unknownLanguageExtension)

    // then
    actualExceptionReason.then(response => fail(`expected exception, but got response: ${response}`))
    .catch(actualReason => {
      expect(actualReason).toEqual(`No syntax highlighting available for language extension "${unknownLanguageExtension}"`);
    });
  });

  it('provides Ace syntax highlighting for known language', () => {
    // given
    const knownLanguageExtension = 'tcl';

    // when
    const actualExceptionReason = serviceUnderTest.getSyntaxHighlighting(knownLanguageExtension)

    // then
    actualExceptionReason.then(actualHighlighting => {
      expect(actualHighlighting).toEqual('assets/xtext-resources/generated/mode-tcl');
    }).catch(exceptionReason => fail(`unexpected exception: ${exceptionReason}`));
  });
});
