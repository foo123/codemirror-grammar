// 1. a partial xml grammar in simple JSON format
var xml_grammar = {
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RE::",

    "Extra" : {
        "fold" : "xml"
        //"electricChars" : "<"
    },
    
    //
    // Style model
    "Style" : {
        // lang token type  -> Editor (style) tag
        "comment"              : "comment",
        "meta"                 : "meta",
        "cdata"                : "atom",
        "atom"                 : "atom",
        "open_tag"             : "tag",
        "close_open_tag"       : "tag",
        "auto_close_open_tag"  : "tag",
        "close_tag"            : "tag",
        "att"                  : "attribute",
        "id"                   : "attribute",
        "number"               : "number",
        "string"               : "string"
    },

    //
    // Lexical model
    "Lex": {
        "comment:comment": ["<!--","-->"],
        
        "cdata:block": ["<![CDATA[","]]>"],
        
        "meta:block": ["RE::/<\\?[_a-zA-Z][\\w\\._\\-]*/","?>"],
        
        "string:block": {"tokens":[[ "\"" ],[ "'" ]], "multiline":false},
        
        "number": [
            // dec
            "RE::/[0-9]\\d*/",
            // hex
            "RE::/#[0-9a-fA-F]+/"
        ],
        
        // atoms
        "atom": [
            "RE::/&#x[a-fA-F\\d]+;/",
            "RE::/&#[\\d]+;/",
            "RE::/&[a-zA-Z][a-zA-Z0-9]*;/"
        ],
        
        // tag attribute
        "att": "RE::/[_a-zA-Z][_a-zA-Z0-9\\-]*/",
        
        // tags
        "open_tag": "RE::/<([_a-zA-Z][_a-zA-Z0-9\\-]*)/",
        "close_open_tag": ">",
        "auto_close_open_tag": "/>",
        "close_tag": "RE::/<\\/([_a-zA-Z][_a-zA-Z0-9\\-]*)>/",
        
        "text": "RE::/[^<&]+/",
        
        // actions
        "ctx_start:action": {"context-start":true},
        "ctx_end:action": {"context-end":true},
        // allow to find duplicate xml identifiers, with action tokens
        "unique:action": {
            "unique": ["id", "$1"],
            "msg": "Duplicate id attribute \"$0\""
        },
        // allow to find duplicate xml tag attributes, with action tokens
        "unique_att:action": {
            "unique": ["att", "$0"],
            "in-context":true,
            "msg": "Duplicate attribute \"$0\""
        },
        // allow to match start/end tags, with action tokens
        "match:action": {"push":"<$1>"},
        "matched:action": {
            "pop": "<$1>",
            "msg": "Tags \"$0\" and \"$1\" do not match!"
        },
        "nomatch:action": {"pop":null}
    },
    
    //
    // Syntax model (optional)
    "Syntax": {
        "id_att": "'id' unique_att '=' string unique",
        
        "tag_att": "att unique_att '=' (string | number)",
        
        "start_tag": "open_tag match ctx_start (id_att | tag_att)* (close_open_tag | auto_close_open_tag nomatch) ctx_end",
        
        "end_tag": "close_tag matched",
        
        "xml": "comment | cdata | meta | start_tag | end_tag | atom | text"
    },
    
    // what to parse and in what order
    "Parser": [ ["xml"] ]
};
