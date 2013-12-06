// 1. a partial css grammar in simple JSON format
var css_grammar = {
        
        // prefix ID for regular expressions used in the grammar
        "RegExpID" : "RegExp::",
    
        // lists of (simple/string) tokens to be grouped into one regular expression,
        // else matched one by one, 
        // this is usefull for speed fine-tuning the parser
        "RegExpGroups" : {
            "standard" : true,
            "standard2" : true,
            "atom" : true,
            "meta" : true,
            "meta2" : true,
            "keyword" : true,
            "builtin" : true,
            "operator" : true,
            "delimiter" : true
        },
            
        //
        // Style model
        "Style" : {
            // lang token type  -> CodeMirror (style) tag
            // the mapping here is used to match the codemirror css demo color scheme
            "error":        "error",
            "comment":      "comment",
            "meta":         "attribute",
            "meta2":        "def",
            "atom":         "string-2",
            "keyword":      "property",
            "builtin":      "tag",
            "operator":     "operator",
            "standard":     "variable-2",
            "standard2":    "keyword",
            "cssID":        "builtin",
            "cssClass":     "qualifier",
            "identifier":   "variable-2",
            "number":       "number",
            "number2":      "builtin",
            "string":       "string"
        },

        
        //
        // Lexical model
        "Lex" : {
            
            // comments
            "comment" : {
                "type" : "block",
                "tokens" : [
                    // block comments
                    // start, end     delims
                    [  "/*",  "*/" ]
                ]
            },
            
            // some standard identifiers
            "standard" : {
                "type" : "simple",
                "tokens" : [
                    "arial",
                    "tahoma",
                    "courier"
                ]
            },
            
            "standard2" : {
                "type" : "simple",
                "tokens" : [
                    "!important",
                    "only"
                ]
            },
            
            // css ids
            "cssID" : {
                "type" : "simple",
                "tokens" : "RegExp::#[_A-Za-z][_A-Za-z0-9]*"
            },
            
            // css classes
            "cssClass" : {
                "type" : "simple",
                "tokens" : "RegExp::\\.[_A-Za-z][_A-Za-z0-9]*"
            },
            
            // general identifiers
            "identifier" : {
                "type" : "simple",
                "tokens" : "RegExp::[_A-Za-z][_A-Za-z0-9]*"
            },
            
            // numbers, in order of matching
            "number" : {
                "type" : "simple",
                "tokens" : [
                    // floats
                    "RegExp::\\d*\\.\\d+(e[\\+\\-]?\\d+)?(em|px|%|pt)?",
                    "RegExp::\\d+\\.\\d*(em|px|%|pt)?",
                    "RegExp::\\.\\d+(em|px|%|pt)?",
                    // integers
                    // decimal
                    "RegExp::[1-9]\\d*(e[\\+\\-]?\\d+)?(em|px|%|pt)?",
                    // just zero
                    "RegExp::0(?![\\dx])(em|px|%|pt)?"
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
                "tokens" : [
                    //  start,           end of string (can be the matched regex group ie. 1 )
                    [ "RegExp::([`'\"])", 1 ]
                ]
            },
            
            // operators
            "operator" : {
                "type" : "simple",
                "tokens" : [
                    "::", "*", "+", ",", "=", ";", ">"
                ]
            },
            
            // delimiters
            "delimiter" : {
                "type" : "simple",
                "tokens" : [
                    "(", ")", "[", "]", "{", "}", ",", "=", ";", "."
                ]
            },
            
            // atoms
            "atom" : {
                "type" : "simple",
                "tokens" : [ 
                    "block", "none", "inherit", "inline-block", "inline", 
                    "relative", "absolute", "fixed", "static",
                    "sans-serif", "serif", "monospace", "bolder", "bold", 
                    "rgba", "rgb", "underline", "wrap"
                ]
            },
            
            // meta
            "meta" : {
                "type" : "simple",
                "tokens" : [
                    "screen",  "handheld"
                ]
            },

            // defs
            "meta2" : {
                "type" : "simple",
                "tokens" : [
                    "@import", "@media"
                ]
            },

            // keywords
            "keyword" : {
                "type" : "simple",
                "tokens" : [ 
                    "background-color", "background-image", "background-position", "background-repeat", "background", 
                    "font-family", "font-size", "font-weight", "font", 
                    "text-decoration", "text-align",
                    "margin-left", "margin-right", "margin-top", "margin-bottom", "margin", 
                    "padding-left", "padding-right", "padding-top", "padding-bottom", "padding", 
                    "border-left", "border-right", "border-top", "border-bottom", "border", 
                    "position", "display" , "content", "color"
                ]
            },
                                  
            "builtin" : {
                "type" : "simple",
                "tokens" : [ 
                    "a", "p", "i",
                    "br", "hr",
                    "sup", "sub",
                    "img", "video", "audio", 
                    "canvas", "iframe",
                    "pre", "code",
                    "h1", "h2", "h3", "h4", "h5", "h6", 
                    "html", "body", 
                    "header", "footer", "nav",
                    "div", "span", "section", "strong",
                    "blockquote", 
                    "before", "after", "url"
                ]
            }
        },
    
        // what to parse and in what order
        "Parser" : [
            "comment",
            "number",
            "cssID",
            "number2",
            "string",
            "keyword",
            "builtin",
            "atom",
            "meta",
            "meta2",
            "operator",
            "delimiter",
            "standard",
            "standard2",
            "cssClass",
            "identifier"
        ]
};
