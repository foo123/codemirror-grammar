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
        "comment_block":        "comment",
        "meta_block":           "meta",
        "cdata_block":          "atom",
        "atom":                 "atom",
        "open_tag":             "tag",
        "close_open_tag":       "tag",
        "auto_close_open_tag":  "tag",
        "close_tag":            "tag",
        "attribute":            "attribute",
        "id":                   "attribute",
        "number":               "number",
        "string":               "string"
    },

    //
    // Lexical model
    "Lex": {
        
        "comment_block": {
            "type": "comment",
            "tokens": [
                // block comments
                // start,    end  delims
                [ "<!--",    "-->" ]
            ]
        },
        
        "cdata_block": {
            "type": "block",
            "tokens": [
                // cdata block
                //   start,        end  delims
                [ "<![CDATA[",    "]]>" ]
            ]
        },
        
        "meta_block": {
            "type": "block",
            "tokens": [
                // meta block
                //        start,                          end  delims
                [ "RE::/<\\?[_a-zA-Z][\\w\\._\\-]*/",   "?>" ]
            ]
        },
        
        // strings
        "string": {
            "type": "block",
            "multiline": false,
            "tokens": [ 
                // if no end given, end is same as start
                [ "\"" ], [ "'" ] 
            ]
        },
        
        // numbers, in order of matching
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
        
        // tag attributes
        "attribute": "RE::/[_a-zA-Z][_a-zA-Z0-9\\-]*/",
        
        // tags
        "open_tag": "RE::/<([_a-zA-Z][_a-zA-Z0-9\\-]*)/",
        "close_open_tag": ">",
        "auto_close_open_tag": "/>",
        "close_tag": "RE::/<\\/([_a-zA-Z][_a-zA-Z0-9\\-]*)>/",
        
        // NEW feature
        // action tokens to perform complex grammar functionality 
        // like associated tag matching and unique identifiers
        
        // allow to find duplicate xml identifiers, with action tokens
        "unique": {
            "unique": ["xml", "$1"],
            "msg": "Duplicate ID \"$0\""
        },
        
        // allow to match start/end tags, with action tokens
        "match": {
            "push": "<$1>"
        },
        
        "matched": {
            "pop": "<$1>",
            "msg": "Tags \"$0\" and \"$1\" do not match!"
        },
        
        "nomatch": {
            "pop": null
        }
    },
    
    //
    // Syntax model (optional)
    "Syntax": {
        // NEW feature
        // using PEG/BNF-like shorthands, instead of multiple grammar configuration objects
        
        "id_attribute": "'id' '=' string unique",
        
        "tag_attribute": "attribute '=' (string | number)",
        
        "start_tag": "open_tag match (id_attribute | tag_attribute)* (close_open_tag | auto_close_open_tag nomatch)",
        "end_tag": "close_tag matched",
        
        "tags": {
            "type": "ngram",
            "tokens": [
                ["start_tag"], 
                ["end_tag"]
            ]
        },
        
        "blocks": {
            "type": "ngram",
            "tokens": [
                ["comment_block"],
                ["cdata_block"],
                ["meta_block"],
            ]
        }
    },
    
    // what to parse and in what order
    "Parser": [ "blocks", "tags", "atom" ]
};
