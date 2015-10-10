// 1. a partial css grammar in simple JSON format
var css_grammar = {
    "RegExpID" : "RE::",

    "Extra" : {
        "fold" : "brace"
    },
    
    //
    // Style model
    "Style" : {
        "comment":         "comment",
        "@atrule":         "def",
        "@import":         "def",
        "@keyframes":      "def",
        "@media":          "def",
        "identifier":      "variable",
        "!important":      "builtin",
        "CssAtom":         "atom",
        "url":             "atom",
        "format":          "atom",
        "CssProperty":     "property",
        "HtmlElement":     "tag",
        "CssID":           "builtin",
        "CssClass":        "qualifier",
        "PseudoElement":   "string",
        "number":          "number",
        "string":          "string",
        "text":            "string"
    },

    
    //
    // Lexical model
    "Lex" : {
        
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
        
        // numbers, in order of matching
        "number" : [
            // integers
            // decimal
            "RE::/[0-9]\\d*(rad|grad|deg|turn|vh|vw|vmin|vmax|px|rem|em|%|in|cm|mm|pc|pt|ex|s|ms)?/i",
            // floats
            "RE::/\\.\\d+(rad|grad|deg|turn|vh|vw|vmin|vmax|px|rem|em|%|in|cm|mm|pc|pt|ex|s|ms)?/i",
            "RE::/\\d+\\.\\d*(rad|grad|deg|turn|vh|vw|vmin|vmax|px|rem|em|%|in|cm|mm|pc|pt|ex|s|ms)?/i",
            "RE::/\\d*\\.\\d+(rad|grad|deg|turn|vh|vw|vmin|vmax|px|rem|em|%|in|cm|mm|pc|pt|ex|s|ms)?/i",
            // hex color
            "RE::/#[0-9a-f]{3,6}/i"
        ],
        
        // strings
        "string" : {
            "type" : "block",
            "multiline": false,
            "tokens" : [
                //  start,           end of string (can be the matched regex group ie. 1 )
                [ "RE::/(['\"])/", 1 ]
            ]
        },
        
        "text" : "RE::/[^\\(\\)\\[\\]\\{\\}'\"]+/",
        
        // css identifier
        "identifier" : "RE::/[a-z_\\-][a-z0-9_\\-]*/i",
        
        // css ids
        "CssID" : "RE::/#[a-z_\\-][a-z0-9_\\-]*/i",
        
        // css classes
        "CssClass" : "RE::/\\.[a-z_\\-][a-z0-9_\\-]*/i",
        
        // css pseudo classes / pseudo elements
        "PseudoElement" : "RE::/::?[a-z_\\-][a-z0-9_\\-]*/i",
        
        // css properties
        "CssProperty" : "RE::/[a-z_\\-][a-z0-9_\\-]*/i",
                              
        // css atoms / values
        "url" : "RE::/url\\b/i",
        "format" : "RE::/format\\b/i",
        "CssAtom" : "RE::/[a-z_\\-][a-z_\\-]*/i",
        
        // css @atrules
        "@import" : "RE::/@import\\b/i",
        "@keyframes" : "RE::/@[a-z\\-]*keyframes\\b/i",
        "@media" : "RE::/@media\\b/i",
        "@atrule" : "RE::/@[a-z_\\-][a-z0-9_\\-]*/i",
        
        "!important" : "RE::/!important\\b/i",
        
        // css html element
        "HtmlElement" : "RE::/[a-z_\\-][a-z0-9_\\-]*/i"
    },

    //
    // Syntax model (optional)
    "Syntax" : {
        
        "urlDeclaration" : {
            "type" : "ngram",
            "tokens" : [ "url", "(", "string | text", ")" ]
        },
        
        "formatDeclaration" : {
            "type" : "ngram",
            "tokens" : [ "format", "(", "string | text", ")" ]
        },
        
        "cssSelector" : {
            "type" : "group",
            "match" : "oneOrMore",
            "tokens" : [ "HtmlElement", "CssID", "CssClass", "PseudoElement", "string", ",", "(", ")", "[", "]", "=", "+", "^", ">", "*", "~"]
        },
        
        "RHSAssignment" : {
            "type" : "group",
            "match" : "oneOrMore",
            "tokens" : [ "!important", "urlDeclaration", "formatDeclaration", "string", "number", "CssAtom", ",", "(", ")" ]
        },
        
        "cssAssignment" : {
            "type" : "group",
            "match" : "all",
            "tokens" : [ "CssProperty", ":", "RHSAssignment", "semicolon" ]
        },
        
        // syntax grammar (n-gram) for a block of css assignments
        "cssBlock" : {
            "type" : "n-gram",
            "tokens" : [
                [ "number", "{", "cssAssignment*", "}" ],
                [ "cssSelector", "{", "cssAssignment*", "}" ]
            ]
        },
        
        "@importDirective" : {
            "type" : "n-gram",
            "tokens" : [ "@import", "urlDeclaration", ";" ]
        },
        
        "@keyframesDirective" : {
            "type" : "n-gram",
            "tokens" : [ "@keyframes", "identifier", "{", "cssBlock*", "}" ]
        },
        
        "cssIdentifiers" : {
            "type" : "group",
            "match": "oneOrMore",
            "tokens" : [ "identifier", "number", "string", ",", "(", ")"]
        },
        
        "@mediaDirective" : {
            "type" : "n-gram",
            "tokens" : [ "@media", "cssIdentifiers", "{", "cssBlock*", "}" ]
        },
        
        "semicolon" : ";*",
        
        "atruleLine" : {
            "type" : "group",
            "match": "all",
            "tokens" : [ "cssIdentifiers", "semicolon" ]
        },
        
        "atruleBlock" : {
            "type" : "group",
            "match": "all",
            "tokens" : [ "{", "cssAssignments", "}" ]
        },
        
        "@atruleDirective"  : {
            "type" : "n-gram",
            "tokens" : [ "@atrule", "atruleBlock | atruleLine" ]
        }
    },

    // what to parse and in what order
    "Parser" : [
        "comment",
        "@importDirective",
        "@keyframesDirective",
        "@mediaDirective",
        "@atruleDirective",
        "cssBlock"
    ]
};