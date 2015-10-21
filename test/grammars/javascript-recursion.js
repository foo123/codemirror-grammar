// 1. an almost complete javascript grammar in simple JSON format
var js_grammar = {
        
    // prefix ID for regular expressions used in the grammar
    "RegExpID": "RE::",
    
    "Extra": {
        "fold" : "brace"
    },
    
    // Style model
    "Style": {
        // lang token type  -> Editor (style) tag
        "comment"    : "comment",
        "atom"       : "atom",
        "keyword"    : "keyword",
        "builtin"    : "builtin",
        "operator"   : "operator",
        "identifier" : "variable",
        "property"   : "attribute",
        "number"     : "number",
        "string"     : "string",
        "regex"      : "string-2"
    },

    // Lexical model
    "Lex": {
        // comments
        "comment:comment" : {
            "interleave": true,
            "tokens" : [
                // line comment
                [  "//",  null ],
                // block comments
                [  "/*",   "*/" ]
            ]
        },
        
        // general identifiers, but property as well
        "identifier" : "RE::/[_A-Za-z$][_A-Za-z0-9$]*/",
        
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
        "string:escaped-block" : [ "RE::/(['\"])/",   1 ],
        
        // literal regular expressions
        "regex:escaped-line-block" : [ "/",    "RE::#/[gimy]{0,4}#" ],
        
        // atoms
        "atom" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [
                "this",
                "true", "false", 
                "null", "undefined", 
                "NaN", "Infinity"
            ],
            "meta": "JavaScript ATOM"
        },

        // keywords
        "keyword" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ 
                "if", "while", "with", "else", "do", "try", "finally",
                "return", "break", "continue", "new", "delete", "throw",
                "var", "const", "let", "function", "catch",
                "for", "switch", "case", "default",
                "in", "typeof", "instanceof"
            ],
            "meta": "JavaScript KEYWORD"
        },
        
        // builtins
        "builtin" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ 
                "Object", "Function", "Array", "String", "Date", "Number", "RegExp", "Exception",
                "setTimeout", "setInterval", "alert", "console", 'window', 'prototype', 'constructor'
            ],
            "meta": "JavaScript Builtins"
        },
        
        "other" : "RE::/\\S+/",
        
        "ctx:action": {"context":true},
        "\\ctx:action": {"context":false},
        
        "match_b:action": {"push": "}"},
        "match_p:action": {"push": ")"},
        "match_p2:action": {"push": "]"},
        "\\match:action": {
            "pop": "$0",
            "msg": "Brackets do not match"
        },
        
        "unique:action": {
            "unique": ["prop", "$1"],
            "msg": "Duplicate object property \"$0\"",
            "in-context": true
        }
    },
    
    //
    // Syntax model (optional)
    "Syntax" : {
        
        "literalProperty1" : "string | /0|[1-9][0-9]*/ | identifier",
        
        // back-reference, should be handled
        "literalProperty" : "literalProperty1",
        
        "literalValue" : "atom | string | regex | number | identifier | literalArray | literalObject",
        
        // here, modifier should apply to all of "literalProperty1", via back-reference chain
        "literalPropertyValue" : "literalProperty.property unique ':' literalValue",
        
        // grammar recursion here
        "literalObject" : "'{' match_b ctx (literalPropertyValue (',' literalPropertyValue)*)? '}' \\match \\ctx",
        
        // grammar recursion here
        "literalArray" : "'[' match_p2 (literalValue (',' literalValue)*)? ']' \\match",
        
        "brackets" : "'{' match_b | '}' \\match | '(' match_p | ')' \\match | '[' match_p2 | ']' \\match",
        
        "js" : "comment | number | string | regex | keyword | operator | atom | literalObject | literalArray | brackets | other"
    },

    // what to parse and in what order
    "Parser" : [ ["js"] ]
};
