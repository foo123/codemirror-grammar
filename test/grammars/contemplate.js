// 1. JSON grammar for Contemplate Engine ( https://github.com/foo123/Contemplate )
var contemplate_grammar = {
        
        // prefix ID for regular expressions used in the grammar
        "RegExpID" : "RegExp::",
        
        // lists of (simple/string) tokens to be grouped into one regular expression,
        // else matched one by one, 
        // this is usefull for speed fine-tuning the parser
        "RegExpGroups" : {
            "atoms" : true,
            "keywords" : true,
            "builtins" : true,
            "meta" : true,
            "operators" : true,
            "delimiters" : true
        },
    
        // order of tokens parsing
        "TokenOrder" : [
            "keywords",
            "builtins",
            "atoms",
            "operators",
            "delimiters",
            "numbers",
            "strings",
            "meta",
            "identifiers"
        ],
            
        //
        // style model
    
        // lang token type  -> CodeMirror (style) tag
        "Style" : {
            "error":       "error",
            "meta":        "tagContemplate",
            "comment":     "comment",
            "atom":        "atom",
            "keyword":     "tagContemplate",
            "builtin":     "tagContemplate",
            "operator":    "operator",
            "delimiter":   "bracket",
            "identifier":  "variable",
            "number":      "number",
            "string":      "string"
        },

        
        //
        // lexical model
        
        // identifiers, in order of matching
        // contemplate variables
        "identifiers" : "RegExp::\\$[_A-Za-z][_A-Za-z0-9]*",

        // numbers, in order of matching
        "numbers" : [
            // floats
            "RegExp::\\d*\\.\\d+(e[\\+\\-]?\\d+)?",
            "RegExp::\\d+\\.\\d*",
            "RegExp::\\.\\d+",
            // integers
            "RegExp::[1-9]\\d*(e[\\+\\-]?\\d+)?",
            // just zero
            "RegExp::0(?![\\dx])"
        ],

        // strings
        // start, end of string (can be the matched regex group ie. 1 )
        "strings" : [ "RegExp::(['\"])", 1 ],
        
        // operators
        "operators" : [
            [ "+", "-", "*", "/", "%", "<", ">", "!" ],
            [ "=>", "==", "!=", "<=", ">=", "<>", "||", "&&" ]
        ],
        
        // delimiters
        "delimiters" : [ 
            "=", "(", ")", "[", "]"
        ],
        
        // atoms
        "atoms" : [ "true", "false" ],

        // meta
        "meta" : [ "<%", "%>" ],

        // keywords
        "keywords" : [
            "%extends", "%block", "%endblock", "%template", "%include",
            "%if", "%elseif", "%else", "%endif", "%for", "%elsefor",
            "%endfor", "as"
        ],
                              
        // builtin functions, constructs, etc..
        "builtins" : [
            "%now", "%date", "%ldate", "%count", "%sprintf",
            "%htmltable", "%htmlselect", "%concat",
            "%s", "%n", "%f", "%l"
        ]
};