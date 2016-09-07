// 1. a partial html grammar with mixed javascript/css sub-grammars in simple JSON format
var htmlmixed_grammar = {
    
// prefix ID for regular expressions, represented as strings, used in the grammar
"RegExpID"                          : "RE::",

"Extra"                             : {
    
    "fold"                          : "xml"
    //"electricChars"               : "<"
    
},
    
// Style model
"Style"                             : {

     "comment"                      : "comment"
    ,"declaration"                  : "tag"
    ,"doctype"                      : "meta"
    ,"meta"                         : "meta"
    ,"cdata"                        : "atom"
    ,"tag"                          : "tag"
    ,"attribute"                    : "attribute"
    ,"string"                       : "string"
    ,"atom"                         : "atom"
    ,"number"                       : "number"
    ,"error"                        : "error"
    
},

// Lexical model
"Lex"                               : {
     
     "comment:comment"              : ["<!--", "-->"]
    ,"declaration:block"            : ["<?xml", "?>"]
    ,"doctype:block"                : ["RE::/<!doctype\\b/i", ">"]
    ,"meta:block"                   : ["RE::/<\\?[_a-zA-Z][\\w\\._\\-]*/", "?>"]
    ,"cdata:block"                  : ["<![CDATA[", "]]>"]
    ,"open_tag"                     : "RE::/<([_a-zA-Z][_a-zA-Z0-9\\-]*)/"
    ,"close_tag"                    : "RE::/<\\/([_a-zA-Z][_a-zA-Z0-9\\-]*)>/"
    ,"open_script_tag"              : "RE::/<(script)/"
    ,"open_style_tag"               : "RE::/<(style)/"
    ,"close_script_tag"             : "RE::/<\\/(script)>/"
    ,"close_style_tag"              : "RE::/<\\/(style)>/"
    ,"attribute"                    : "RE::/[_a-zA-Z][_a-zA-Z0-9\\-]*/"
    ,"string:line-block"            : [["\""], ["'"]]
    ,"number"                       : ["RE::/[0-9]\\d*/", "RE::/#[0-9a-fA-F]+/"]
    ,"atom"                         : ["RE::/&#x[a-fA-F\\d]+;/", "RE::/&#[\\d]+;/", "RE::/&[a-zA-Z][a-zA-Z0-9]*;/"]
    ,"text"                         : "RE::/[^<&]+/"
    
    // actions
    ,"tag_ctx:action"               : {"context":true}
    ,"\\tag_ctx:action"             : {"context":false}
    ,"unique_id:action"             : {"unique":["xml", "$1"],"msg":"Duplicate id value \"$0\""}
    ,"unique_att:action"            : {"unique":["tag", "$0"],"msg":"Duplicate attribute \"$0\"","in-context":true}
    ,"tag_opened:action"            : {"push":"<$1>","ci":true}
    ,"tag_closed:action"            : {"pop":"<$1>","ci":true,"msg":"Tags \"$0\" and \"$1\" do not match"}
    ,"tag_autoclosed:action"        : {"pop":null}
    ,"out_of_place:error"           : "\"$2$3\" can only be at the beginning of XML document"
    
},
    
// Syntax model (optional)
"Syntax"                            : {
     
     "javascript"                   : {"subgrammar":"javascript"}
    ,"css"                          : {"subgrammar":"css"}
    ,"tag_att"                      : "'id'.attribute unique_att '=' string unique_id | attribute unique_att '=' (string | number)"
    ,"style_tag"                    : "(open_style_tag.tag tag_ctx tag_opened tag_att* '>'.tag \\tag_ctx) css close_style_tag.tag tag_closed"
    ,"script_tag"                   : "(open_script_tag.tag tag_ctx tag_opened tag_att* '>'.tag \\tag_ctx) javascript close_script_tag.tag tag_closed"
    ,"start_tag"                    : "open_tag.tag tag_ctx tag_opened tag_att* ('>'.tag | '/>'.tag tag_autoclosed) \\tag_ctx"
    ,"end_tag"                      : "close_tag.tag tag_closed"
    ,"htmlmixed"                    : "(^^1 declaration? doctype?) (declaration.error out_of_place | doctype.error out_of_place | comment | meta | cdata | style_tag | script_tag | start_tag | end_tag | atom | text)*"
    
},
    
// what to parse and in what order
"Parser"                            : [ ["htmlmixed"] ]

};
