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
        
        // identifiers
        
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

        // strings
        // start, end of string (can be the matched regex group ie. 1 )
        "strings" : [ "RegExp::([`'\"])", 1 ],
        
        // lireal regexes
        // javascripts literal regular expressions can be parsed like strings
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
