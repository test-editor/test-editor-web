#!/bin/bash

[ -f "./link.config.local.sh" ] && source "./link.config.local.sh"

PREFIX=`npm prefix -g`

if [[ "$1" == "-h" || "$1" == "--help" || "$WORKSPACE_NAVIGATOR" == "" || "$TEST_EDITOR_WEB" == "" || "$PREFIX" = "" ]]; then
  echo "Script to link a locally built web-workspace-navigator into the test-editor-web project."
  echo
  echo "Usage: Simply execute the script."
  echo "Prerequisites:"
  echo "  Configuration file 'link.config.local.sh' must exist in the folder from which this script is executed."
  echo "  The following environment variables (set in the configuration script) are available:"
  echo "    WORKSPACE_NAVIGATOR (currently set to '$WORKSPACE_NAVIGATOR'):"
  echo "      absolute location of the project root"
  echo "    TEST_EDITOR_WEB (currently set to '$TEST_EDITOR_WEB'):"
  echo "      absolute location of the project root"
  echo "    PREFIX (currently set to '$PREFIX'):"
  echo "      absolute path to the global library used by npm"
  echo
  exit 1
fi

echo "running script with the following configuration:"
echo "  workspace navigator project location: $WORKSPACE_NAVIGATOR"
echo "  test edutir web project location: $TEST_EDITOR_WEB"
echo "  npm global library prefix: $PREFIX"

pushd .

cd $WORKSPACE_NAVIGATOR
npm link
cd $TEST_EDITOR_WEB
npm link @testeditor/workspace-navigator
cd $PREFIX/lib/node_modules/@testeditor
rm workspace-navigator # old linking
ln -s $WORKSPACE_NAVIGATOR/out-tsc/lib-es5/ workspace-navigator # new linking

popd


echo "done."
