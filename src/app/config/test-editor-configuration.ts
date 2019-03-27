// from https://stackoverflow.com/questions/41980195/recursive-partialt-in-typescript-2-1#answer-51365037
export type RecursivePartial<T> = {
  [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object ? RecursivePartial<T[P]> :
    T[P];
};

export interface TestEditorConfiguration {
  serviceUrls: TestEditorServiceUrls;
  authentication: TestEditorAuthentication;
}

export interface TestEditorServiceUrls {
  xtextService: string;
  persistenceService: string;
  testExecutionService: string;
  testSuiteExecutionService: string;
  validationMarkerService: string;
  indexService: string;
  testCaseService: string;
  userActivityService: string;
}

export interface TestEditorAuthentication {
  clientId: string;
  redirectUrl: string;
  silentRenewUrl: string;
  stsServer: string;
}

export class TestEditorConfiguration {
  static readonly defaults: TestEditorConfiguration = {
    authentication: {
      clientId: '173023782391-6jqf6sgv5mlskj7f35qogtso5je2e1gc.apps.googleusercontent.com',
      redirectUrl: 'localhost:4200',
      silentRenewUrl: 'localhost:4200',
      stsServer: 'https://accounts.google.com'
    },
    serviceUrls: {
      indexService: 'http://localhost:8080/index',
      persistenceService: 'http://localhost:9080',
      testCaseService: 'http://localhost:8080/test-case',
      testExecutionService: 'http://localhost:9080/tests',
      testSuiteExecutionService: 'http://localhost:9080/test-suite',
      userActivityService: 'http://localhost:9080',
      validationMarkerService: 'http://localhost:8080/validation-markers',
      xtextService: 'http://localhost:8080/xtext-service',
    }
  };

  constructor(userConfig?: RecursivePartial<TestEditorConfiguration>) {
    Object.assign(this, complementWithDefaults(userConfig, TestEditorConfiguration.defaults));
  }

}

function complementWithDefaults<T>(source: T, defaults: T): T {
  const target: Partial<T> = {};
  for (const property in defaults) {
    if (source && source[property] !== undefined) {
      if (typeof defaults[property] === 'object' && defaults[property] !== null) {
        target[property] = complementWithDefaults(source[property], defaults[property]);
      } else {
        target[property] = source[property];
      }
    } else {
      target[property] = defaults[property];
    }
  }
  return target as T;
}

