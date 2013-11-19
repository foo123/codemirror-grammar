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
        "builtins" : true,
        "operators" : true
    },

    // order of tokens parsing
    "TokenOrder" : [
        "comments",
        "numbers",
        "strings",
        "strings2",
        "keywords",
        "builtins",
        "operators",
        "atoms",
        "identifiers2",
        "identifiers"
    ],
        
    //
    // Style model
    "Style" : {
        // lang token type  -> CodeMirror (style) tag
        "error":         "error",
        "comments":      "comment",
        "atoms":         "atom",
        "keywords":      "keyword",
        "builtins":      "builtin",
        "operators":     "operator",
        "identifiers":   "variable",
        "identifiers2":  "variable",
        "numbers":       "number",
        "strings":       "string",
        "strings2":      "string-2"
    },

    
    //
    // Lexical model
    "Lex" : {
        
        // comments
        "comments" : [
            // line comment
            // start, end delims  (null matches end-of-line)
            [  "//",  null ],
            // block comments
            // start,  end    delims
            [  "/*",   "*/" ]
        ],
        
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
        "strings" : [ "RegExp::([`'\"])",   1 ],
        
        // literal regular expressions
        // javascript literal regular expressions can be parsed similar to strings
        "strings2" : [ "/",    "RegExp::/[gimy]?" ],
        
        // operators
        "operators" : [
            [ "\\", "+", "-", "*", "/", "%", "&", "|", "^", "~", "<", ">" , "!" ],
            [ "==", "!=", "<=", ">=", "<>", ">>", "<<" ],
            [ "===", "!==", "<<<", ">>>" ]
        ],
        
        // atoms
        "atoms" : [
            "true", "false", 
            "null", "undefined", 
            "NaN", "Infinity"
        ],

        // keywords
        "keywords" : [ 
            "if", "while", "with", "else", "do", "try", "finally",
            "return", "break", "continue", "new", "delete", "throw",
            "var", "const", "let", "function", "catch",
            "for", "switch", "case", "default",
            "in", "typeof", "instanceof", "this"
        ],
        
        // builtins
        "builtins" : [ 
            "Object", "Array", "String", "Number", "RegExp", "Exception",
            "setTimeout", "setInterval", "alert", "console"
        ]
    }
};
