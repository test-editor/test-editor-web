with import <nixpkgs> {};

let firefox_60_esr = stdenv.mkDerivation rec {
    name = "firefox_60_esr";
    version = "60.2.2esr";
    src = fetchurl {
      url = http://ftp.mozilla.org/pub/firefox/releases/60.2.2esr/linux-x86_64/en-US/firefox-60.2.2esr.tar.bz2;
      sha256 = "71ac702c25e654c04ee61ddd5a394ae52e27886beeed7d575542e3fe7e8e4939";
    };

  installPhase = ''
    mkdir -p $out/bin
    cp -r ./* "$out/bin/"
    # correct interpreter and rpath for binaries to work
    find $out -type f -perm -0100 \
        -exec patchelf --interpreter "$(cat $NIX_CC/nix-support/dynamic-linker)" \;
   '';
};

in

stdenv.mkDerivation {
    name = "testeditor-angular-development";
    buildInputs = [
        nodejs-10_x
        nodePackages.npm
        nodePackages.yarn
        nodePackages.jsonlint
        bashInteractive
        firefox_60_esr
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
