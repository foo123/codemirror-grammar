// 1. a partial xml grammar in simple JSON format
var xml_grammar = {
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RegExp::",

    //
    // Style model
    "Style" : {
        // lang token type  -> Editor (style) tag
        "commentBlock":         "comment",
        "metaBlock":            "meta",
        "atom":                 "atom",
        "cdataBlock":           "atom",
        "startTag":             "tag",
        "endTag":               "tag",
        "autocloseTag":         "tag",
        "closeTag":             "tag",
        "attribute":            "attribute",
        "number":               "number",
        "hexnumber":            "number",
        "string":               "string"
    },

    "electricChars" : null,
    
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
                [ "RegExp::<\\?[_a-zA-Z][\\w\\._\\-]*",   "?>" ]
            ]
        },
        
        // tag attributes
        "attribute" : "RegExp::[_a-zA-Z][_a-zA-Z0-9\\-]*",
        
        // numbers, in order of matching
        "number" : [
            // floats
            "RegExp::\\d+\\.\\d*",
            "RegExp::\\.\\d+",
            // integers
            // decimal
            "RegExp::[1-9]\\d*(e[\\+\\-]?\\d+)?",
            // just zero
            "RegExp::0(?![\\dx])"
        ],
        
        // hex colors
        "hexnumber" : "RegExp::#[0-9a-fA-F]+",

        // strings
        "string" : {
            "type" : "escaped-block",
            "escape" : "\\",
            "multiline" : false,
            "tokens" : [ 
                // start, end of string (can be the matched regex group ie. 1 )
                // if no end given, end is same as start
                [ "\"" ], 
                [ "'" ] 
            ]
        },
        
        // atoms
        // "simple" token type is default, if no token type
        //"type" : "simple",
        "atom" : [
            "RegExp::&[a-zA-Z][a-zA-Z0-9]*;",
            "RegExp::&#[\\d]+;",
            "RegExp::&#x[a-fA-F\\d]+;"
        ],
        
        // tags
        "startTag" : "RegExp::<[_a-zA-Z][_a-zA-Z0-9\\-]*",
        
        "endTag" : ">",
        
        "autocloseTag" : "/>",
        
        // close tag, outdent action
        "closeTag" : "RegExp::</[_a-zA-Z][_a-zA-Z0-9\\-]*>"
    },
    
    //
    // Syntax model (optional)
    "Syntax" : {
        
        "stringOrNumber" : {
            "type" : "group",
            "match" : "either",
            "tokens" : [ "string", "number", "hexnumber" ] 
        },
        
        "tagAttribute" : { 
            "type" : "group",
            "match" : "all",
            "tokens" : [ "attribute", "=", "stringOrNumber" ]
        },
        
        "tagAttributes" : { 
            "type" : "group",
            "match" : "zeroOrMore",
            "tokens" : [ "tagAttribute" ]
        },
        
        "startCloseTag" : { 
            "type" : "group",
            "match" : "either",
            "tokens" : [ "endTag", "autocloseTag" ]
        },
        
        // n-grams define syntax sequences
        "openTag" : { 
            "type" : "n-gram",
            "tokens" :[
                [ "startTag", "tagAttributes", "startCloseTag" ]
            ]
        }
    },
    
    // what to parse and in what order
    "Parser" : [
        "commentBlock",
        "cdataBlock",
        "metaBlock",
        "openTag",
        "closeTag",
        "atom"
    ]
};
