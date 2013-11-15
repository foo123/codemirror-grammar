    
    var
        //
        // default grammar settings
        programmingLikeGrammar = {
            
            // prefix ID for regular expressions used in the grammar
            "RegExpID" : null,
            
            // lists of (simple/string) tokens to be grouped into one regular expression,
            // else matched one by one, 
            // this is usefull for speed fine-tuning the parser
            "RegExpGroups" : null,
            
            //
            // style model
            
            // lang token type  -> CodeMirror (style) tag
            "style" : {
                "error":       "error",
                "comment":     "comment",
                "meta":        "meta",
                "defines":     "def",
                "atom":        "atom",
                "keyword":     "keyword",
                "builtin":     "builtin",
                "operator":    "operator",
                "identifier":  "variable",
                "identifier2": "variable",
                "identifier3": "variable",
                "identifier4": "variable",
                "identifier5": "variable",
                "number":      "number",
                "number2":     "number",
                "number3":     "number",
                "string":      "string",
                "string2":     "string",
                "string3":     "string",
                "block":       "string",
                "block2":      "string",
                "block3":      "string",
                "delimiter":   "meta"
            },

            
            //
            // lexical model
            
            // comments
            "comments" : { "line" : null, "block" : null },
            
            // general blocks, eg heredocs, cdata, etc..
            "blocks" : null,
            "blocks2" : null,
            "blocks3" : null,
            
            // general identifiers, in order of matching
            "identifiers" : null,
            "identifiers2" : null,
            "identifiers3" : null,
            "identifiers4" : null,
            "identifiers5" : null,
            
            // numbers, in order of matching
            "numbers" : null,
            "numbers2" : null,
            "numbers3" : null,

            // strings, in order of matching
            "strings" : null,
            "strings2" : null,
            "strings3" : null,
            
            // general attributes, in order of matching
            //"attributes" : null,
            //"attributes2" : null,
            //"attributes3" : null,
            //"properties" : null,
            
            // operators
            "operators" : { "one" : null, "two" : null, "words" : null },
            
            // delimiters
            "delimiters" : { "one" : null, "two" : null, "three" : null },
            
            // atoms
            "atoms" : null,
            
            // meta
            "meta" : null,
            
            // defines
            "defines" : null,
            
            // keywords
            "keywords" : null,
            
            // builtin functions, constructs, etc..
            "builtins" : null,
            
            // how are scoped blocks defined (possible values are : indent startchars, dedent endchars, etc.. )
            "indent" : null
        },
        
        markupLikeGrammar = {
            
            // prefix ID for regular expressions used in the grammar
            "RegExpID" : null,
            
            // lists of (simple/string) tokens to be grouped into one regular expression,
            // else matched one by one, 
            // this is usefull for speed fine-tuning the parser
            "RegExpGroups" : null,
            
            //
            // style model
            
            // lang token type  -> CodeMirror (style) tag
            "style" : {
                "error":       "error",
                "comment":     "comment",
                "meta":        "meta",
                "defines":     "def",
                "atom":        "atom",
                "keyword":     "keyword",
                "builtin":     "builtin",
                "attribute":   "attribute",
                "tag":         "tag",
                "tag2":        "tag",
                "tag3":        "tag",
                "tag4":        "tag",
                "tag5":        "tag",
                "identifier":  "variable",
                "identifier2": "variable",
                "identifier3": "variable",
                "identifier4": "variable",
                "identifier5": "variable",
                "number":      "number",
                "number2":     "number",
                "number3":     "number",
                "string":      "string",
                "string2":     "string",
                "string3":     "string",
                "block":       "string",
                "block2":      "string",
                "block3":      "string",
                "delimiter":   "meta"
            },

            
            //
            // lexical model
            
            // comments
            "comments" : { "line" : null, "block" : null },
            
            // general blocks, eg heredocs, cdata, etc..
            "blocks" : null,
            "blocks2" : null,
            "blocks3" : null,
            
            // general tags, in order of matching
            "tags" : null,
            "tags2" : null,
            "tags3" : null,
            "tags4" : null,
            "tags5" : null,
            
            "autoclose" : null,
            
            // general attributes, in order of matching
            "attributes" : null,
            "attributes2" : null,
            "attributes3" : null,
            //"properties" : null,
            
            // general identifiers, in order of matching
            "identifiers" : null,
            "identifiers2" : null,
            "identifiers3" : null,
            "identifiers4" : null,
            "identifiers5" : null,
            
            // numbers, in order of matching
            "numbers" : null,
            "numbers2" : null,
            "numbers3" : null,

            // strings, in order of matching
            "strings" : null,
            "strings2" : null,
            "strings3" : null,
            
            // atoms
            "atoms" : null,
            
            // meta
            "meta" : null,
            
            // defines
            "defines" : null,
            
            // keywords
            "keywords" : null,
            
            // builtin functions, constructs, etc..
            "builtins" : null,
            
            // delimiters
            "delimiters" : { "one" : null, "two" : null, "three" : null },
            
            // how are scoped blocks defined (possible values are : indent startchars, dedent endchars, etc.. )
            "indent" : null
        }
    ;
