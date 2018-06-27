#!/bin/bash
yarn list --pattern "testeditor.*" --flat | grep '@' | awk  '{ print $2; }' | sed -e "s/@[^@]*$//g" | xargs -L100 -t yarn upgrade
