let baseUrl = window.location.pathname;
let fileIndex = baseUrl.indexOf("index.html");
if (fileIndex > 0) {
    baseUrl = baseUrl.slice(0, fileIndex);
}
require.config({
    baseUrl: baseUrl + "assets",
    paths: {
        "jquery": "jquery/dist/jquery.min",
        "ace/ace": "ace/src/ace",
        "ace/ext/language_tools": "ace/src/ext-language_tools",
        "xtext/xtext-ace": "xtext/xtext-ace"
    }
});

function createXtextEditor(parent, resourceId) {
    console.log(`createXtextEditor(${parent}, ${resourceId})`)
    require(["ace/ace", "xtext/xtext-ace"], function(ace, xtext) {
        ace.config.set('basePath', baseUrl + 'assets/ace');
        xtext.createEditor({
            baseUrl: baseUrl,
            serviceUrl: 'http://localhost:8080/xtext-service',
            parent: parent,
            resourceId: resourceId,
            syntaxDefinition: "xtext-resources/generated/mode-mydsl",
            enableSaveAction: true
        });
    });
}