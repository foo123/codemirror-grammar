// 1. a partial xml grammar in simple JSON format
var xml_grammar = {
        
        // prefix ID for regular expressions used in the grammar
        "RegExpID" : "RegExp::",
    
        // lists of (simple/string) tokens to be grouped into one regular expression,
        // else matched one by one, 
        // this is usefull for speed fine-tuning the parser
        "RegExpGroups" : { },
    
        //
        // Style model
        "Style" : {
            // lang token type  -> CodeMirror (style) tag
            "error":                "error",
            "commentBlock":         "comment",
            "metaBlock":            "meta",
            "atom":                 "atom",
            "cdataBlock":           "atom",
            "startTag":             "tag",
            "endTag":               "tag",
            "autocloseTag":         "tag",
            "closeTag":             "tag",
            "attribute":            "attribute",
            "assignment":           "operator",
            "number":               "number",
            "number2":              "number",
            "string":               "string"
        },

        "electricChars" : null,
        
        //
        // Lexical model
        "Lex" : {
            
            "commentBlock" : {
                "type" : "block",
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
            
            // attribute assignment
            "assignment" : {
                "type" : "simple",
                "tokens" : [ "=" ]
            },
            
            // tag attributes
            "attribute" : {
                "type" : "simple",
                "tokens" : [
                    "RegExp::[_a-zA-Z][_a-zA-Z0-9\\-]*"
                ]
            },
            
            // numbers, in order of matching
            "number" : {
                "type" : "simple",
                "tokens" : [
                    // floats
                    "RegExp::\\d+\\.\\d*",
                    "RegExp::\\.\\d+",
                    // integers
                    // decimal
                    "RegExp::[1-9]\\d*(e[\\+\\-]?\\d+)?",
                    // just zero
                    "RegExp::0(?![\\dx])"
                ]
            },
            
            "number2" : {
                "type" : "simple",
                "tokens" : [
                    // hex colors
                    "RegExp::#[0-9a-fA-F]+"
                ]
            },

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
            "atom" : {
                "type" : "simple",
                "tokens" : [
                    "RegExp::&[a-zA-Z][a-zA-Z0-9]*;",
                    "RegExp::&#[\\d]+;",
                    "RegExp::&#x[a-fA-F\\d]+;"
                ]
            },
            
            // tags
            "startTag" : {
                "type" : "simple",
                "tokens" : [
                    "RegExp::<[_a-zA-Z][_a-zA-Z0-9\\-]*"
                ]
            },
            
            "endTag" : {
                "type" : "simple",
                "tokens" : [ ">" ]
            },
            
            "autocloseTag" : {
                "type" : "simple",
                "tokens" : [ "/>" ]
            },
            
            // close tag, outdent action
            "closeTag" : {
                "type" : "simple",
                "tokens" : [
                    "RegExp::</[_a-zA-Z][_a-zA-Z0-9\\-]*>"
                ]
            }
        },
        
        //
        // Syntax model
        "Syntax" : {
            
            "stringOrNumber" : {
                "type" : "group",
                "match" : "either",
                "tokens" : [ "string", "number", "number2" ] 
            },
            
            "tagAttribute" : { 
                "type" : "group",
                "match" : "all",
                "tokens" : [ "attribute", "assignment", "stringOrNumber" ]
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
