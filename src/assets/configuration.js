var appConfig = function() {
  return {
  serviceUrls: {
    xtextService: "http://localhost:8080/xtext-service",
    persistenceService: "http://localhost:9080",
    testExecutionService: "http://localhost:10080/tests",
    testSuiteExecutionService: "http://localhost:10080/test-suite",
    testArtifactService: "http://localhost:10080",
    validationMarkerService: "http://localhost:8080/validation-markers",
    indexService: "http://localhost:8080/index",
    testCaseService: "http://localhost:8080/test-case",
    userActivityService: "http://localhost:9080"
  }
}
};
