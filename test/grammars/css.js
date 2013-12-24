// 1. a partial css grammar in simple JSON format
var css_grammar = {
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RegExp::",

    //
    // Style model
    "Style" : {
        // lang token type  -> CodeMirror (style) tag
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
        "number2":      "builtin",
        "string":       "string",
        "text":         "string"
    },

    
    //
    // Lexical model
    "Lex" : {
        
        // comments
        "comment" : {
            "type" : "comment",
            "tokens" : [
                // block comments
                // start, end     delims
                [  "/*",  "*/" ]
            ]
        },
        
        // some standard identifiers
        "font" : {
            // "simple" token type is default, if no token type
            //"type" : "simple",
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            // combine tokens into one regular expression (using optional delimiter),
            // by default tokens will be combined using "\\b" word-boundary, 
            // this is usefull for speed fine-tuning the parser
            //"combine" : "\\b",
            "tokens" : [
                "arial", "tahoma", "courier"
            ]
        },
        
        "standard" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            // combine tokens into one regular expression (using optional delimiter),
            // by default tokens will be combined using "\\b" word-boundary, 
            // this is usefull for speed fine-tuning the parser
            //"combine" : "\\b",
            "tokens" : [
                "!important", "only"
            ]
        },
        
        // css ids
        "cssID" : "RegExp::#[_A-Za-z][_A-Za-z0-9]*",
        
        // css classes
        "cssClass" : "RegExp::\\.[_A-Za-z][_A-Za-z0-9]*",
        
        "cssPseudoElement" : "RegExp::::?[_A-Za-z][_A-Za-z0-9]*",
        
        // general identifiers
        "identifier" : "RegExp::[_A-Za-z][_A-Za-z0-9]*",
        
        // numbers, in order of matching
        "number" : [
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
        
        // hex colors
        "number2" : "RegExp::#[0-9a-fA-F]+",

        // strings
        "string" : {
            "type" : "escaped-block",
            "escape" : "\\",
            "tokens" : [
                //  start,           end of string (can be the matched regex group ie. 1 )
                [ "RegExp::([`'\"])", 1 ]
            ]
        },
        
        "text" : "RegExp::[^\\(\\)\\[\\]\\{\\}'\"]+",
        
        // operators
        "operator" : {
            // combine tokens into one regular expression (using optional delimiter),
            // by default tokens will be combined using "\\b" word-boundary, 
            // this is usefull for speed fine-tuning the parser
            //"combine" : "\\b",
            "tokens" : [
                "*", "+", ",", "=", ";", ">"
            ]
        },
        
        "leftBracket" : "{",
        
        "rightBracket" : "}",
        
        "leftParen" : "(",
        
        "rightParen" : ")",
        
        "assignment" : ":",
        
        "endAssignment" : ";",
        
        "commaDelim" : ",",
        
        "delimiter" : {
            // combine tokens into one regular expression (using optional delimiter),
            // by default tokens will be combined using "\\b" word-boundary, 
            // this is usefull for speed fine-tuning the parser
            "combine" : true,
            "tokens" : [ ",", "[", "]", "(", ")" ]
        },
        
        // atoms
        "atom" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            // combine tokens into one regular expression (using optional delimiter),
            // by default tokens will be combined using "\\b" word-boundary, 
            // this is usefull for speed fine-tuning the parser
            //"combine" : "\\b",
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
            // combine tokens into one regular expression (using optional delimiter),
            // by default tokens will be combined using "\\b" word-boundary, 
            // this is usefull for speed fine-tuning the parser
            //"combine" : "\\b",
            "tokens" : [ "screen",  "handheld" ]
        },

        // defs
        "meta2" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            // combine tokens into one regular expression (using optional delimiter),
            // by default tokens will be combined using "\\b" word-boundary, 
            // this is usefull for speed fine-tuning the parser
            //"combine" : "\\b",
            "tokens" : "RegExp::@[_A-Za-z][_A-Za-z0-9]*"
        },

        // css properties
        "property" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            // combine tokens into one regular expression (using optional delimiter),
            // by default tokens will be combined using "\\b" word-boundary, 
            // this is usefull for speed fine-tuning the parser
            //"combine" : "\\b",
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
            // combine tokens into one regular expression (using optional delimiter),
            // by default tokens will be combined using "\\b" word-boundary, 
            // this is usefull for speed fine-tuning the parser
            //"combine" : "\\b",
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
        
        "url" : "url"
    },

    //
    // Syntax model (optional)
    "Syntax" : {
        
        "stringOrUnquotedText" : {
            "type" : "group",
            "match" : "either",
            "tokens" : [ "string", "text" ]
        },
        
        // highlight url(...) as string regardless of quotes or not
        "urlDeclaration" : {
            "type" : "n-gram",
            "tokens" : [ "url", "leftParen", "stringOrUnquotedText", "rightParen" ]
        },
        
        "urlDeclarationGroup" : {
            "type" : "group",
            "match" : "all",
            "tokens" : [ "url", "leftParen", "stringOrUnquotedText", "rightParen" ]
        },
        
        "RHSAssignment" : {
            "type" : "group",
            "match" : "oneOrMore",
            "tokens" : [ "urlDeclarationGroup", "atom", "font", "standard", "string", "number", "number2", "identifier", "commaDelim", "leftParen", "rightParen" ]
        },
        
        "cssAssignment" : {
            "type" : "group",
            "match" : "all",
            "tokens" : [ "property", "assignment", "RHSAssignment", "endAssignment" ]
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
                [ "leftBracket", "cssAssignments", "rightBracket" ]
            ]
        }
    },

    // what to parse and in what order
    "Parser" : [
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
        "number2",
        "string",
        "delimiter"
    ]
};
