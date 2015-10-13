// 1. a partial css grammar in simple JSON format
var css_grammar = {
    "RegExpID" : "RE::",

    "Extra" : {
        "fold" : "brace"
    },
    
    //
    // Style model
    "Style" : {
        "comment"         : "comment",
        "@atrule"         : "def",
        "@import"         : "def",
        "@keyframes"      : "def",
        "@media"          : "def",
        "identifier"      : "variable",
        "!important"      : "builtin",
        "CssAtom"         : "atom",
        "url"             : "atom",
        "format"          : "atom",
        "CssProperty"     : "property",
        "HtmlElement"     : "tag",
        "CssID"           : "builtin",
        "CssClass"        : "qualifier",
        "PseudoElement"   : "string",
        "number"          : "number",
        "string"          : "string",
        "text"            : "string"
    },

    
    //
    // Lexical model
    "Lex" : {
        
        // comments
        "comment:comment" : {
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
        "string:block" : {
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
        "HtmlElement" : "RE::/[a-z_\\-][a-z0-9_\\-]*/i",
        
        "match:action" : {
            "push": "$0"
        },
        "matched1:action" : {
            "pop": "{",
            "msg": "Token \"$0\" does not match"
        },
        "matched2:action" : {
            "pop": "(",
            "msg": "Token \"$0\" does not match"
        }
    },

    //
    // Syntax model (optional)
    "Syntax" : {
        
        "urlDeclaration:ngram" : "url '(' match (string | text) ')' matched2",
        
        "formatDeclaration:ngram" : "format '(' match (string | text) ')' matched2",
        
        "cssSelector" : "(HtmlElement | CssID | CssClass | PseudoElement | string | ',' | '(' match | ')' matched2 | '[' | ']' | '=' | '+' | '^' | '>' | '*' | '~')+",
        
        "RHSAssignment" : "(!important | urlDeclaration | formatDeclaration | string | number | CssAtom | ',' | '(' match | ')' matched2)+",
        
        "cssAssignment" : "CssProperty ':' RHSAssignment ';'*",
        
        // syntax grammar (n-gram) for a block of css assignments
        "cssBlock:ngram" : [
            [ "number '{' match cssAssignment* '}' matched1" ],
            [ "cssSelector '{' match cssAssignment* '}' matched1" ]
        ],
        
        "@importDirective:ngram" : "@import urlDeclaration ';'",
        
        "@keyframesDirective:ngram" : "@keyframes identifier '{' match cssBlock* '}' matched1",
        
        "cssIdentifiers" : "(identifier | number | string | ',' | '(' match | ')' matched2)+",
        
        "@mediaDirective:ngram" : "@media cssIdentifiers '{' match cssBlock* '}' matched1",
        
        "atruleLine" : "cssIdentifiers ';'*",
        
        "atruleBlock" : "'{' match cssAssignments '}' matched1",
        
        "@atruleDirective:ngram"  : "@atrule (atruleBlock | atruleLine)"
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