    
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
            
            // order of tokens parsing
            "TokenOrder" : [
                "comments",
                "blocks",
                "blocks2",
                "blocks3",
                "blocks4",
                "blocks5",
                "numbers",
                "numbers2",
                "numbers3",
                "strings",
                "strings2",
                "strings3",
                "keywords",
                "builtins",
                "operators",
                "delimiters",
                "atoms",
                "meta",
                "defines",
                "identifiers",
                "identifiers2",
                "identifiers3",
                "identifiers4",
                "identifiers5"
            ],
            
            //
            // style model
            
            // lang token type  -> CodeMirror (style) tag
            "Style" : {
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
                "block4":      "string",
                "block5":      "string",
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
            "blocks4" : null,
            "blocks5" : null,
            
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
            "operators" : null,
            
            // delimiters
            "delimiters" : null,
            
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
            
            // order of token parsing
            "TokenOrder" : [
                "comments",
                "blocks",
                "blocks2",
                "blocks3",
                "blocks4",
                "blocks5",
                "doctype",
                "atoms",
                "numbers",
                "numbers2",
                "numbers3",
                "strings",
                "strings2",
                "strings3",
                "meta",
                "tags",
                "tags2",
                "tags3",
                "defines",
                "keywords",
                "builtins",
                "identifiers",
                "identifiers2",
                "identifiers3",
                "identifiers4",
                "identifiers5"
            ],
            
            //
            // style model
            
            // lang token type  -> CodeMirror (style) tag
            "Style" : {
                "error":       "error",
                "comment":     "comment",
                "meta":        "meta",
                "defines":     "def",
                "atom":        "atom",
                "keyword":     "keyword",
                "builtin":     "builtin",
                "operator":    "operator",
                "assignment":  null,
                "tag":         "tag",
                "tag2":        "tag",
                "tag3":        "tag",
                "attribute":   "attribute",
                "attribute2":  "attribute",
                "attribute3":  "attribute",
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
                "block4":      "string",
                "block5":      "string",
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
            "blocks4" : null,
            "blocks5" : null,
            
            // general tags, in order of matching
            "tags" : null,
            "tags2" : null,
            "tags3" : null,
            
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
            
            // assignments
            "assignments" : null,
            
            // operators
            "operators" : null,
            
            // delimiters
            "delimiters" : null,
            
            // how are scoped blocks defined (possible values are : indent startchars, dedent endchars, etc.. )
            "indent" : null
        }
    ;
