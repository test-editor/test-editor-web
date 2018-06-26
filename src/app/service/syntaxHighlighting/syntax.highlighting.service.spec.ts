import { AceClientsideSyntaxHighlightingService } from './ace.clientside.syntax.highlighting.service';
import { async } from '@angular/core/testing';

describe('AceClientsideSyntaxHighlightingService', () => {

  let serviceUnderTest: AceClientsideSyntaxHighlightingService;

  beforeEach(() => {
    serviceUnderTest = new AceClientsideSyntaxHighlightingService();
  });

  it('throws exception for unknown language', async(() => {
    // given
    const unknownLanguageExtension = 'unknown';

    // when
    const actualExceptionReason = serviceUnderTest.getSyntaxHighlighting(unknownLanguageExtension);

    // then
    actualExceptionReason.then(response => fail(`expected exception, but got response: ${response}`))
      .catch(actualReason => {
        expect(actualReason).toEqual(`No syntax highlighting available for language extension "${unknownLanguageExtension}"`);
      });
  }));


  // given
  [
    ['tcl', 'xtext-resources/generated/mode-tcl'],
    ['tml', 'xtext-resources/generated/mode-tcl'],
    ['config', 'xtext-resources/generated/mode-tcl'],
    ['tsl', 'xtext-resources/generated/mode-tsl'],
    ['aml', 'xtext-resources/generated/mode-aml']
  ].forEach(([knownLanguageExtension, expectedSyntaxHighlightingFile]) => {

    it(`provides Ace syntax highlighting file "${expectedSyntaxHighlightingFile}" for language "${knownLanguageExtension}"`, async(() => {
      // when
      const syntaxHighlightingResult = serviceUnderTest.getSyntaxHighlighting(knownLanguageExtension);

      // then
      syntaxHighlightingResult.then(actualHighlighting => {
        expect(actualHighlighting).toEqual(expectedSyntaxHighlightingFile);
      }).catch(exceptionReason => fail(`unexpected exception: ${exceptionReason}`));
    }));

  });
});
