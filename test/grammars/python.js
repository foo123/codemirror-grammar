// 1. an almost complete python grammar in simple JSON format
var python_grammar = {
        
        // prefix ID for regular expressions used in the grammar
        "RegExpID" : "RegExp::",
    
        // lists of (simple/string) tokens to be grouped into one regular expression,
        // else matched one by one, 
        // this is usefull for speed fine-tuning the parser
        "RegExpGroups" : {
            "keywords" : true,
            "builtins" : true,
            "operators" : true,
            "delimiters" : true
        },
    
        // order of tokens parsing
        "TokenOrder" : [
            "comments",
            "blocks",
            "blocks2",
            "blocks3",
            "blocks4",
            "blocks5",
            "numbers",
            "numbers2",
            "numbers3",
            "strings",
            "strings2",
            "strings3",
            "keywords",
            "builtins",
            "operators",
            "delimiters",
            "atoms",
            "meta",
            "defines",
            "identifiers",
            "identifiers2",
            "identifiers3",
            "identifiers4",
            "identifiers5"
        ],
            
        //
        // style model
    
        // lang token type  -> CodeMirror (style) tag
        "Style" : {
            "error":       "error",
            "meta":        "meta",
            "comment":     "comment",
            "keyword":     "keyword",
            "builtin":     "builtin",
            "operator":    "operator",
            "identifier":  "variable",
            "number":      "number",
            "string":      "string",
            // heredocs
            "block":       "string"
        },

        
        //
        // lexical model
        
        // comments
        "comments" : {
            "line" : "#",
            "block" : null
        },
        
        // blocks, in this case heredocs
        // begin and end of heredocs
        "blocks" : [ 
            // if no end given, end is same as start of block
            [ "'''" ], 
            [ "\"\"\"" ], 
            [ "RegExp::([rubRUB]|(ur)|(br)|(UR)|(BR))?('{3}|\"{3})", 6 ] 
        ],
        
        // general identifiers
        "identifiers" : "RegExp::[_A-Za-z][_A-Za-z0-9]*",

        // numbers, in order of matching
        "numbers" : [
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
        // start, end of string (can be the matched regex group ie. 1 )
        "strings" : [ 
            [ "RegExp::(['\"])", 1 ], 
            [ "RegExp::([rubRUB]|(ur)|(br)|(UR)|(BR))?(['\"])", 6 ] 
        ],
        
        // operators
        "operators" : [
            [ "\\", "+", "-", "*", "/", "%", "&", "|", "^", "~", "<", ">" , "!" ],
            [ "==", "!=", "<=", ">=", "<>", "<<", ">>", "//", "**" ],
            [ "and", "or", "not", "is", "in" ]
        ],
        
        // delimiters
        "delimiters" : [ 
            [ "(", ")", "[", "]", "{", "}", ",", ":", "`", "=", ";", "." ],
            [ "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=" ], 
            [ ">>=", "<<=", "//=", "**=" ] 
        ],
        
        // meta, decorators
        "meta" : "RegExp::@[_A-Za-z][_A-Za-z0-9]*",

        // keywords
        "keywords" : [
            "as", "assert", "break", "class", "continue",
            "def", "del", "elif", "else", "except", "finally",
            "for", "from", "global", "if", "import",
            "lambda", "pass", "raise", "return",
            "try", "while", "with", "yield"
        ],
                              
        // builtin functions, constructs, etc..
        "builtins" : [
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
};
