    
    var
        //
        // default grammar settings
        defaultGrammar = {
            
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
                "doctype",
                "atoms",
                "numbers",
                "numbers2",
                "numbers3",
                "strings",
                "strings2",
                "strings3",
                "strings4",
                "strings5",
                "attributes",
                "attributes2",
                "attributes3",
                "assignments",
                "tags",
                "tags2",
                "tags3",
                "keywords",
                "builtins",
                "operators",
                "delimiters",
                "meta",
                "defines",
                "identifiers",
                "identifiers2",
                "identifiers3",
                "identifiers4",
                "identifiers5"
            ],
            
            //
            // Style model
            "Style" : {
                
                // lang token type  -> CodeMirror (style) tag
                "error":        "error",
                "comments":     "comment",
                "meta":         "meta",
                "defines":      "def",
                "atoms":        "atom",
                "keywords":     "keyword",
                "builtins":     "builtin",
                "identifiers":  "variable",
                "identifiers2": "variable",
                "identifiers3": "variable",
                "identifiers4": "variable",
                "identifiers5": "variable",
                "tags":         "tag",
                "tags2":        "tag",
                "tags3":        "tag",
                "attributes":   "attribute",
                "attributes2":  "attribute",
                "attributes3":  "attribute",
                "numbers":      "number",
                "numbers2":     "number",
                "numbers3":     "number",
                "strings":      "string",
                "strings2":     "string",
                "strings3":     "string",
                "strings4":     "string",
                "strings5":     "string",
                "blocks":       "string",
                "blocks2":      "string",
                "blocks3":      "string",
                "blocks4":      "string",
                "blocks5":      "string",
                "operators":    "operator",
                "delimiters":   null,
                "assignments":  null
            },

            
            //
            // Lexical model
            "Lex" : {
                
                // comments
                "comments" : null,
                
                // general blocks ( 5 types ), eg heredocs, cdata, etc..
                "blocks" : null,
                "blocks2" : null,
                "blocks3" : null,
                "blocks4" : null,
                "blocks5" : null,
                
                // general (markup-like) tags ( 3 types )
                "tags" : null,
                "tags2" : null,
                "tags3" : null,
                "autoclose" : null,
            
                // general identifiers ( 5 types ), variables, function names etc..
                "identifiers" : null,
                "identifiers2" : null,
                "identifiers3" : null,
                "identifiers4" : null,
                "identifiers5" : null,
                
                // general numbers ( 3 types )
                "numbers" : null,
                "numbers2" : null,
                "numbers3" : null,

                // general strings ( 5 types )
                "strings" : null,
                "strings2" : null,
                "strings3" : null,
                "strings4" : null,
                "strings5" : null,
                
                // general attributes ( 3 types )
                "attributes" : null,
                "attributes2" : null,
                "attributes3" : null,
                
                // general assignments (for markup-like attributes)
                "assignments" : null,
            
                // general operators
                "operators" : null,
                
                // general delimiters
                "delimiters" : null,
                
                // general atoms
                "atoms" : null,
                
                // general meta
                "meta" : null,
                
                // general defines
                "defines" : null,
                
                // general keywords, reserved words
                "keywords" : null,
                
                // general builtins,  functions, constructs, etc..
                "builtins" : null,
            },
            
            // TODO
            // Syntax model and context-specific rules
            "Syntax" : null,
            
            // TODO
            // how are scoped blocks defined (possible values are : indent startchars, dedent endchars, etc.. )
            "Indentation" : null
        }
    ;
