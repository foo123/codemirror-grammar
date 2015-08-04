// 1. a partial xml grammar in simple JSON format
var xml_grammar = {
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RegExp::",

    //
    // Fold model
    "Fold" : {
        "xml" : ["RegExp::/<([_a-zA-Z][_a-zA-Z0-9\\-]*)[^>]*?[^/]>/", "</$1>"]
    },
    
    //
    // Style model
    "Style" : {
        // lang token type  -> Editor (style) tag
        "commentBlock":         "comment",
        "metaBlock":            "meta",
        "cdataBlock":           "atom",
        "atom":                 "atom",
        "openTag":              "tag",
        "closeTag":             "tag",
        "autoCloseTag":         "tag",
        "endTag":               "tag",
        "attribute":            "attribute",
        "number":               "number",
        "hexnumber":            "number",
        "string":               "string"
    },

    //
    // Lexical model
    "Lex" : {
        
        "commentBlock" : {
            "type" : "comment",
            "tokens" : [
                // block comments
                // start,    end  delims
                [ "<!--",    "-->" ]
            ]
        },
        
        "cdataBlock" : {
            "type" : "block",
            "tokens" : [
                // cdata block
                //   start,        end  delims
                [ "<![CDATA[",    "]]>" ]
            ]
        },
        
        "metaBlock" : {
            "type" : "block",
            "tokens" : [
                // meta block
                //        start,                          end  delims
                [ "RegExp::/<\\?[_a-zA-Z][\\w\\._\\-]*/",   "?>" ]
            ]
        },
        
        // numbers, in order of matching
        "number" : [
            // floats
            "RegExp::/\\d+\\.\\d*/",
            "RegExp::/\\.\\d+/",
            // integers
            // decimal
            "RegExp::/[1-9]\\d*(e[\\+\\-]?\\d+)?/",
            // just zero
            "RegExp::/0(?![\\dx])/"
        ],
        
        // hex colors
        "hexnumber" : "RegExp::/#[0-9a-fA-F]+/",

        // strings
        "string" : {
            "type" : "block",
            "multiline" : false,
            "tokens" : [ 
                // if no end given, end is same as start
                [ "\"" ], [ "'" ] 
            ]
        },
        
        // atoms
        "atom" : [
            "RegExp::/&[a-zA-Z][a-zA-Z0-9]*;/",
            "RegExp::/&#[\\d]+;/",
            "RegExp::/&#x[a-fA-F\\d]+;/"
        ],
        
        // tag attributes
        "attribute" : "RegExp::/[_a-zA-Z][_a-zA-Z0-9\\-]*/",
        
        // tags
        "closeTag" : ">",
        "openTag" : {
            // allow to match start/end tags
            "push" : "TAG<$1>",
            "tokens" : "RegExp::/<([_a-zA-Z][_a-zA-Z0-9\\-]*)/"
        },
        "autoCloseTag" : {
            // allow to match start/end tags
            "pop" : null,
            "tokens" : "/>"
        },
        "endTag" : {
            // allow to match start/end tags
            "pop" : "TAG<$1>",
            "tokens" : "RegExp::#</([_a-zA-Z][_a-zA-Z0-9\\-]*)>#"
        }
    },
    
    //
    // Syntax model (optional)
    "Syntax" : {
        
        "tagAttribute" : { 
            "type" : "group",
            "match" : "all",
            "tokens" : [ "attribute", "=", "string | number | hexnumber" ]
        },
        
        "closeOpenTag" : { 
            "type" : "group",
            "match" : "either",
            "tokens" : [ "closeTag",  "autoCloseTag"]
        }
    },
    
    // what to parse and in what order
    "Parser" : [
        "commentBlock",
        "cdataBlock",
        "metaBlock",
        [ "openTag", "tagAttribute*", "closeOpenTag" ],
        [ "endTag" ],
        "atom"
    ]
};
