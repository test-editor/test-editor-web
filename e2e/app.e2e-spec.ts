import { MyAppPage } from './app.po';
import { element, by } from 'protractor';

describe('test-editor-web App', () => {
  let page: MyAppPage;

  beforeEach(() => {
    page = new MyAppPage();
  });

  it('should display initial screen', () => {
    page.navigateTo();
    element(by.id('navigation-label')).getText().then((navText) => {
      expect(navText).toEqual('TEST‑EDITOR');
    });
  });
});
