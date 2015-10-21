// 1. a partial xml grammar in simple JSON format
var xml_grammar = {
    
    // prefix ID for regular expressions, represented as strings, used in the grammar
    "RegExpID": "RE::",

    "Extra": {
        "fold" : "xml"
        //"electricChars" : "<"
    },
    
    // Style model
    "Style": {
        // lang token type  -> Editor (style) tag
        "declaration"          : "tag",
        "doctype"              : "meta",
        "meta"                 : "meta",
        "comment"              : "comment",
        "cdata"                : "atom",
        "atom"                 : "atom",
        "open_tag"             : "tag",
        "close_open_tag"       : "tag",
        "auto_close_open_tag"  : "tag",
        "close_tag"            : "tag",
        "att"                  : "attribute",
        "number"               : "number",
        "string"               : "string",
        "error"                : "error"
    },

    // Lexical model
    "Lex": {
        "declaration:block": ["<?xml","?>"],
        "doctype:block": ["RE::/<!doctype\\b/i",">"],
        "meta:block": ["RE::/<\\?[_a-zA-Z][\\w\\._\\-]*/","?>"],
        "comment:comment": ["<!--","-->"],
        "cdata:block": ["<![CDATA[","]]>"],
        "string:line-block": [[ "\"" ],[ "'" ]],
        "number": ["RE::/[0-9]\\d*/", "RE::/#[0-9a-fA-F]+/"],
        "atom": ["RE::/&#x[a-fA-F\\d]+;/", "RE::/&#[\\d]+;/", "RE::/&[a-zA-Z][a-zA-Z0-9]*;/"],
        "att": "RE::/[_a-zA-Z][_a-zA-Z0-9\\-]*/",
        "open_tag": "RE::/<([_a-zA-Z][_a-zA-Z0-9\\-]*)/",
        "close_open_tag": ">",
        "auto_close_open_tag": "/>",
        "close_tag": "RE::/<\\/([_a-zA-Z][_a-zA-Z0-9\\-]*)>/",
        "text": "RE::/[^<&]+/",
        
        // actions
        "ctx:action": {"context":true},
        "\\ctx:action": {"context":false},
        "unique:action": {
            "unique": ["id", "$1"],
            "msg": "Duplicate id value \"$0\""
        },
        "unique_att:action": {
            "unique": ["att", "$0"],
            "in-context":true,
            "msg": "Duplicate attribute \"$0\""
        },
        "match:action": {"push":"<$1>","ci": true},
        "\\match:action": {
            "pop": "<$1>",
            "ci": true,
            "msg": "Tags \"$0\" and \"$1\" do not match"
        },
        "nomatch:action": {"pop":null},
        "out_of_place:error": "\"$2$3\" can only be at the beginning of XML document"
    },
    
    // Syntax model (optional)
    "Syntax": {
        "tag_att": "'id'.att unique_att '=' string unique | att unique_att '=' (string | number)",
        "start_tag": "open_tag match ctx tag_att* (close_open_tag | auto_close_open_tag nomatch) \\ctx",
        "end_tag": "close_tag \\match",
        "xml": "(^^1 declaration? doctype?) (declaration.error out_of_place | doctype.error out_of_place | comment | meta | cdata | start_tag | end_tag | atom | text)*"
    },
    
    // what to parse and in what order
    "Parser": [ ["xml"] ]
};
