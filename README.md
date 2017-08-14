# test-editor-web

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.1.3.
The regular commands apply, see [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

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
    <td>string</td>
    <td><pre>
{
  "type": "editor.active",
  "payload": "com/example/test.tsl"
}</pre></td>
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
}</pre></td>
  </tr>
</table>