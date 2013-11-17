codemirror-grammar
==================

__Transform a JSON grammar into a CodeMirror syntax-highlight parser__



A simple and light-weight ( ~ 15kB minified) [CodeMirror](https://github.com/marijnh/codemirror) add-on

to generate syntax-highlight parsers (codemirror modes) from a grammar specification in JSON format.


__Support for markup-like grammars is added__  ( see for example [/test/grammar-xml.html](/test/grammar-xml.html) )


Code Indentation is Codemirror default, looking for ways to add more elaborate indentation rules to the grammar specification.

Also looking for ways to add context-specific parsing information to the grammar specification.



###How to use:

See working examples under [/test](/test) folder.

An example for JavaScript:


```javascript

// 1. an almost complete javascript grammar in simple JSON format
var js_grammar = {
        
        // prefix ID for regular expressions used in the grammar
        "RegExpID" : "RegExp::",
        
        // lists of (simple/string) tokens to be grouped into one regular expression,
        // else matched one by one, 
        // this is usefull for speed fine-tuning the parser
        "RegExpGroups" : {
            "atoms" : true,
            "keywords" : true,
            "operators" : true
        },
    
        // order of tokens parsing
        "TokenOrder" : [
            "comments",
            "numbers",
            "strings",
            "strings2",
            "keywords",
            "operators",
            "atoms",
            "identifiers2",
            "identifiers"
        ],
            
        //
        // style model
    
        // lang token type  -> CodeMirror (style) tag
        "Style" : {
            "error":       "error",
            "comment":     "comment",
            "atom":        "atom",
            "keyword":     "keyword",
            "operator":    "operator",
            "identifier":  "variable",
            "identifier2":  "variable",
            "number":      "number",
            "string":      "string",
            "string2":      "string-2"
        },

        
        //
        // lexical model
        
        // comments
        "comments" : {
            "line" : [ "//" ],
            "block" : [ "/*", "*/" ]
        },
        
        // general identifiers
        "identifiers" : "RegExp::[_A-Za-z][_A-Za-z0-9]*",
        // labels
        "identifiers2" : "RegExp::[_A-Za-z][_A-Za-z0-9]*:",

        // numbers, in order of matching
        "numbers" : [
            // floats
            "RegExp::\\d*\\.\\d+(e[\\+\\-]?\\d+)?",
            "RegExp::\\d+\\.\\d*",
            "RegExp::\\.\\d+",
            // integers
            // hex
            "RegExp::0x[0-9a-fA-F]+L?",
            // binary
            "RegExp::0b[01]+L?",
            // octal
            "RegExp::0o[0-7]+L?",
            // decimal
            "RegExp::[1-9]\\d*(e[\\+\\-]?\\d+)?L?",
            // just zero
            "RegExp::0(?![\\dx])"
        ],

        // usual strings
        // start, end of string (can be the matched regex group ie. 1 )
        "strings" : [ "RegExp::([`'\"])", 1 ],
        
        // literal regular expressions
        // javascript literal regular expressions can be parsed similar to strings
        "strings2" : [ "/", "RegExp::/[gimy]?" ],
        
        // operators
        "operators" : [
            [ "\\", "+", "-", "*", "/", "%", "&", "|", "^", "~", "<", ">" , "!" ],
            [ "==", "!=", "<=", ">=", "<>", ">>", "<<" ],
            [ "===", "!==", "<<<", ">>>" ]
        ],
        
        // atoms
        "atoms" : [
            "true", "false", "null"
        ],

        // keywords
        "keywords" : [ 
            "if", "while", "with", "else", "do", "try", "finally",
            "return", "break", "continue", "new", "delete", "throw",
            "var", "const", "let", "function", "catch",
            "for", "switch", "case", "default",
            "in", "typeof", "instanceof", "true", "false", 
            "null", "undefined", "NaN", "Infinity", "this"
        ]
};
        
// 2. parse the grammar into a Codemirror syntax-highlight mode
var js_mode = CodeMirrorGrammar.getMode(js_grammar);

// 3. register the mode with Codemirror
CodeMirror.defineMode("js", js_mode);

// use it!
var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    lineNumbers: true,
    matchBrackets: true,
    mode: "js",
    indentUnit: 4,
    indentWithTabs: false,
    enterMode: "keep",
    tabMode: "shift"
});
editor.setSize(null, 500);

```


Result:

![js-grammar](/test/grammar-js.png)


###Other Working examples:

![css-grammar](/test/grammar-css.png)

![python-grammar](/test/grammar-python.png)

![xml-grammar](/test/grammar-xml.png)

