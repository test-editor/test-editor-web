# test-editor-web

[![Build Status](https://travis-ci.org/test-editor/test-editor-web.svg?branch=develop)](https://travis-ci.org/test-editor/test-editor-web)

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
