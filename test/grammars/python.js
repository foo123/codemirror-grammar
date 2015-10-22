// 1. an almost complete python grammar in simple JSON format
var python_grammar = {
    
// prefix ID for regular expressions, represented as strings, used in the grammar
"RegExpID"                  : "RE::",

"Extra"                     : {
    
    "fold"                  : "indent"
},
    
// Style model
"Style"                     : {

     "comment"              : "comment"
    ,"decorator"            : "meta"
    ,"keyword"              : "keyword"
    ,"builtin"              : "builtin"
    ,"operator"             : "operator"
    ,"identifier"           : "variable"
    ,"number"               : "number"
    ,"string"               : "string"
    ,"heredoc"              : "string"

},

// Lexical model
"Lex"                       : {
    
     "comment:comment"      : ["#", null]
    ,"heredoc:block"        : [["'''"], ["\"\"\""], ["RE::/([rubRUB]|(ur)|(br)|(UR)|(BR))?('{3}|\"{3})/", 6]]
    ,"string:escaped-block" : [["RE::/(['\"])/", 1], ["RE::/([rubRUB]|(ur)|(br)|(UR)|(BR))?(['\"])/", 6]]
    ,"identifier"           : "RE::/[_A-Za-z][_A-Za-z0-9]*/"
    ,"decorator"            : "RE::/@[_A-Za-z][_A-Za-z0-9]*/"
    ,"number"               : [
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
                            ]
    ,"operator"             : {"combine":false,"tokens":[
                            "\\", "+", "-", "*", "/", "%", "&", "|", "^", "~", "<", ">" , "!",
                            "==", "!=", "<=", ">=", "<>", "<<", ">>", "//", "**",
                            "and", "or", "not", "is", "in"]}
    ,"delimiter"            : {"combine":false,"tokens":[ 
                            "(", ")", "[", "]", "{", "}", ",", ":", "`", "=", ";", ".",
                            "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", 
                            ">>=", "<<=", "//=", "**=", "@"]}
    ,"keyword"              : {"autocomplete":true,"tokens":[
                            "assert", "break", "class", "continue",
                            "def", "del", "elif", "else", "except", "finally",
                            "for", "from", "global", "if", "import",
                            "lambda", "pass", "raise", "return",
                            "try", "while", "with", "yield", "as"
                            ]}
    ,"builtin"              : {"autocomplete":true,"tokens":[
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
                            ]}
    
},

// Syntax model (optional)
"Syntax"                    : {
    
    "py"                    : "comment | heredoc | number | string | decorator | operator | delimiter | keyword | builtin | identifier"
    
},
    
// what to parse and in what order
// an array i.e ["py"], instead of single token i.e "py", is a shorthand for an "ngram"-type syntax token (for parser use)
"Parser"                    : [ ["py"] ]

};
