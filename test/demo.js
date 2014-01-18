function codemirror_grammar_demo(code, lang, grammar)
{
    // 2. parse the grammar into a Codemirror syntax-highlight mode
    var mode = CodeMirrorGrammar.getMode(grammar);
    
    // 3. register the mode with Codemirror
    CodeMirror.defineMode(lang, mode);
    // enable syntax validation
    CodeMirror.registerHelper("lint", lang, mode().validator);
    
    // use it!
    var editor = CodeMirror.fromTextArea(code, {
        mode: lang,
        lineNumbers: true,
        indentUnit: 4,
        indentWithTabs: false,
        extraKeys: {"Ctrl-L": "toggleComment"},
        gutters: ["CodeMirror-lint-markers"],
        lint: true
    });
    
    editor.setSize(null, 500);
    return editor;
}