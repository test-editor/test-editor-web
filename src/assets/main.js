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

/* Setup ajax / xtext services. */
require(
    ["jquery", "ace/ace", "xtext/xtext-ace", "xtext/services/XtextService"],
    function (jquery, ace, xtext, xtextService) {
        ace.config.set('basePath', baseUrl + '/assets/ace');

        /* Dummy authorization for now... */
        xtextService.prototype._sendRequest = xtextService.prototype.sendRequest;
        xtextService.prototype.sendRequest = function (editorContext, settings, needsSession) {
            settings.headers = {
                "Authorization": "admin:admin@example.org"
            };
            this._sendRequest(editorContext, settings, needsSession);
        };
    }
);

function createXtextEditor(parent, resourceId) {
    console.log(`createXtextEditor(${parent}, ${resourceId})`);
    require(
        ["jquery", "ace/ace", "xtext/xtext-ace", "xtext/services/XtextService"],
        function (jquery, ace, xtext, xtextService) {
            xtext.createEditor({
                baseUrl: baseUrl,
                serviceUrl: 'http://localhost:8080/xtext-service',
                parent: parent,
                resourceId: resourceId,
                sendFullText: true,
                syntaxDefinition: "xtext-resources/generated/mode-mydsl",
                enableSaveAction: true
            });
        }
    );
}