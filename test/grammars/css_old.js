// 1. a partial css grammar in simple JSON format
var css_grammar = {
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID": "RE::",

    // Style model
    "Style": {
        // lang token type  -> Editor (style) tag
        // the mapping here is used to match the codemirror css demo color scheme
        "comment":      "comment",
        "meta":         "attribute",
        "meta2":        "def",
        "atom":         "string-2",
        "property":     "property",
        "element":      "tag",
        "url":          "tag",
        "operator":     "operator",
        "font":         "variable-2",
        "standard":     "keyword",
        "cssID":        "builtin",
        "cssClass":     "qualifier",
        "cssPseudoElement": "string",
        "identifier":   "variable-2",
        "number":       "number",
        "hexcolor":      "builtin",
        "string":       "string",
        "text":         "string"
    },

    // Lexical model
    "Lex": {
        
        // comments
        "comment" : {
            "type" : "comment",
            "interleave": true,
            "tokens" : [
                // block comments
                // start, end     delims
                [  "/*",  "*/" ]
            ]
        },
        
        // some standard identifiers
        "font" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [
                "arial", "tahoma", "courier"
            ]
        },
        
        "standard" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [
                "!important", "only"
            ]
        },
        
        // css ids
        "cssID" : "RE::/#[_A-Za-z][_A-Za-z0-9]*/",
        
        // css classes
        "cssClass" : "RE::/\\.[_A-Za-z][_A-Za-z0-9]*/",
        
        "cssPseudoElement" : "RE::/::?[_A-Za-z][_A-Za-z0-9]*/",
        
        // general identifiers
        "identifier" : "RE::/[_A-Za-z][_A-Za-z0-9]*/",
        
        // numbers, in order of matching
        "number" : [
            // floats
            "RE::/\\d*\\.\\d+(e[\\+\\-]?\\d+)?(em|px|%|pt)?/",
            "RE::/\\d+\\.\\d*(em|px|%|pt)?/",
            "RE::/\\.\\d+(em|px|%|pt)?/",
            // integers
            // decimal
            "RE::/[1-9]\\d*(e[\\+\\-]?\\d+)?(em|px|%|pt)?/",
            // just zero
            "RE::/0(?![\\dx])(em|px|%|pt)?/"
        ],
        
        // hex colors
        "hexcolor" : "RE::/#[0-9a-fA-F]+/",

        // strings
        "string" : {
            "type" : "escaped-block",
            "escape" : "\\",
            "tokens" : [
                //  start,           end of string (can be the matched regex group ie. 1 )
                [ "RE::/([`'\"])/", 1 ]
            ]
        },
        
        "text" : "RE::/[^\\(\\)\\[\\]\\{\\}'\"]+/",
        
        // operators
        "operator" : {
            "tokens" : [
                "*", "+", ",", "=", ";", ">"
            ]
        },
        
        // atoms
        "atom" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ 
                "block", "none", "inherit", "inline-block", "inline", 
                "relative", "absolute", "fixed", "static",
                "sans-serif", "serif", "monospace", "bolder", "bold", 
                "rgba", "rgb", "underline", "wrap"
            ]
        },
        
        // meta
        "meta" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "tokens" : [ "screen",  "handheld" ]
        },

        // defs
        "meta2" : "RE::/@[_A-Za-z][_A-Za-z0-9]*/",

        // css properties
        "property" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
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
                              
        // css html element
        "element" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
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
                "blockquote"
            ]
        },
        
        "url" : "RE::/url\\b/"
    },

    // Syntax model (optional)
    "Syntax": {
        
        "stringOrUnquotedText" : {
            "type" : "group",
            "match" : "either",
            "tokens" : [ "string", "text" ]
        },
        
        // highlight url(...) as string regardless of quotes or not
        "urlDeclaration" : {
            "type" : "n-gram",
            "tokens" : [ "url", "" /* match non-space */, "(", "stringOrUnquotedText", ")" ]
        },
        
        "RHSAssignment" : {
            "type" : "group",
            "match" : "oneOrMore",
            "tokens" : [ "urlDeclaration", "atom", "font", "standard", "string", "number", "hexcolor", "identifier", ",", "(", ")" ]
        },
        
        "cssAssignment" : {
            "type" : "group",
            "match" : "all",
            "tokens" : [ "property", ":", "RHSAssignment", ";" ]
        },
        
        "cssAssignments" : {
            "type" : "group",
            "match" : "zeroOrMore",
            "tokens" : [ "cssAssignment" ]
        },
        
        // syntax grammar (n-gram) for a block of css assignments
        "cssBlock" : {
            "type" : "n-gram",
            "tokens" : [
                [ "{", "cssAssignments", "}" ]
            ]
        }
    },

    // what to parse and in what order
    "Parser": [
        "comment",
        "meta",
        "meta2",
        "urlDeclaration",
        "element",
        "cssID",
        "cssClass",
        "cssPseudoElement",
        "cssBlock",
        "number",
        "hexcolor",
        "string"
    ]
};
