// 1. an almost complete python grammar in simple JSON format
var python_grammar = {
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RegExp::",

    //
    // Style model
    "Style" : {
        // lang token type  -> Editor (style) tag
        "decorator":    "meta",
        "comment":      "comment",
        "keyword":      "keyword",
        "builtin":      "builtin",
        "operator":     "operator",
        "identifier":   "variable",
        "number":       "number",
        "string":       "string",
        "heredoc":      "string"
    },

    
    //
    // Lexical model
    "Lex" : {
    
        // comments
        "comment" : {
            "type" : "comment",
            "tokens" : [
                // null delimiter, matches end-of-line
                ["#",  null]
            ]
        },
        
        // blocks, in this case heredocs
        "heredoc" : {
            "type" : "block",
            "tokens" : [ 
                // begin and end of heredocs
                // if no end given, end is same as start of block
                [ "'''" ], 
                [ "\"\"\"" ], 
                [ "RegExp::([rubRUB]|(ur)|(br)|(UR)|(BR))?('{3}|\"{3})", 6 ] 
            ]
        },
        
        // general identifiers
        "identifier" : "RegExp::[_A-Za-z][_A-Za-z0-9]*",

        // numbers, in order of matching
        "number" : [
            // floats
            "RegExp::\\d*\\.\\d+(e[\\+\\-]?\\d+)?[jJ]?",
            "RegExp::\\d+\\.\\d*[jJ]?",
            "RegExp::\\.\\d+[jJ]?",
            // integers
            // hex
            "RegExp::0x[0-9a-fA-F]+[lL]?",
            // binary
            "RegExp::0b[01]+[lL]?",
            // octal
            "RegExp::0o[0-7]+[lL]?",
            // decimal
            "RegExp::[1-9]\\d*(e[\\+\\-]?\\d+)?[lL]?[jJ]?",
            // just zero
            "RegExp::0(?![\\dx])"
        ],

        // strings
        "string" : {
            "type" : "escaped-block",
            "escape" : "\\",
            "tokens" : [ 
                // start, end of string (can be the matched regex group ie. 1 )
                [ "RegExp::(['\"])", 1 ], 
                [ "RegExp::([rubRUB]|(ur)|(br)|(UR)|(BR))?(['\"])", 6 ] 
            ]
        },
        
        // operators
        "operator" : {
            "combine" : true,
            "tokens" : [
                "\\", "+", "-", "*", "/", "%", "&", "|", "^", "~", "<", ">" , "!",
                "==", "!=", "<=", ">=", "<>", "<<", ">>", "//", "**",
                "and", "or", "not", "is", "in"
            ]
        },
        
        // delimiters
        "delimiter" : {
            "combine" : true,
            "tokens" : [ 
                "(", ")", "[", "]", "{", "}", ",", ":", "`", "=", ";", ".",
                "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", 
                ">>=", "<<=", "//=", "**=", "@"
            ]
        },
        
        // decorators
        "decorator" : "RegExp::@[_A-Za-z][_A-Za-z0-9]*",

        // keywords
        "keyword" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [
                "assert", "break", "class", "continue",
                "def", "del", "elif", "else", "except", "finally",
                "for", "from", "global", "if", "import",
                "lambda", "pass", "raise", "return",
                "try", "while", "with", "yield", "as"
            ]
        },
                              
        // builtin functions, constructs, etc..
        "builtin" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [
                "abs", "all", "any", "bin", "bool", "bytearray", "callable", "chr",
                "classmethod", "compile", "complex", "delattr", "dict", "dir", "divmod",
                "enumerate", "eval", "filter", "float", "format", "frozenset",
                "getattr", "globals", "hasattr", "hash", "help", "hex", "id",
                "input", "int", "isinstance", "issubclass", "iter", "len",
                "list", "locals", "map", "max", "memoryview", "min", "next",
                "object", "oct", "open", "ord", "pow", "property", "range",
                "repr", "reversed", "round", "set", "setattr", "slice",
                "sorted", "staticmethod", "str", "sum", "super", "tuple",
                "type", "vars", "zip", "__import__", "NotImplemented",
                "Ellipsis", "__debug__"
            ]
        }
    },

    //
    // Syntax model (optional)
    //"Syntax" : null,
    
    // what to parse and in what order
    "Parser" : [
        "comment",
        "heredoc",
        "number",
        "string",
        "decorator",
        "operator",
        "delimiter",
        "keyword",
        "builtin",
        "identifier"
    ]
};
