// 1. an almost complete javascript grammar in simple JSON format
var js_grammar = {
        
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RegExp::",
    
    // lists of (simple/string) tokens to be grouped into one regular expression,
    // else matched one by one, 
    // this is usefull for speed fine-tuning the parser
    "RegExpGroups" : {
        "atom" : true,
        "keyword" : true,
        "builtin" : true,
        "operator" : true
    },
        
    //
    // Style model
    "Style" : {
        // lang token type  -> CodeMirror (style) tag
        "error":      "error",
        "comment":    "comment",
        "atom":       "atom",
        "keyword":    "keyword",
        "builtin":    "builtin",
        "operator":   "operator",
        "identifier": "variable",
        "number":     "number",
        "string":     "string",
        "regex":      "string-2"
    },

    
    //
    // Lexical model
    "Lex" : {
        
        // comments
        "comment" : {
            "type" : "block",
            "tokens" : [
                // line comment
                // start, end delims  (null matches end-of-line)
                [  "//",  null ],
                // block comments
                // start,  end    delims
                [  "/*",   "*/" ]
            ]
        },
        
        // general identifiers
        "identifier" : {
            "type" : "simple",
            "tokens" : "RegExp::[_A-Za-z][_A-Za-z0-9]*"
        },

        // numbers, in order of matching
        "number" : {
            "type" : "simple",
            "tokens" : [
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
            ]
        },

        // usual strings
        "string" : {
            "type" : "escaped-block",
            "escape" : "\\",
            // start, end of string (can be the matched regex group ie. 1 )
            "tokens" : [ "RegExp::([`'\"])",   1 ]
        },
        
        // literal regular expressions
        "regex" : {
            "type" : "escaped-block",
            "escape" : "\\",
            // javascript literal regular expressions can be parsed similar to strings
            "tokens" : [ "/",    "RegExp::/[gimy]?" ]
        },
        
        // operators
        "operator" : {
            "type" : "simple",
            "tokens" : [
                [ "\\", "+", "-", "*", "/", "%", "&", "|", "^", "~", "<", ">" , "!" ],
                [ "==", "!=", "<=", ">=", "<>", ">>", "<<" ],
                [ "===", "!==", "<<<", ">>>" ]
            ]
        },
        
        // atoms
        "atom" : {
            "type" : "simple",
            "tokens" : [
                "true", "false", 
                "null", "undefined", 
                "NaN", "Infinity"
            ]
        },

        // keywords
        "keyword" : {
            "type" : "simple",
            "tokens" : [ 
                "if", "while", "with", "else", "do", "try", "finally",
                "return", "break", "continue", "new", "delete", "throw",
                "var", "const", "let", "function", "catch",
                "for", "switch", "case", "default",
                "in", "typeof", "instanceof", "this"
            ]
        },
        
        // builtins
        "builtin" : {
            "type" : "simple",
            "tokens" : [ 
                "Object", "Array", "String", "Number", "RegExp", "Exception",
                "setTimeout", "setInterval", "alert", "console"
            ]
        }
    },

    // what to parse and in what order
    "Parser" : [
        "comment",
        "number",
        "string",
        "regex",
        "keyword",
        "builtin",
        "operator",
        "atom",
        "identifier"
    ]
};
