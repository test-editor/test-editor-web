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

function createXtextEditor(parent, resourceId) {
    require(["xtext/xtext-ace"], xtext => {
        xtext.createEditor({
            baseUrl: baseUrl,
            serviceUrl: 'http://localhost:8080/xtext-service',
            parent: parent,
            resourceId: resourceId,
            sendFullText: true,
            syntaxDefinition: "xtext-resources/generated/mode-mydsl",
            enableSaveAction: true
        });
    });
}