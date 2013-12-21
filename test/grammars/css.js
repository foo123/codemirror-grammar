// 1. a partial css grammar in simple JSON format
var css_grammar = {
        
        // prefix ID for regular expressions used in the grammar
        "RegExpID" : "RegExp::",
    
        // lists of (simple/string) tokens to be grouped into one regular expression,
        // else matched one by one, 
        // this is usefull for speed fine-tuning the parser
        "RegExpGroups" : {
            "font" : "[\\s,]",
            "standard" : true,
            "atom" : true,
            "meta" : true,
            "meta2" : true,
            "property" : "\\b",
            "element" : "\\b",
            "operator" : "\\b",
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
            "text": "string"
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
                "type" : "simple",
                "tokens" : [
                    "arial", "tahoma", "courier"
                ]
            },
            
            "standard" : {
                "type" : "simple",
                "tokens" : [
                    "!important", "only"
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
            
            "cssPseudoElement" : {
                "type" : "simple",
                "tokens" : "RegExp::::?[_A-Za-z][_A-Za-z0-9]*"
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
            
            "text" : {
                "type" : "simple",
                "tokens" : "RegExp::[^\\(\\)\\[\\]\\{\\}'\"]+"
            },
            
            // operators
            "operator" : {
                "type" : "simple",
                "tokens" : [
                    "*", "+", ",", "=", ";", ">"
                ]
            },
            
            "leftBracket" : {
                "type" : "simple",
                "tokens" : "{"
            },
            
            "rightBracket" : {
                "type" : "simple",
                "tokens" : "}"
            },
            
            "leftParen" : {
                "type" : "simple",
                "tokens" : "("
            },
            
            "rightParen" : {
                "type" : "simple",
                "tokens" : ")"
            },
            
            "assignment" : {
                "type" : "simple",
                "tokens" : ":"
            },
            
            "endAssignment" : {
                "type" : "simple",
                "tokens" : ";"
            },
            
            "delimiter" : {
                "type" : "simple",
                "tokens" : [
                    ",", "[", "]", "(", ")"
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

            // css properties
            "property" : {
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
                                  
            // css html element
            "element" : {
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
                    "url"
                ]
            },
            
            "url" : {
                "type" : "simple",
                "tokens" : "url"
            }
        },
    
        //
        // Syntax model
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
                "tokens" : [ "urlDeclarationGroup", "delimiter", "atom", "font", "standard", "string", "number", "number2", "identifier" ]
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
            "urlDeclaration",
            "number",
            "cssID",
            "cssClass",
            "cssPseudoElement",
            "delimiter",
            "number2",
            "string",
            "element",
            "meta",
            "meta2",
            "cssBlock"
        ]
};
