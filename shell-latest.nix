with import <nixpkgs> {};

let

testeditor = pkgs.callPackage (import (builtins.fetchGit {
      url = "https://github.com/test-editor/nix-packages";
    })) {};

in

stdenv.mkDerivation {
    name = "testeditor-angular-development";
    buildInputs = [
        nodejs-10_x
        nodePackages.npm
        nodePackages.yarn
        nodePackages.jsonlint
        bashInteractive
        testeditor.firefox_latest
        google-chrome
        xvfb_run
        travis
    ];
    shellHook = ''
        # make sure no output is done, since direnv fails with direnv: error unmarshal() base64 decoding: illegal base64 data at input byte ?
        # get a symbolic link to google-chrome-stable such that the karma runner finds the chrome executable (it does not accept google-chrome-stable itself)
        mkdir -p `pwd`/node_modules/.bin && ln -sf $(which google-chrome-stable) `pwd`/node_modules/.bin/google-chrome
        yarn install @angular/cli > /dev/null 2>&1
        # put all linked executables in node_modules on the path
        export PATH=`pwd`/node_modules/.bin:$PATH
    '';
}
