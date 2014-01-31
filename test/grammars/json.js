// 1. a complete json grammar in simple JSON format
var json_grammar = {
        
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RegExp::",
    
    "Extra" : {
        "fold" : "brace"
    },
    
    //
    // Style model
    "Style" : {
        // lang token type  -> Editor (style) tag
        "comment":    "comment",
        "atom":       "atom",
        "number":     "number",
        "string":     "string"
    },

    
    //
    // Lexical model
    "Lex" : {
        
        // comments
        "comment" : {
            "type" : "comment",
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
            "RegExp::/\\d*\\.\\d+(e[\\+\\-]?\\d+)?/",
            "RegExp::/\\d+\\.\\d*/",
            "RegExp::/\\.\\d+/",
            // integers
            // hex
            "RegExp::/0x[0-9a-fA-F]+L?/",
            // binary
            "RegExp::/0b[01]+L?/",
            // octal
            "RegExp::/0o[0-7]+L?/",
            // decimal
            "RegExp::/[1-9]\\d*(e[\\+\\-]?\\d+)?L?/",
            // just zero
            "RegExp::/0(?![\\dx])/"
        ],

        // usual strings
        "string" : {
            "type" : "escaped-block",
            "escape" : "\\",
            // start, end of string (can be the matched regex group ie. 1 )
            "tokens" : [ "\"",   "\"" ]
        },
        
        // atoms
        "atom" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ "true", "false", "null" ]
        }
    },
    
    //
    // Syntax model (optional)
    "Syntax" : {
        
        "literalObject" : {
            "type" : "group",
            "match" : "all",
            "tokens" : [ "{", "literalPropertyValues", "}" ]
        },
        
        "literalArray" : {
            "type" : "group",
            "match" : "all",
            "tokens" : [ "[", "literalValues", "]" ]
        },
        
        // grammar recursion here
        "literalValue" : {
            "type" : "group",
            "match" : "either",
            "tokens" : [ "atom", "string", "number", "literalArray", "literalObject" ]
        },
        
        "literalValuesRest" : {
            "type" : "group",
            "match" : "all",
            "tokens" : [ ",", "literalValue" ]
        },
        
        "literalPropertyValue" : {
            "type" : "group",
            "match" : "all",
            "tokens" : [ "string", ":", "literalValue" ]
        },
        
        "literalPropertyValuesRest" : {
            "type" : "group",
            "match" : "all",
            "tokens" : [ ",", "literalPropertyValue" ]
        },
        
        "literalValuesRestOptional" : {
            "type" : "group",
            "match" : "zeroOrMore",
            "tokens" : [ "literalValuesRest" ]
        },
        
        "literalPropertyValuesRestOptional" : {
            "type" : "group",
            "match" : "zeroOrMore",
            "tokens" : [ "literalPropertyValuesRest" ]
        },
        
        "literalValues" : {
            "type" : "ngram",
            "tokens" : [
                [ "literalValue", "literalValuesRestOptional" ]
            ]
        },
        
        "literalPropertyValues" : {
            "type" : "ngram",
            "tokens" : [
                [ "literalPropertyValue", "literalPropertyValuesRestOptional" ]
            ]
        },
        
        "literalNGram" : {
            "type" : "n-gram",
            "tokens" : [
                ["literalObject"],
                ["literalArray"]
            ]
        }
    },

    // what to parse and in what order
    "Parser" : [
        // allow comments in json ;)
        "comment",
        "number",
        "string",
        "atom",
        "literalNGram"
    ]
};
