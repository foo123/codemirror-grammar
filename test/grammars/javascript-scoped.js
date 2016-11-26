// 1. a partial javascript grammar in simple JSON format
var js_grammar = {
        
"RegExpID"                      : "RE::",

"Extra"                         : {
    
    "fold"                      : "brace"
    
},

// Style model
"Style"                         : {

     "comment"                  : "comment"
    ,"atom"                     : "atom"
    ,"keyword"                  : "keyword"
    ,"builtin"                  : "builtin"
    ,"identifier"               : "variable"
    ,"property"                 : "meta"
    ,"number"                   : "number"
    ,"string"                   : "string"
    ,"regex"                    : "string-2"
    ,"local"                    : "variable-2"
    ,"arg"                      : "variable"

},

// Lexical model
"Lex"                           : {
    
     "comment:comment"          : {"interleave":true,"tokens":[
                                // line comment
                                [  "//",  null ],
                                // block comments
                                [  "/*",   "*/" ]
                                ]}
    ,"string:escaped-block"     : [ "RE::/(['\"])/",   1 ]
    ,"regex:escaped-line-block" : [ "/",    "RE::#/[gimy]{0,4}#" ]
    ,"identifier"               : "RE::/[_A-Za-z$][_A-Za-z0-9$]*/"
    ,"index"                    : "RE::/0|[1-9][0-9]*/"
    ,"number"                   : [
                                // floats
                                "RE::/\\d*\\.\\d+(e[\\+\\-]?\\d+)?/",
                                "RE::/\\d+\\.\\d*/",
                                "RE::/\\.\\d+/",
                                // integers
                                // hex
                                "RE::/0x[0-9a-fA-F]+L?/",
                                // decimal
                                "RE::/[1-9]\\d*(e[\\+\\-]?\\d+)?L?/",
                                // just zero
                                "RE::/0(?![\\dx])/"
                                ]
    ,"atom"                     : {"autocomplete":true,"meta":"JavaScript Atom","tokens":[
                                "true", "false", 
                                "null", "undefined", "NaN", "Infinity"
                                ]}
    ,"keyword"                  : {"autocomplete":true,"meta":"JavaScript Keyword","tokens":[ 
                                "if", "while", "with", "else", "do", "try", "finally",
                                "return", "break", "continue", "new", "delete", "throw",
                                "var", "const", "let", "function", "catch",
                                "for", "of", "class", "yield", "switch", "case", "default",
                                "in", "typeof", "instanceof"
                                ]}
    ,"builtin"                  : {"autocomplete":true,"meta":"JavaScript Builtin","tokens":[ 
                                "Object", "Function", "Array", "String", "Date", "Number", "RegExp", "Exception",
                                "setTimeout", "setInterval", "alert", "prompt", "console", "window", "prototype", "constructor", "self", "global", "require"
                                ]}
    ,"operator"                 : {"combine":false,"tokens":[ 
                                "++", "+", "--", "-", "===", "!==", "==", "!=", "+=", "-=", ">>>=", ">>=", "<<=",
                                ">>>", ">>", "<<", ">=", "<=", ">", "<", "=", "~", "!", "*", "/", "&&", "||", "|=", "&=", "&", "|"/*, ",", ".", "(", ")"*/
                                ]}
    ,"this"                     : "RE::/this\\b/"
    ,"function"                 : "RE::/function\\b/"
    ,"var"                      : "RE::/(var|let)\\b/"
    ,"@func:action"             : {"hypercontext":true}
    ,"\\@func:action"           : {"hypercontext":false}
    ,"@obj:action"              : {"context":true}
    ,"\\@obj:action"            : {"context":false}
    ,"@brace:action"            : {"push":"}"}
    ,"@paren:action"            : {"push":")"}
    ,"@bracket:action"          : {"push":"]"}
    ,"@close:action"            : {"pop":"$0","msg":"Brackets do not match"}
    ,"@define:action"           : {"define":["local","$0"],"msg":false,"in-hypercontext":true}
    ,"@ifscoped:action"         : {"defined":["local","$0"],"msg":false,"in-hypercontext":true}
    ,"@unique:action"           : {"unique":["prop","$1"],"msg":"Duplicate object property \"$0\"","in-context":true}
    
},

// Syntax model (optional)
"Syntax"                        : {
    
     "func_def"                 : "function.keyword identifier.arg? '(' (identifier.arg (',' identifier.arg)*)? ')' '{' @brace @func (statement ';'?)* '}' \\@func @close"
    ,"var_def"                  : "var.keyword identifier @define ('=' declaration)? (, identifier @define ('=' declaration)?)*"
    ,"propertyValue"            : "(index | string | identifier).property @unique ':' declaration"
    ,"object"                   : "'{' @brace @obj (propertyValue (',' propertyValue)*)? '}' \\@obj @close"
    ,"array"                    : "'[' @bracket (declaration (',' declaration)*)? ']' @close"
    ,"declaration"              : "(func_def | atom | number | string | regex | object | array | this.builtin | builtin @ifscoped.local | identifier @ifscoped.local | '.' identifier.property | '(' @paren | ')' @close | operator)*"
    ,"statement"                : "var_def | func_def | keyword | atom | number | string | regex | object | array |  this.builtin | builtin @ifscoped.local | identifier @ifscoped.local | '.' identifier.property | '(' @paren | ')' @close | operator"
    ,"js"                       : "(statement ';'?)*"

},

// what to parse and in what order
"Parser"                        : [ "comment", ["js"] ]

};
