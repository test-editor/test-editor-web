FROM nginx:stable-alpine

# This image needs one environment variables upon execution:
# * APP_CONFIG
#   The complete contents of "assets/configuration.js" with
#   appropriate endpoint URLs. Example:
#
#       var appConfig = function() {
#          return {
#          serviceUrls: {
#            xtextService: "http://localhost:8080/xtext-service",
#            persistenceService: "http://localhost:9080",
#            testExecutionService: "http://localhost:9080/tests",
#            testSuiteExecutionService: "http://localhost:9080/test-suite",
#            validationMarkerService: "http://localhost:8080/validation-markers",
#            indexService: "http://localhost:8080/index",
#            testCaseService: "http://localhost:8080/test-case"
#          }
#        }
#        };

LABEL license="EPL 1.0" \
      name="testeditor/web"

ENV WORK_DIR=/usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.default.conf /etc/nginx/conf.d/default.conf

RUN chmod -R 777 /var/log/nginx /var/cache /var/run && \
    chmod -R 777 /etc/nginx/* && \
    chmod -R 777 /usr/share/nginx/*

COPY dist ${WORK_DIR}/

USER nginx

EXPOSE 4200

ENTRYPOINT [ "./run.sh" ]
