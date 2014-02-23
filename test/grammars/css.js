// 1. a partial css grammar in simple JSON format
var css_grammar = {
    "RegExpID" : "RegExp::",

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
            "RegExp::/[0-9]\\d*(rad|grad|deg|turn|vh|vw|vmin|vmax|px|rem|em|%|in|cm|mm|pc|pt|ex|s|ms)?/i",
            // floats
            "RegExp::/\\.\\d+(rad|grad|deg|turn|vh|vw|vmin|vmax|px|rem|em|%|in|cm|mm|pc|pt|ex|s|ms)?/i",
            "RegExp::/\\d+\\.\\d*(rad|grad|deg|turn|vh|vw|vmin|vmax|px|rem|em|%|in|cm|mm|pc|pt|ex|s|ms)?/i",
            "RegExp::/\\d*\\.\\d+(rad|grad|deg|turn|vh|vw|vmin|vmax|px|rem|em|%|in|cm|mm|pc|pt|ex|s|ms)?/i",
            // hex color
            "RegExp::/#[0-9a-f]{3,6}/i"
        ],
        
        // strings
        "string" : {
            "type" : "block",
            "multiline": false,
            "tokens" : [
                //  start,           end of string (can be the matched regex group ie. 1 )
                [ "RegExp::/(['\"])/", 1 ]
            ]
        },
        
        "text" : "RegExp::/[^\\(\\)\\[\\]\\{\\}'\"]+/",
        
        // css identifier
        "identifier" : "RegExp::/[a-z_\\-][a-z0-9_\\-]*/i",
        
        // css ids
        "CssID" : "RegExp::/#[a-z_\\-][a-z0-9_\\-]*/i",
        
        // css classes
        "CssClass" : "RegExp::/\\.[a-z_\\-][a-z0-9_\\-]*/i",
        
        // css pseudo classes / pseudo elements
        "PseudoElement" : "RegExp::/::?[a-z_\\-][a-z0-9_\\-]*/i",
        
        // css properties
        "CssProperty" : "RegExp::/[a-z_\\-][a-z0-9_\\-]*/i",
                              
        // css atoms / values
        "url" : "RegExp::/url\\b/i",
        "format" : "RegExp::/format\\b/i",
        "CssAtom" : "RegExp::/[a-z_\\-][a-z_\\-]*/i",
        
        // css @atrules
        "@import" : "RegExp::/@import\\b/i",
        "@keyframes" : "RegExp::/@[a-z\\-]*keyframes\\b/i",
        "@media" : "RegExp::/@media\\b/i",
        "@atrule" : "RegExp::/@[a-z_\\-][a-z0-9_\\-]*/i",
        
        "!important" : "RegExp::/!important\\b/i",
        
        // css html element
        "HtmlElement" : "RegExp::/[a-z_\\-][a-z0-9_\\-]*/i"
    },

    //
    // Syntax model (optional)
    "Syntax" : {
        
        "stringOrText" : {
            "type" : "group",
            "match" : "either",
            "tokens" : [ "string", "text" ]
        },
        
        "urlDeclaration" : {
            "type" : "ngram",
            "tokens" : [ "url", "(", "stringOrText", ")" ]
        },
        
        "formatDeclaration" : {
            "type" : "ngram",
            "tokens" : [ "format", "(", "stringOrText", ")" ]
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
        
        "semicolon" : {
            "type" : "group",
            "match" : "zeroOrMore",
            "tokens" : [ ";" ]
        },
        
        "cssAssignment" : {
            "type" : "group",
            "match" : "all",
            "tokens" : [ "CssProperty", ":", "RHSAssignment", "semicolon" ]
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
                [ "number", "{", "cssAssignments", "}" ],
                [ "cssSelector", "{", "cssAssignments", "}" ]
            ]
        },
        
        "cssBlocks" : {
            "type" : "group",
            "match": "zeroOrMore",
            "tokens" : [ "cssBlock" ]
        },
        
        "@importDirective" : {
            "type" : "n-gram",
            "tokens" : [ "@import", "urlDeclaration", ";" ]
        },
        
        "@keyframesDirective" : {
            "type" : "n-gram",
            "tokens" : [ "@keyframes", "identifier", "{", "cssBlocks", "}" ]
        },
        
        "cssIdentifiers" : {
            "type" : "group",
            "match": "oneOrMore",
            "tokens" : [ "identifier", "number", "string", ",", "(", ")"]
        },
        
        "@mediaDirective" : {
            "type" : "n-gram",
            "tokens" : [ "@media", "cssIdentifiers", "{", "cssBlocks", "}" ]
        },
        
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
        
        "atruleLineOrBlock" : {
            "type" : "group",
            "match": "either",
            "tokens" : [ "atruleBlock", "atruleLine" ]
        },
        
        "@atruleDirective"  : {
            "type" : "n-gram",
            "tokens" : [ "@atrule", "atruleLineOrBlock" ]
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