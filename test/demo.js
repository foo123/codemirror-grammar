function codemirror_grammar_demo(code, lang, grammar)
{
    document.getElementById('version').innerHTML = CodeMirrorGrammar.VERSION;
    
    // 2. parse the grammar into a Codemirror syntax-highlight mode
    var mode = CodeMirrorGrammar.getMode(grammar);
    
    // 3. register the mode with Codemirror
    CodeMirror.defineMode(lang, mode);
    // enable syntax validation
    mode.supportGrammarAnnotations = true;
    CodeMirror.registerHelper("lint", lang, mode.validator);
    // enable autocomplete, have a unique cmd to not interfere with any default autocompletes
    var autocomplete_cmd = 'autocomplete_grammar_'+lang;
    CodeMirror.commands[autocomplete_cmd] = function( cm ) {
        CodeMirror.showHint(cm, mode.autocomplete);
    };

    // use it!
    var editor = CodeMirror.fromTextArea(code, {
        mode: lang,
        lineNumbers: true,
        indentUnit: 4,
        indentWithTabs: false,
        extraKeys: {"Ctrl-Space": autocomplete_cmd, "Ctrl-L": "toggleComment"},
        gutters: ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        foldGutter: true,
        // enable syntax validation
        lint: true
    });
    
    editor.setSize(null, 500);
    return editor;
}