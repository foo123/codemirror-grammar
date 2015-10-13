// 1. a complete json grammar in simple JSON format
var json_grammar = {
        
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RE::",
    
    "Extra" : {
        "fold" : "brace"
    },
    
    //
    // Style model
    "Style" : {
        // lang token type  -> Editor (style) tag
        "comment"    : "comment",
        "atom"       : "atom",
        "number"     : "number",
        "string"     : "string"
    },

    
    //
    // Lexical model
    "Lex" : {
        
        // comments
        "comment:comment" : {
            "interleave": true,
            "tokens" : [
                // line comment
                // start, end delims  (null matches end-of-line)
                [  "//",  null ],
                // block comments
                // start,  end    delims
                [  "/*",   "*/" ]
            ]
        },
        
        // numbers, in order of matching
        "number" : [
            // floats
            "RE::/\\d*\\.\\d+(e[\\+\\-]?\\d+)?/",
            "RE::/\\d+\\.\\d*/",
            "RE::/\\.\\d+/",
            // integers
            // hex
            "RE::/0x[0-9a-fA-F]+L?/",
            // binary
            "RE::/0b[01]+L?/",
            // octal
            "RE::/0o[0-7]+L?/",
            // decimal
            "RE::/[1-9]\\d*(e[\\+\\-]?\\d+)?L?/",
            // just zero
            "RE::/0(?![\\dx])/"
        ],

        // usual strings
        "string:escaped-block" : [ "\"",   "\"" ],
        
        // atoms
        "atom" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ "true", "false", "null" ]
        },
        
        "other": "RE::/\\S+/",
        
        "ctx_start:action": {"context-start":true},
        
        "ctx_end:action": {"context-end":true},
        
        "error:action":{"error":true,"msg":"Invalid JSON"},
        
        "unique:action": {
            "unique": ["prop", "$0"],
            "msg": "Duplicate object property \"$0\"",
            "in-context": true
        },
        
        "unique_prop:action": {
            "unique": ["prop", "$1"],
            "msg": "Duplicate object property \"$0\"",
            "in-context": true
        }
    },
    
    //
    // Syntax model (optional)
    "Syntax" : {
        "literalObject" : "'{' ctx_start (literalPropertyValue (',' literalPropertyValue)*)? '}' ctx_end",
        "literalArray" : "'[' (literalValue (',' literalValue)*)? ']'",
        // grammar recursion here
        "literalValue" : "atom | string | number | literalArray | literalObject",
        "literalPropertyValue" : "string unique_prop ':' literalValue",
        "json:ngram" : ["literalValue | other error"]
    },

    // what to parse and in what order
    // allow comments in json ;)
    "Parser" : [ "comment", "json" ]
};
