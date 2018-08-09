#!/bin/bash

if [ "${APP_CONFIG}" != "" ]; then
  echo "${APP_CONFIG}" > ${WORK_DIR}/assets/configuration.js
else
  echo "WARNING: environment variable 'APP_CONFIG' not set. Defaults will be used."
fi

nginx -g daemon off;
