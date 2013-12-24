function codemirror_grammar_demo(code, /*,options, grammar,*/ mode /*, code*/)
{
    // use it!
    var editor = CodeMirror.fromTextArea(code, {
        mode: mode,
        lineNumbers: true,
        indentUnit: 4,
        indentWithTabs: false,
        extraKeys: {"Ctrl-L": "toggleComment"}
    });
    editor.setSize(null, 500);
    return editor;
}