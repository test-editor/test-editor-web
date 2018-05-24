# test-editor-web

[![Build Status](https://travis-ci.org/test-editor/test-editor-web.svg?branch=develop)](https://travis-ci.org/test-editor/test-editor-web)
[![License](http://img.shields.io/badge/license-EPL-blue.svg?style=flat)](https://www.eclipse.org/legal/epl-v10.html)

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.1.3.
The regular commands apply, see [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Development

Run this application in development mode by performing:

```
yarn install
ng serve
```

## EditorTabsComponent

Emits the following events:

<table border="1" width="100%">
  <tr>
    <th>Event Id</th>
    <th>Payload Type</th>
    <th>Example</th>
  </tr>
  <tr>
    <td>editor.active</td>
    <td>Element</td>
    <td>
<pre>
{
  "type": "editor.active",
  "payload": {
    "path": "com/example/test.tsl"
  }
}
</pre>
    </td>
  </tr>
  <tr>
    <td>editor.dirtyStateChanged</td>
    <td>DirtyState</td>
    <td>
<pre>
{
  "type": "editor.dirtyStateChanged",
  "payload": {
    "path": "com/example/test.tsl",
    "dirty": true
  }
}
</pre></td>
  </tr>
  <tr>
    <td>editor.close</td>
    <td>Element</td>
    <td>
<pre>
{
  "type": "editor.close",
  "payload": {
    "path": "com/example/test.tsl"
  }
}
</pre>
    </td>
  </tr>
</table>

Understands the following events:

<table border="1" width="100%">
  <tr>
    <th>Event Id</th>
    <th>Payload Type</th>
    <th>Example</th>
  </tr>
  <tr>
    <td>navigation.open</td>
    <td>
      WorkspaceDocument
      (<a href="https://www.npmjs.com/package/@testeditor/workspace-navigator">workspace-navigator</a>)
    </td>
    <td><pre>
{
  "type": "navigation.open",
  "payload": {
    "name": "test.tsl",
    "path": "com/example/test.tsl"
  }
}
</pre></td>
  </tr>
</table>

## Linking local web-workspace-navigator into node_modules

In order to work with non published artifacts of web-workspace-navigator within the test-editor-web, linking can be used.
Given the following variables, this are the steps to have functional linking in place without modifying any sources.
TODO: if deemed useful these steps should be put into scripts.

``` shell
WORKSPACE_NAVIGATOR="~/path/to/project"
TEST_EDITOR_WEB="~/path/to/project"
PREFIX=`npm prefix -g`
```

### bring linking into place

``` shell
cd $WORKSPACE_NAVIGATOR
npm link
cd $TEST_EDITOR_WEB
npm link @testeditor/workspace-navigator
cd $PREFIX/lib/node_modules/@testeditor
rm workspace-navigator # old linking
ln -s $WORKSPACE_NAVIGATOR/out-tsc/lib-es5/ workspace-navigator # new linking
# check the link
ls $TEST_EDITOR_WEB/node_modules/@testeditor/workspace-navigator
```

### build web-workspace-navigator initially

``` shell
cd $WORKSPACE_NAVIGATOR # only if not already there
npm run build
```

### build and serve test-editor-web

``` shell
cd $TEST_EDITOR_WEB # only if not already there
npm run start
```


### make changes to web-workspace-navigator

``` shell
cd $WORKSPACE_NAVIGATOR # only if not already there
node build.js 
```

`node build.js` will not cleanup all old resources, so this works only for some changes, in all other cases use `npm run build`. If `npm run build` is run, the test editor web needs to be restarted!

### undo linking and restore original modules

``` shell
rm $PREFIX/lib/node_modules/@testeditor/workspace-navigator
cd $TEST_EDITOR_WEB
rm node_modules/@testeditor/workspace-navigator
yarn install --force
npm run build
```

### use direct file references (e.g. for local web-testexec-navigator)

Replace the dependency line within `package.json` with this reference to the local project.

``` typescript
  "@testeditor/testexec-navigator": "file:../web-testexec-navigator/dist",
```
