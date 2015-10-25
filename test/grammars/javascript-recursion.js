// 1. a partial javascript grammar in simple JSON format
var js_grammar = {
        
// prefix ID for regular expressions used in the grammar
"RegExpID"                          : "RE::",
    
"Extra"                             : {
    
    "fold"                          : "brace"
    
},
    
// Style model
"Style"                             : {
     
     "comment"                      : "comment"
    ,"atom"                         : "atom"
    ,"keyword"                      : "keyword"
    ,"builtin"                      : "keyword"
    ,"operator"                     : "operator"
    ,"identifier"                   : "variable"
    ,"property"                     : "attribute"
    ,"number"                       : "number"
    ,"string"                       : "string"
    ,"regex"                        : "string-2"
    ,"operator"                     : "variable-2"
    
},

// Lexical model
"Lex"                               : {
     
     "comment:comment"              : {"interleave":true,"tokens":[
                                    // line comment
                                    [  "//",  null ],
                                    // block comments
                                    [  "/*",   "*/" ]
                                    ]}
    ,"identifier"                   : "RE::/[_A-Za-z$][_A-Za-z0-9$]*/"
    ,"number"                       : [
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
                                    ]
    ,"string:escaped-block"         : ["RE::/(['\"])/",   1]
    ,"regex:escaped-line-block"     : ["/",    "RE::#/[gimy]{0,4}#"]
    ,"atom"                         : {"autocomplete":true,"meta":"JavaScript Atom","tokens":[
                                    "true", "false", 
                                    "null", "undefined", 
                                    "NaN", "Infinity"
                                    ]}
    ,"operator"                     : {"combine":false,"tokens":[
                                    "+", "-", "++", "--", "%", ">>", "<<", ">>>",
                                    "*", "/", "^", "|", "&", "!", "~",
                                    ">", "<", "<=", ">=", "!=", "!==",
                                    "=", "==", "===", "+=", "-=", "%=",
                                    ">>=", ">>>=", "<<=", "*=", "/=", "|=", "&="
                                    ]}
    ,"keyword"                      : {"autocomplete":true,"meta":"JavaScript Keyword","tokens":[ 
                                    "if", "while", "with", "else", "do", "try", "finally",
                                    "return", "break", "continue", "new", "delete", "throw",
                                    "var", "const", "let", "function", "catch", "void",
                                    "for", "switch", "case", "default", "class", "import", "yield",
                                    "in", "typeof", "instanceof", "?", ":"
                                    ]}
    ,"builtin"                      : {"autocomplete":true,"meta":"JavaScript Builtin","tokens":[ 
                                    "Object", "Function", "Array", "String", 
                                    "Date", "Number", "RegExp", "Math", "Exception",
                                    "setTimeout", "setInterval", "parseInt", "parseFloat", 
                                    "isFinite", "isNan", "alert", "prompt", "console", 
                                    "window", "global", "this"
                                    ]}
    ,"builtin_property"             : {"autocomplete":true,"meta":"JavaScript Builtin Property","tokens":[ 
                                    "prototype","constructor","toString"
                                    ]}
    ,"ctx:action"                   : {"context":true}
    ,"\\ctx:action"                 : {"context":false}
    ,"_match:action"                : {"push":"$0"}
    ,"match_bra:action"               : {"pop":"{","msg":"Bracket \"$0\" does not match"}
    ,"match_paren:action"               : {"pop":"(","msg":"Bracket \"$0\" does not match"}
    ,"match_bpa:action"               : {"pop":"[","msg":"Bracket \"$0\" does not match"}
    ,"unique_in_scope:action"       : {"unique":["prop","$1"],"in-context":true,"msg":"Duplicate object property \"$0\""}
    
},
    
// Syntax model (optional)
"Syntax"                            : {
     
     "obj_property"                 : "string | /0|[1-9][0-9]*/.number | identifier"
    ,"dot_property"                 : "'.' (builtin_property.builtin | identifier.property)"
    ,"bra_property"                 : "'[' _match expression ']' match_bpa"
    ,"with_property"                : "dot_property |  bra_property"
    ,"value"                        : "builtin | string | regex | identifier | array | object"
    ,"property_value"               : "(builtin_property.builtin | obj_property.property) unique_in_scope ':' expression"
    ,"object"                       : "'{' ctx _match (property_value (',' property_value)*)? '}' match_bra \\ctx"
    ,"array"                        : "'[' _match (expression (',' expression)*)? ']' match_bpa"
    ,"brackets_matched"             : "'{' _match | '}' match_bra | '(' _match | ')' match_paren | '[' _match | ']' match_bpa"
    ,"expression"                   : "('(' _match)? ((atom | number | value with_property*) (operator expression)?)? (')' match_paren)?"
    ,"js"                           : "comment | keyword | expression | brackets_matched"
    
},

// what to parse and in what order
"Parser"                            : [ ["js"] ]

};
