import { TestEditorConfiguration, RecursivePartial } from './test-editor-configuration';

describe('TestEditorConfiguration', () => {
  it('should create an instance', () => {
    expect(new TestEditorConfiguration()).toBeTruthy();
  });

  [null, {}, undefined].forEach((userConfig) =>
    it(`should contain only defaults when user-defined config is ${userConfig}`, () => {
      // given userConfig
      // when
      const actual = new TestEditorConfiguration(userConfig);

      // then
      expect(actual).toEqual(jasmine.objectContaining(TestEditorConfiguration.defaults));
    }));

  it('should use defaults for all fields missing in the user-defined config', () => {
    // given
    const userConfig: RecursivePartial<TestEditorConfiguration> = {
      serviceUrls: {
        indexService: 'custom value'
      }
    };

    // when
    const actual = new TestEditorConfiguration(userConfig);

    // then
    expect(actual.serviceUrls.indexService).toEqual(userConfig.serviceUrls.indexService);
    actual.serviceUrls.indexService = TestEditorConfiguration.defaults.serviceUrls.indexService;
    expect(actual).toEqual(jasmine.objectContaining(TestEditorConfiguration.defaults));
  });

  it('should use defaults if user-defined config contains empty or null composite properties', () => {
    // given
    const userConfig: RecursivePartial<TestEditorConfiguration> = {
      serviceUrls: {},
      authentication: null
    };

    // when
    const actual = new TestEditorConfiguration(userConfig);

    // then
    expect(actual).toEqual(jasmine.objectContaining(TestEditorConfiguration.defaults));
  });

  it('should ignore unknown properties', () => {
    // given
    const userConfig: RecursivePartial<TestEditorConfiguration> = {};
    userConfig['unknownProperty'] = 'this will be ignored';

    // when
    const actual = new TestEditorConfiguration(userConfig);

    // then
    expect(actual['unknownProperty']).toBeUndefined();
    expect(actual).toEqual(jasmine.objectContaining(TestEditorConfiguration.defaults));
  });

  it('should not use any defaults if all properties are user-defined', () => {
    // given
    const userConfig: TestEditorConfiguration = {
      authentication: {
        redirectUrl: 'custom value!',
        silentRenewUrl: 'custom value!',
        clientId: 'custom value!',
        stsServer: 'custom value!'
      },
      serviceUrls: {
        indexService: 'custom value!',
        persistenceService: 'custom value!',
        testCaseService: 'custom value!',
        testArtifactService: 'custom value!',
        testExecutionService: 'custom value!',
        testSuiteExecutionService: 'custom value!',
        userActivityService: 'custom value!',
        xtextService: 'custom value!',
        validationMarkerService: 'custom value!'
      }
    };

    // when
    const actual = new TestEditorConfiguration(userConfig);

    // then
    expect(actual).toEqual(jasmine.objectContaining(userConfig));
  });
});
