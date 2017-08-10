// copied from prophecy/src/Deferred.js
// cannot be imported due to the used ES6 syntax (export class)
class Deferred {
  constructor () {
    this.promise = new Promise((resolve, reject) => {
      this.resolve_ = resolve;
      this.reject_ = reject;
    });
  }
  resolve (value) {
    this.resolve_.call(this.promise, value);
  }
  reject (reason) {
    this.reject_.call(this.promise, reason);
  }
}

let baseUrl = window.location.origin;
require.config({
    baseUrl: baseUrl + "/assets",
    paths: {
        "jquery": "jquery/dist/jquery.min",
        "ace/ace": "ace/src/ace",
        "ace/ext/language_tools": "ace/src/ext-language_tools",
        "xtext/xtext-ace": "xtext/xtext-ace"
    }
});

// Configure ace
require(["ace/ace"], ace => {
    ace.config.set('basePath', baseUrl + '/assets/ace');
});

// Configure xtext services
require(["xtext/services/XtextService"], xtextService => {
    xtextService.prototype._sendRequest = xtextService.prototype.sendRequest;
    xtextService.prototype.sendRequest = function (editorContext, settings, needsSession) {
        settings.headers = {
            /* Dummy authorization for now... */
            "Authorization": "admin:admin@example.org"
        };
        this._sendRequest(editorContext, settings, needsSession);
    };
});

function createXtextEditor(parent, serviceUrl) {
    let deferred = new Deferred();
    require(["xtext/xtext-ace"], xtext => {
        let editor = xtext.createEditor({
            baseUrl: baseUrl,
            serviceUrl: serviceUrl,
            parent: parent,
            loadFromServer: false,
            sendFullText: true,
            syntaxDefinition: "xtext-resources/generated/mode-mydsl",
            enableSaveAction: true
        });
        deferred.resolve(editor);
    });
    return deferred;
}