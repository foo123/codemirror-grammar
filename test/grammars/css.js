// 1. a partial css grammar in simple JSON format
var css_grammar = {
        
        // prefix ID for regular expressions used in the grammar
        "RegExpID" : "RegExp::",
    
        // lists of (simple/string) tokens to be grouped into one regular expression,
        // else matched one by one, 
        // this is usefull for speed fine-tuning the parser
        "RegExpGroups" : {
            "identifiers" : true,
            "identifiers2" : true,
            "atoms" : true,
            "meta" : true,
            "defines" : true,
            "keywords" : true,
            "builtins" : true,
            "operators" : true,
            "delimiters" : true
        },
    
        // order of tokens parsing
        "TokenOrder" : [
            "comments",
            "numbers",
            "identifiers3",
            "numbers2",
            "strings",
            "keywords",
            "builtins",
            "atoms",
            "meta",
            "defines",
            "operators",
            "delimiters",
            "identifiers",
            "identifiers2",
            "identifiers4",
            "identifiers5"
        ],
            
        //
        // Style model
        "Style" : {
            // lang token type  -> CodeMirror (style) tag
            // the mapping here is used to match the codemirror css demo color scheme
            "error":        "error",
            "comments":     "comment",
            "meta":         "attribute",
            "defines":      "def",
            "atoms":        "string-2",
            "keywords":     "property",
            "builtins":     "tag",
            "operators":    "operator",
            "identifiers":  "variable-2",
            "identifiers2": "keyword",
            "identifiers3": "builtin",
            "identifiers4": "qualifier",
            "identifiers5": "variable-2",
            "numbers":      "number",
            "numbers2":     "builtin",
            "strings":      "string"
        },

        
        //
        // Lexical model
        "Lex" : {
            
            // comments
            "comments" : [
                // block comments
                // start, end     delims
                [  "/*",  "*/" ]
            ],
            
            // some standard identifiers
            "identifiers" : [
                "arial",
                "tahoma",
                "courier"
            ],
            "identifiers2" : [
                "!important",
                "only"
            ],
            // css ids
            "identifiers3" : "RegExp::#[_A-Za-z][_A-Za-z0-9]*",
            // css classes
            "identifiers4" : "RegExp::\\.[_A-Za-z][_A-Za-z0-9]*",
            // general identifiers
            "identifiers5" : "RegExp::[_A-Za-z][_A-Za-z0-9]*",
            
            // numbers, in order of matching
            "numbers" : [
                // floats
                "RegExp::\\d*\\.\\d+(e[\\+\\-]?\\d+)?(em|px|%|pt)?",
                "RegExp::\\d+\\.\\d*(em|px|%|pt)?",
                "RegExp::\\.\\d+(em|px|%|pt)?",
                // integers
                // decimal
                "RegExp::[1-9]\\d*(e[\\+\\-]?\\d+)?(em|px|%|pt)?",
                // just zero
                "RegExp::0(?![\\dx])(em|px|%|pt)?"
            ],
            "numbers2" : [
                // hex colors
                "RegExp::#[0-9a-fA-F]+"
            ],

            // strings
            "strings" : [
                //  start,           end of string (can be the matched regex group ie. 1 )
                [ "RegExp::([`'\"])", 1 ]
            ],
            
            // operators
            "operators" : [
                "::", "*", "+", ",", "=", ";", ">"
            ],
            
            // delimiters
            "delimiters" : [
                "(", ")", "[", "]", "{", "}", ",", "=", ";", "."
            ],
            
            // atoms
            "atoms" : [ 
                "block", "none", "inherit", "inline-block", "inline", 
                "relative", "absolute", "fixed", "static",
                "sans-serif", "serif", "monospace", "bolder", "bold", 
                "rgba", "rgb", "underline", "wrap"
            ],
            
            // meta
            "meta" : [
                "screen",  "handheld"
            ],

            // defs
            "defines" : [
                "@import", "@media"
            ],

            // keywords
            "keywords" : [ 
                "background-color", "background-image", "background-position", "background-repeat", "background", 
                "font-family", "font-size", "font-weight", "font", 
                "text-decoration", "text-align",
                "margin-left", "margin-right", "margin-top", "margin-bottom", "margin", 
                "padding-left", "padding-right", "padding-top", "padding-bottom", "padding", 
                "border-left", "border-right", "border-top", "border-bottom", "border", 
                "position", "display" , "content", "color"
            ],
                                  
            // builtin functions, constructs, etc..
            "builtins" : [ 
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
};
