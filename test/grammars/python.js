// 1. an almost complete python grammar in simple JSON format
var python_grammar = {
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RE::",

    "Extra" : {
        "fold" : "indent"
    },
    
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
                [ "RE::/([rubRUB]|(ur)|(br)|(UR)|(BR))?('{3}|\"{3})/", 6 ] 
            ]
        },
        
        // general identifiers
        "identifier" : "RE::/[_A-Za-z][_A-Za-z0-9]*/",

        // numbers, in order of matching
        "number" : [
            // floats
            "RE::/\\d*\\.\\d+(e[\\+\\-]?\\d+)?[jJ]?/",
            "RE::/\\d+\\.\\d*[jJ]?/",
            "RE::/\\.\\d+[jJ]?/",
            // integers
            // hex
            "RE::/0x[0-9a-fA-F]+[lL]?/",
            // binary
            "RE::/0b[01]+[lL]?/",
            // octal
            "RE::/0o[0-7]+[lL]?/",
            // decimal
            "RE::/[1-9]\\d*(e[\\+\\-]?\\d+)?[lL]?[jJ]?/",
            // just zero
            "RE::/0(?![\\dx])/"
        ],

        // strings
        "string" : {
            "type" : "escaped-block",
            "escape" : "\\",
            "tokens" : [ 
                // start, end of string (can be the matched regex group ie. 1 )
                [ "RE::/(['\"])/", 1 ], 
                [ "RE::/([rubRUB]|(ur)|(br)|(UR)|(BR))?(['\"])/", 6 ] 
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
        "decorator" : "RE::/@[_A-Za-z][_A-Za-z0-9]*/",

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
