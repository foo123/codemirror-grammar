// 1. a complete json grammar in simple JSON format
var json_grammar = {
        
// prefix ID for regular expressions used in the grammar
"RegExpID"                      : "RE::",
    
"Extra"                         : {
    
    "fold"                      : "brace"

},
    
// Style model
"Style"                         : {

     "comment"                  : "comment"
    ,"atom"                     : "atom"
    ,"number"                   : "number"
    ,"string"                   : "string"
    ,"error"                    : "error"

},

// Lexical model
"Lex"                           : {
    
     "comment:comment"          : {"interleave":true,"tokens":[["//", null],["/*", "*/"]]}
    ,"string:escaped-block"     : ["\"", "\""]
    ,"atom"                     : {"autocomplete":true,"tokens":["true","false","null"]}
    ,"number"                   : [
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
    ,"other"                    : "RE::/\\S+/"
    
    ,"ctx:action"               : {"context":true}
    ,"\\ctx:action"             : {"context":false}
    ,"unique:action"            : {"unique":["prop","$1"],"msg":"Duplicate object property \"$0\"","in-context":true}
    ,"invalid_json:error"       : "Invalid JSON"
    
},
    
// Syntax model (optional)
"Syntax"                        : {
    
     "literal_object"           : "'{' ctx (literal_property_value (',' literal_property_value)*)? '}' \\ctx"
    ,"literal_array"            : "'[' (literal_value (',' literal_value)*)? ']'"
    // grammar recursion here
    ,"literal_value"            : "atom | string | number | literal_array | literal_object"
    ,"literal_property_value"   : "string unique ':' literal_value"
    ,"json"                     : "literal_value | other.error invalid_json"
    
},

// what to parse and in what order
// allow comments in json ;)
"Parser"                        : [ "comment", [ "json" ] ]

};
