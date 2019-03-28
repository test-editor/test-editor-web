# test-editor-web

[![Build Status](https://travis-ci.org/test-editor/test-editor-web.svg?branch=develop)](https://travis-ci.org/test-editor/test-editor-web)
[![License](http://img.shields.io/badge/license-EPL-blue.svg?style=flat)](https://www.eclipse.org/legal/epl-v10.html)

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.1.3.
The regular commands apply, see [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Development

### Setup development

Make sure to have a working [nix](https://nixos.org/nix/) installation. Please ensure that the `nixpkgs-unstable` channel is available. It
can be added with `nix-channel --add https://nixos.org/channels/nixpkgs-unstable`.

To enter the development environment, execute `NIXPKGS_ALLOW_UNFREE=1 nix-shell` in this repos root directory. For even more convenience,
please install [direnv](https://github.com/direnv/direnv) which will enter the development environment automatically for you.

Once within the development environment, run `yarn install` to resolve all necessary dependencies

Run this application in development mode by performing:

```
yarn install
ng serve
```

### Publish new version

``` shell
yarn version --patch
```

### Development notes

#### Project dependencies

* angular-split is currently pinned to version 1.0.0-rc.1 because of a bug documented in [issue 85](https://github.com/bertrandg/angular-split/issues/85) of the respective project.

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

### Running docker containers

Make sure that the backend docker images can be pulled or are locally built.

``` shell
npm run docker:build
GIT_PRIVATE_KEY="$(cat ~/.ssh/id_github_rsa)" KNOWN_HOSTS_CONTENT="$(cat ~/.ssh/known_hosts)" docker-compose up
```

### install git commit hook to prevent commits with local file references

In order to prevent commits with local file references within `package.json` the following git commit hook can be installed. To activate this pre commit hook, copy the following script to `.git/hooks/pre-commit` and make it executable!

``` shell
#!/bin/sh

# check that package.json has no "file:" references!

if git rev-parse --verify HEAD >/dev/null 2>&1
then
	against=HEAD
else
	# Initial commit: diff against an empty tree object
	against=`git rev-list --max-parents=0 HEAD`
fi

# Redirect output to stderr.
exec 1>&2

if 	test $(git diff -U0 -G"\"file:" $against package.json | wc -l) != 0
then
	cat <<\EOF
Error: Attempt commit with references to local files in package.json.

EOF
	exit 1
fi
```
## Deployment Configuration

When deploying Test-Editor-Web, its configuration can be customized through the file [src/assets/configuration.js](src/assets/configuration.js). This file defines a function `appConfig` that returns a JSON object of the following form:
```
{
  serviceUrls: {
    xtextService: "<XTEXT-BACKEND>/xtext-service",
    persistenceService: "<PERSISTENCE-BACKEND>",
    testExecutionService: "<PERSISTENCE-BACKEND>/tests",
    testSuiteExecutionService: "<PERSISTENCE-BACKEND>/test-suite",
    validationMarkerService: "<XTEXT-BACKEND>/validation-markers",
    indexService: "<XTEXT-BACKEND>/index",
    testCaseService: "<XTEXT-BACKEND>/test-case",
    userActivityService: "<PERSISTENCE-BACKEND>"
  },
  authentication: {
    stsServer: "<OPEN_ID_CONNECT_PROVIDER>",
    clientId: "<CLIENT_ID>",
    redirectUrl: "<REDIRECT_URL>",
    silentRenewUrl: "<SILENT_RENEW_URL>"
  }
}
```
There are two main blocks:
* **serviceUrls** contains the backend endpoints to be used. Currently, all endpoints are provided by one of two backends, as indicated above: either the _xtext backend_ (also referred to as index backend) or the _persistence backend_. The placeholders in angle brackets should be replaced with their actual URLs. The defaults (for running the Test-Editor locally) are `http://localhost:8080` for the xtext backend, and `http://localhost:9080` for the persistence backend.
* **authentication** contains configuration parameters to set up user authentication through an OpenID Connect provider (Test-Editor-Web uses the [implicit flow](https://tools.ietf.org/html/rfc6749#section-4.2)). The following fields can currently be configured:
    * **stsServer**: The URL of an OpenID provider (_secure token service_) to use for authentication. By default, Google is used, and the corresponding URL is `https://accounts.google.com`.
    * **clientId**: An ID issued by an OpenID Provider to identify this client, i.e. a particular Test-Editor instance. For development and testing purposes, a default ID of `173023782391-6jqf6sgv5mlskj7f35qogtso5je2e1gc.apps.googleusercontent.com` is used.
    * **redirectUrl**: The URL to redirect to after the user was authenticated. This should be the URL of the running Test-Editor-Web instance. For running the Test-Editor locally, it defaults to `localhost:4200`.
    * **silentRenewUrl**: The URL to callback after a silent renew, i.e. periodic re-authentication requests sent to the OpenID Connect provider to avoid a timeout while the user is active. For now, this should always be the same as the redirect URL.
