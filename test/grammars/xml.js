// 1. a partial xml grammar in simple JSON format
var xml_grammar = {
        
        "type" : "markup-like",
        
        // prefix ID for regular expressions used in the grammar
        "RegExpID" : "RegExp::",
    
        // lists of (simple/string) tokens to be grouped into one regular expression,
        // else matched one by one, 
        // this is usefull for speed fine-tuning the parser
        "RegExpGroups" : {
        },
    
        // order of token parsing
        "TokenOrder" : [
            "comments",
            "blocks",
            "blocks2",
            "doctype",
            "atoms",
            "numbers",
            "numbers2",
            "strings",
            "attributes",
            "assignments",
            "tags"
        ],
            
        //
        // style model
    
        // lang token type  -> CodeMirror (style) tag
        // the mapping here is used to match the codemirror css demo color scheme
        "Style" : {
            "error":       "error",
            "comment":     "comment",
            "meta":        "meta",
            "defines":     "def",
            "atom":        "atom",
            "keyword":     "keyword",
            "builtin":     "builtin",
            "operator":    "operator",
            "tag":         "tag",
            "attribute":   "attribute",
            "number":      "number",
            "number2":     "number",
            "string":      "string",
            // cdata
            "block":       "atom",
            // meta
            "block2":      "meta"
        },

        
        //
        // lexical model
        
        // comments
        "comments" : {
            "line" : null,
            "block" : [ "<!--", "-->" ]
        },
        
        // blocks, 
        // cdata block
        "blocks" : [ "<![CDATA[", "]]>" ],
        // meta block
        "blocks2" : [ "RegExp::<\\?[_a-zA-Z][\\w\\._\\-]*", "?>" ],
        
        // tags
        "tags" : [
            //        starttag,                         tagname,    endtag
            [ "RegExp::</?([_a-zA-Z][_a-zA-Z0-9\\-]*)",    1,    "RegExp::/?>" ]
        ],
        
        // attributes
        "attributes" : "RegExp::[_a-zA-Z][_a-zA-Z0-9\\-]*",
        
        // numbers, in order of matching
        "numbers" : [
            // floats
            "RegExp::\\d+\\.\\d*",
            "RegExp::\\.\\d+",
            // integers
            // decimal
            "RegExp::[1-9]\\d*(e[\\+\\-]?\\d+)?",
            // just zero
            "RegExp::0(?![\\dx])"
        ],
        
        "numbers2" : [
            // hex colors
            "RegExp::#[0-9a-fA-F]+"
        ],

        // strings
        // start, end of string (can be the matched regex group ie. 1 )
        "strings" : [ [ "\"" ], [ "'" ] ],
        
        // atoms
        "atoms" : [
            "RegExp::&[a-zA-Z][a-zA-Z0-9]*;",
            "RegExp::&#[\\d]+;",
            "RegExp::&#x[a-fA-F\\d]+;"
        ]
};
