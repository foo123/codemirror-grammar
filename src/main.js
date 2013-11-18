    
    //
    //  CodeMirror Grammar main class
    
    var self = {
        
        VERSION : VERSION,
        
        // extend a grammar using another base grammar
        extendGrammar : extend,
        
        // parse the grammar into a form suitable for generating parser
        parseGrammar : function(grammar, base) {
            var RegExpID, RegExpGroups, tokens, numTokens, _tokens, 
                Style, Lex, 
                t, tokID, tok, tokType, tokStyle, tokTypes;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if (grammar.__parsed)  return grammar;
            
            grammar = extend(grammar, base, defaultGrammar);
            
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            
            RegExpGroups = grammar.RegExpGroups || {};
            grammar.RegExpGroups = null;
            delete grammar.RegExpGroups;
            
            grammar.type = (grammar.type && "markup-like"==grammar.type) ? T_MARKUP_LIKE : T_PROGRAMMING_LIKE;
            
            tokens = grammar.TokenOrder || [];
            numTokens = tokens.length;
            _tokens = [];
            
            Style = grammar.Style || {};
            Lex = grammar.Lex || {};
            
            tokTypes = {
                TAG : {
                    // general tags ( 3 types )
                    "tags" : T_TAG,
                    "tags2" : T_TAG,
                    "tags3" : T_TAG
                },
                
                DOCTYPE : {
                    // doctype, not used at present
                    "doctype" : T_DOCTYPE
                },
                
                BLOCK : {
                    // comments (both line-comments and block-comments)
                    "comments" : T_COMMENT,
                    
                    // general blocks ( 5 types ), eg. heredocs, cdata, etc..
                    "blocks" : T_BLOCK,
                    "blocks2" : T_BLOCK,
                    "blocks3" : T_BLOCK,
                    "blocks4" : T_BLOCK,
                    "blocks5" : T_BLOCK
                },
                
                STRING : {
                    // general strings ( 5 types )
                    "strings" : T_STRING,
                    "strings2" : T_STRING,
                    "strings3" : T_STRING,
                    "strings4" : T_STRING,
                    "strings5" : T_STRING
                },
                
                SIMPLE : {
                    // general identifiers ( 5 types ), eg. variables, function names, etc..
                    "identifiers" : T_IDENTIFIER,
                    "identifiers2" : T_IDENTIFIER,
                    "identifiers3" : T_IDENTIFIER,
                    "identifiers4" : T_IDENTIFIER,
                    "identifiers5" : T_IDENTIFIER,
                    
                    // general numbers ( 3 types )
                    "numbers" : T_NUMBER,
                    "numbers2" : T_NUMBER,
                    "numbers3" : T_NUMBER,
                    
                    // general attributes ( 3 types ), eg. for tags
                    "attributes" : T_ATTRIBUTE,
                    "attributes2" : T_ATTRIBUTE,
                    "attributes3" : T_ATTRIBUTE,
                    
                    // other special tokens
                    "keywords" : T_KEYWORD,
                    "builtins" : T_BUILTIN,
                    "atoms" : T_ATOM,
                    "meta" : T_META,
                    "defines" : T_DEF,
                    "operators" : T_OP,
                    "delimiters" : T_DELIM,
                    "assignments" : T_ASSIGNMENT
                }
            };
            
            for (t=0; t<numTokens; t++)
            {
                tokID = tokens[ t ];
                
                if ( !Lex[ tokID ] ) continue;
                
                tok = null;
                
                // block tokens, comments, general blocks etc..
                if ( tokID in tokTypes.BLOCK )
                {
                    tok = getBlockMatcher( Lex[ tokID ], RegExpID ) || null;
                    tokType = tokTypes.BLOCK[ tokID ];
                    tokStyle = Style[ tokID ] || null;
                }
                
                // general strings tokens
                else if ( tokID in tokTypes.STRING )
                {
                    tok = getBlockMatcher( Lex[ tokID ], RegExpID ) || null;
                    tokType = tokTypes.STRING[ tokID ];
                    tokStyle = Style[ tokID ] || null;
                }
                
                // general tags tokens
                else if ( tokID in tokTypes.TAG )
                {
                    tok = getTagMatcher( Lex[ tokID ], RegExpID, RegExpGroups[tokID] ) || null;
                    tokType = tokTypes.TAG[ tokID ];
                    tokStyle = Style[ tokID ] || null;
                }
                
                // general doctype tokens
                else if ( tokID in tokTypes.DOCTYPE )
                {
                    // TODO
                    continue;
                }
                
                // general simple tokens, identifiers, numbers, keywords, etc..
                else if ( tokID in tokTypes.SIMPLE )
                {
                    tok = getCompositeMatcher( Lex[ tokID ], RegExpID, RegExpGroups[ tokID ] ) || null;
                    tokType = tokTypes.SIMPLE[ tokID ];
                    tokStyle = Style[ tokID ] || null;
                }
                
                if (tok)
                {
                    Lex[ tokID ] = tok;
                    _tokens.push( [ tok, tokType, tokStyle ] );
                }
                else
                {
                    Lex[ tokID ] = null;
                }
            }
            
            // types of indent etc..
            /*var hasIndent = false;
            if (grammar.Indentation) 
            {
                if (!grammar.indent["block-level"]) grammar.indent["block-level"] = { keywords: null, delims: null };
                if (!grammar.indent["statement-level"]) grammar.indent["statement-level"] = { delims: null };
                
                if (grammar.indent["block-level"].keywords)
                {
                    tmp = make_array(grammar.indent["block-level"].keywords);
                    
                    // build a lookup hashmap
                    var bks = {};
                    for (i=0, l=tmp.length; i<l; i++ )  bks[ tmp[i] ] = true;
                    
                    grammar.indent["block-level"].keywords = bks;
                    
                    hasIndent = true;
                }
                else
                {
                    grammar.indent["block-level"].keywords = {};
                }
                
                if (grammar.indent["block-level"].delims)
                {
                    tmp = make_array(grammar.indent["block-level"].delims);
                    
                    // build a start/end mapping
                    start=[]; end=[];
                    
                    if (is_array(tmp) && !is_array(tmp[0])) tmp = [tmp]; // array of arrays
                    
                    for (i=0, l=tmp.length; i<l; i++)
                    {
                        t1 = getRegexp( tmp[i][0], RegExpID );
                        t2 = (tmp[i][1]) ? getRegexp( tmp[i][1], RegExpID ) : t1;
                        start.push( t1 );
                        end.push( t2 );
                    }
                    
                    grammar.indent["block-level"].delims = { start: start, end: end };
                    
                    hasIndent = true;
                }
                else
                {
                    grammar.indent["block-level"].delims = { start: null, end: null };
                }
                    
                if (grammar.indent["statement-level"].delims)
                {
                    grammar.indent["statement-level"].delims = make_array(grammar.indent["statement-level"].delims);
                    hasIndent = true;
                }
                else
                {
                    grammar.indent["statement-level"].delims = [];
                }
            }
            else
            {
                grammar.indent = null;
            }
            grammar.hasIndent = hasIndent;*/
            
            grammar.TokenOrder = _tokens;
            grammar.Style = Style;
            grammar.Lex = Lex;
            grammar.Syntax = null;
            grammar.Indentation = null;
            grammar.hasIndent = false;
            
            // this grammar is parsed
            grammar.__parsed = true;
            
            return grammar;
        },
        
        // get a codemirror syntax-highlight mode from a grammar
        getMode : function(grammar, base, DEFAULT) {
            
            // build the grammar, ( grammar can extend another 'base' grammar ;) )
            grammar = self.parseGrammar(grammar, base);
            
            //console.log(grammar);
            
            var 
                LOCALS = { 
                    // default return code, when no match found
                    // 'null' should be used in most cases
                    DEFAULT: DEFAULT || null 
                },
                tokenBase,  token, indentation
            ;
            
            // markup-like grammar
            if (T_MARKUP_LIKE == grammar.type)
            {
                tokenBase = tokenBaseMLFactory(grammar, LOCALS);
            }
            // programming-like grammar
            else
            {
                tokenBase = tokenBaseFactory(grammar, LOCALS);
            }
            token = tokenFactory(tokenBase, grammar, LOCALS);
            indentation = indentationFactory(LOCALS);
            
            // generate parser with token factories (grammar, LOCALS are available locally by closures)
            return function(conf, parserConf) {
                
                LOCALS.conf = conf;
                LOCALS.parserConf = parserConf;
                
                // return the (codemirror) parser mode for the grammar
                return  {
                    startState: function( basecolumn ) {
                        
                        LOCALS.basecolumn = basecolumn || 0;
                        
                        return {
                            tokenize : null,
                            lastToken : T_DEFAULT
                        };
                    },
                    
                    token: token,
                    
                    indent: indentation
                };
            };
        }
    };
