function codemirror_grammar_demo(code, langs)
{
    document.getElementById('editor-version').innerHTML = CodeMirror.version;
    document.getElementById('grammar-version').innerHTML = CodeMirrorGrammar.VERSION;
    
    var main_lang, main_mode;
    
    for (var i=0,l=langs.length; i<l; i++)
    {
    var lang = langs[i].language, grammar = langs[i].grammar, Mode;
    
    // 2. parse the grammar into a Codemirror syntax-highlight mode
    Mode = CodeMirrorGrammar.getMode( grammar );
    Mode.name = lang;
    
    // 3. register the mode with Codemirror
    CodeMirror.defineMode(lang, Mode);
    if ( 0 === i )
    {
        // main mode
        main_lang = lang; main_mode = Mode;
        
        // enable syntax validation
        main_mode.supportGrammarAnnotations = true;
        // enable code folding
        main_mode.supportCodeFolding = true;
        // enable code matching
        main_mode.supportCodeMatching = true;
        // enable autocomplete, have a unique cmd to not interfere with any default autocompletes
        main_mode.supportAutoCompletion = true;
        main_mode.autocompleter.options =  {prefixMatch:true, caseInsensitiveMatch:false, inContext:true};
        
        CodeMirror.registerHelper("lint", main_lang, main_mode.linter);
        CodeMirror.registerHelper("fold", main_mode.foldType, main_mode.folder);
        
        CodeMirror.defineOption(main_mode.matchType, false, function( cm, val, old ) {
            if ( old && old != CodeMirror.Init )
            {
                cm.off( "cursorActivity", main_mode.matcher );
                main_mode.matcher.clear( cm );
            }
            if ( val )
            {
                cm.on( "cursorActivity", main_mode.matcher );
                main_mode.matcher( cm );
            }
        });
    }
    else
    {
        // submodes
        // add any sub/inner modes to main mode
        main_mode.submode(lang, CodeMirror.getMode({}, lang));
    }
    }
    
    // use it!
    var autocomplete_cmd = 'autocomplete_grammar_'+main_lang, togglecomment_cmd = 'togglecomment_grammar_'+main_lang;
    CodeMirror.commands[autocomplete_cmd] = function( cm ) {
        CodeMirror.showHint(cm, main_mode.autocompleter);
    };
    /*CodeMirror.commands[togglecomment_cmd] = function( cm ) {
        cm.toggleComment( main_mode.options() )
    };*/
    var opts = {
        mode: main_lang,
        lineNumbers: true,
        indentUnit: 4,
        indentWithTabs: false,
        extraKeys: {"Ctrl-Space": autocomplete_cmd, "Ctrl-L": "toggleComment"},
        gutters: ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        foldGutter: true,
        // enable syntax validation
        lint: true
    };
    // enable code matching
    opts[main_mode.matchType] = true;
    var editor = CodeMirror.fromTextArea(code, opts);
    
    editor.setSize(null, 500);
    return editor;
}