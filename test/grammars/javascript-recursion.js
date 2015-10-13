// 1. an almost complete javascript grammar in simple JSON format
var js_grammar = {
        
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
        "keyword"    : "keyword",
        "builtin"    : "builtin",
        "operator"   : "operator",
        "identifier" : "variable",
        "property"   : "attribute",
        "number"     : "number",
        "string"     : "string",
        "regex"      : "string-2"
    },

    
    //
    // Lexical model
    "Lex" : {
        
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
        
        // general identifiers
        "identifier" : "RE::/[_A-Za-z$][_A-Za-z0-9$]*/",
        
        "property" : "RE::/[_A-Za-z$][_A-Za-z0-9$]*/",
        
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
        "regex:escaped-block" : [ "/",    "RE::#/[gimy]{0,4}#" ],
        
        // atoms
        "atom" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [
                "this",
                "true", "false", 
                "null", "undefined", 
                "NaN", "Infinity"
            ]
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
            ]
        },
        
        // builtins
        "builtin" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ 
                "Object", "Function", "Array", "String", "Date", "Number", "RegExp", "Exception",
                "setTimeout", "setInterval", "alert", "console"
            ]
        },
        
        "other" : "RE::/\\S+/",
        
        "ctx_start:action": {"context-start":true},
        
        "ctx_end:action": {"context-end":true},
        
        "match:action": {"push": "$0"},
        "matched_bra:action": {
            "pop": "{",
            "msg": "Brackets do not match"
        },
        "matched_paren:action": {
            "pop": "(",
            "msg": "Parentheses do not match"
        },
        "matched_paren2:action": {
            "pop": "[",
            "msg": "Parentheses do not match"
        },
        
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
        
        "literalProperty" : "string unique_prop | property unique",
        
        "literalValue" : "atom | string | regex | number | identifier | literalArray | literalObject",
        
        "literalPropertyValue" : "literalProperty ':' literalValue",
        
        // grammar recursion here
        "literalObject" : "'{' match ctx_start (literalPropertyValue (',' literalPropertyValue)*)? '}' matched_bra ctx_end",
        
        // grammar recursion here
        "literalArray" : "'[' match (literalValue (',' literalValue)*)? ']' matched_paren2",
        
        "brackets" : "'{' match | '}' matched_bra | '(' match | ')' matched_paren | '[' match | ']' matched_paren2",
        
        "js" : "comment | number | string | regex | keyword | operator | atom | literalObject | literalArray | brackets | other"
    },

    // what to parse and in what order
    "Parser" : [ ["js"] ]
};
