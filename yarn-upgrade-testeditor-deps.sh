#!/bin/bash
yarn list | grep '@testeditor' | sed -e "s/^[^@]*//g" | sed -e "s/@[^@]*$//g" | xargs -L100 -t yarn upgrade
