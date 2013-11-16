    
    //
    //  CodeMirror Grammar main class
    
    var self = {
        
        VERSION : VERSION,
        
        parseGrammar : function(grammar, base) {
            if (grammar.type && "markup-like" == grammar.type)
            {
                return self.parseMarkupLikeGrammar(grammar, base || markupLikeGrammar);
            }
            else
            {
                return self.parseProgrammingLikeGrammar(grammar, base || programmingLikeGrammar);
            }
        },
        
        parseMarkupLikeGrammar : function(grammar, base) {
            var t1, t2, i, l, RegExpID, RegExpGroups, 
                tokens, numTokens, Style, _tokens = [], 
                tokid, ll, tok, toktype, tokstyle;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if (grammar.__parsed)  return grammar;
            
            grammar = extend(grammar, base);
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            RegExpGroups = grammar.RegExpGroups || {};
            grammar.RegExpGroups = null;
            delete grammar.RegExpGroups;
            
            grammar.type = T_MARKUP_LIKE;
            
            tokens = grammar.TokenOrder || [];
            numTokens = tokens.length;
            
            Style = grammar.Style || {};
            
            for (t=0; t<numTokens; t++)
            {
                tokid = tokens[t];
                
                if ( !grammar[tokid] ) continue;
                
                tok = null;
                
                // comments
                if ("comments"==tokid)
                {
                    t1 = [];
                    if (grammar.comments.line)  
                    {
                        t2 = make_array(grammar.comments.line);
                        
                        for (i=0, l=t2.length; i<l; i++)
                            t1.push( [t2[i], null] );
                    }
                    if (grammar.comments.block)  
                    {
                        t2 = make_array(grammar.comments.block);
                        t1.push( [t2[0], ((t2[1]) ? t2[1] : t2[0])] );
                    }
                    tok = (t1.length) ? getBlockMatcher(t1, RegExpID) : null;
                    toktype = T_COMMENT;
                    tokstyle = Style.comment;
                }
                
                // general blocks ( 5 types ), eg. heredocs, cdata, etc..
                else if ("blocks"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block;
                }
                else if ("blocks2"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks2, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block2;
                }
                else if ("blocks3"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks3, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block3;
                }
                else if ("blocks4"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks4, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block4;
                }
                else if ("blocks5"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks5, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block5;
                }
                
                // tags ( 3 types )
                else if ("tags"==tokid)
                {
                    t1 = [];
                    t2 = [];
                    var tmp = make_array(grammar.tags);
                    for (i=0, l=tmp.length; i<l; i++)
                    {
                        t1.push( [ tmp[i][0], tmp[i][1] ] );
                        t2 = t2.concat( tmp[i][2] );
                    }
                    t1 = getBlockMatcher(t1, RegExpID) || null;
                    t2 = getCompositeMatcher(t2, RegExpID, RegExpGroups['tags']) || null;
                    tok = t1;
                    toktype = T_TAG;
                    tokstyle = Style.tag;
                    grammar.tagNames = t2;
                }
                else if ("tags2"==tokid)
                {
                    continue;
                }
                else if ("tags3"==tokid)
                {
                    continue;
                }
                
                // doctype
                else if ("doctype"==tokid)
                {
                    continue;
                }
                
                // strings ( 3 types )
                else if ("strings"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string;
                }
                else if ("strings2"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings2, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string2;
                }
                else if ("strings3"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings3, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string3;
                }
                
                // numbers ( 3 types )
                else if ("numbers"==tokid)
                {
                    tok = getCompositeMatcher(grammar.numbers, RegExpID, RegExpGroups['numbers']) || null;
                    toktype = T_NUMBER;
                    tokstyle = Style.number;
                }
                else if ("numbers2"==tokid)
                {
                    tok = getCompositeMatcher(grammar.numbers2, RegExpID, RegExpGroups['numbers2']) || null;
                    toktype = T_NUMBER;
                    tokstyle = Style.number2;
                }
                else if ("numbers3"==tokid)
                {
                    tok = getCompositeMatcher(grammar.numbers3, RegExpID, RegExpGroups['numbers3']) || null;
                    toktype = T_NUMBER;
                    tokstyle = Style.number3;
                }
                
                // general identifiers ( 5 types ), eg. variables, etc..
                else if ("identifiers"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers, RegExpID, RegExpGroups['identifiers']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier;
                }
                else if ("identifiers2"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers2, RegExpID, RegExpGroups['identifiers2']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier2;
                }
                else if ("identifiers3"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers3, RegExpID, RegExpGroups['identifiers3']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier3;
                }
                else if ("identifiers4"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers4, RegExpID, RegExpGroups['identifiers4']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier4;
                }
                else if ("identifiers5"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers5, RegExpID, RegExpGroups['identifiers5']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier5;
                }
                
                // atoms
                else if ("atoms"==tokid)
                {
                    tok = getCompositeMatcher(grammar.atoms, RegExpID, RegExpGroups['atoms']) || null;
                    toktype = T_ATOM;
                    tokstyle = Style.atom;
                }
                
                // meta
                else if ("meta"==tokid)
                {
                    tok = getCompositeMatcher(grammar.meta, RegExpID, RegExpGroups['meta']) || null;
                    toktype = T_META;
                    tokstyle = Style.meta;
                }
                
                // defs
                else if ("defines"==tokid)
                {
                    tok = getCompositeMatcher(grammar.defines, RegExpID, RegExpGroups['defines']) || null;
                    toktype = T_DEF;
                    tokstyle = Style.defines;
                }
                
                // keywords
                else if ("keywords"==tokid)
                {
                    tok = getCompositeMatcher(grammar.keywords, RegExpID, RegExpGroups['keywords']) || null;
                    toktype = T_KEYWORD;
                    tokstyle = Style.keyword;
                }
                
                // builtins
                else if ("builtins"==tokid)
                {
                    tok = getCompositeMatcher(grammar.builtins, RegExpID, RegExpGroups['builtins']) || null;
                    toktype = T_BUILTIN;
                    tokstyle = Style.builtin;
                }
                
                
                // operators
                else if ("operators"==tokid)
                {
                    continue;
                }
                // delimiters
                else if ("delimiters"==tokid)
                {
                    continue;
                }
                
                if (tok)
                {
                    grammar[tokid] = tok;
                    _tokens.push( [ tok, toktype, tokstyle ] );
                }
                else
                {
                    grammar[tokid] = null;
                }
            }
            
            grammar.TokenOrder = _tokens;
            
            // attributes ( 3 types )
            grammar.attributes = (grammar.attributes) ? getCompositeMatcher(grammar.attributes, RegExpID, RegExpGroups['attributes']) : null;
            grammar.attributes2 = (grammar.attributes2) ? getCompositeMatcher(grammar.attributes2, RegExpID, RegExpGroups['attributes2']) : null;
            grammar.attributes3 = (grammar.attributes3) ? getCompositeMatcher(grammar.attributes3, RegExpID, RegExpGroups['attributes3']) : null;
            // assignments, eg for attributes
            grammar.assignments = (grammar.assignments) ? getCompositeMatcher(grammar.assignments, RegExpID, RegExpGroups['assignments']) : null;
            
            grammar.indent = null;
            grammar.hasIndent = false;
            
            // this grammar is parsed
            grammar.__parsed = true;
            
            return grammar;
        },
        
        parseProgrammingLikeGrammar : function(grammar, base) {
            var t1, t2, i, l, RegExpID, RegExpGroups, 
                tokens, numTokens, Style, _tokens = [], 
                tokid, ll, tok, toktype, tokstyle;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if (grammar.__parsed)  return grammar;
            
            grammar = extend(grammar, base);
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            RegExpGroups = grammar.RegExpGroups || {};
            grammar.RegExpGroups = null;
            delete grammar.RegExpGroups;
            
            grammar.type = T_PROGRAMMING_LIKE;
            
            tokens = grammar.TokenOrder || [];
            numTokens = tokens.length;
            
            Style = grammar.Style || {};
            
            for (t=0; t<numTokens; t++)
            {
                tokid = tokens[t];
                
                if ( !grammar[tokid] ) continue;
                
                tok = null;
                
                // comments
                if ("comments"==tokid)
                {
                    t1 = [];
                    if (grammar.comments.line)  
                    {
                        t2 = make_array(grammar.comments.line);
                        
                        for (i=0, l=t2.length; i<l; i++)
                            t1.push( [t2[i], null] );
                    }
                    if (grammar.comments.block)  
                    {
                        t2 = make_array(grammar.comments.block);
                        t1.push( [t2[0], ((t2[1]) ? t2[1] : t2[0])] );
                    }
                    tok = (t1.length) ? getBlockMatcher(t1, RegExpID) : null;
                    toktype = T_COMMENT;
                    tokstyle = Style.comment;
                }
                
                // general blocks ( 5 types ), eg. heredocs, cdata, etc..
                else if ("blocks"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block;
                }
                else if ("blocks2"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks2, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block2;
                }
                else if ("blocks3"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks3, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block3;
                }
                else if ("blocks4"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks4, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block4;
                }
                else if ("blocks5"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks5, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block5;
                }
                
                // strings ( 3 types )
                else if ("strings"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string;
                }
                else if ("strings2"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings2, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string2;
                }
                else if ("strings3"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings3, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string3;
                }
                
                // numbers ( 3 types )
                else if ("numbers"==tokid)
                {
                    tok = getCompositeMatcher(grammar.numbers, RegExpID, RegExpGroups['numbers']) || null;
                    toktype = T_NUMBER;
                    tokstyle = Style.number;
                }
                else if ("numbers2"==tokid)
                {
                    tok = getCompositeMatcher(grammar.numbers2, RegExpID, RegExpGroups['numbers2']) || null;
                    toktype = T_NUMBER;
                    tokstyle = Style.number2;
                }
                else if ("numbers3"==tokid)
                {
                    tok = getCompositeMatcher(grammar.numbers3, RegExpID, RegExpGroups['numbers3']) || null;
                    toktype = T_NUMBER;
                    tokstyle = Style.number3;
                }
                
                // general identifiers ( 5 types ), eg. variables, etc..
                else if ("identifiers"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers, RegExpID, RegExpGroups['identifiers']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier;
                }
                else if ("identifiers2"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers2, RegExpID, RegExpGroups['identifiers2']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier2;
                }
                else if ("identifiers3"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers3, RegExpID, RegExpGroups['identifiers3']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier3;
                }
                else if ("identifiers4"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers4, RegExpID, RegExpGroups['identifiers4']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier4;
                }
                else if ("identifiers5"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers5, RegExpID, RegExpGroups['identifiers5']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier5;
                }
                
                // atoms
                else if ("atoms"==tokid)
                {
                    tok = getCompositeMatcher(grammar.atoms, RegExpID, RegExpGroups['atoms']) || null;
                    toktype = T_ATOM;
                    tokstyle = Style.atom;
                }
                
                // meta
                else if ("meta"==tokid)
                {
                    tok = getCompositeMatcher(grammar.meta, RegExpID, RegExpGroups['meta']) || null;
                    toktype = T_META;
                    tokstyle = Style.meta;
                }
                
                // defs
                else if ("defines"==tokid)
                {
                    tok = getCompositeMatcher(grammar.defines, RegExpID, RegExpGroups['defines']) || null;
                    toktype = T_DEF;
                    tokstyle = Style.defines;
                }
                
                // keywords
                else if ("keywords"==tokid)
                {
                    tok = getCompositeMatcher(grammar.keywords, RegExpID, RegExpGroups['keywords']) || null;
                    toktype = T_KEYWORD;
                    tokstyle = Style.keyword;
                }
                
                // builtins
                else if ("builtins"==tokid)
                {
                    tok = getCompositeMatcher(grammar.builtins, RegExpID, RegExpGroups['builtins']) || null;
                    toktype = T_BUILTIN;
                    tokstyle = Style.builtin;
                }
                
                // operators
                else if ("operators"==tokid)
                {
                    tok = getCompositeMatcher(grammar.operators, RegExpID, RegExpGroups['operators']) || null;
                    toktype = T_OP;
                    tokstyle = Style.operator;
                }
                
                // delimiters
                else if ("delimiters"==tokid)
                {
                    tok = getCompositeMatcher(grammar.delimiters, RegExpID, RegExpGroups['delimiters']) || null;
                    toktype = T_DELIM;
                    tokstyle = Style.delimiter;
                }
                
                if (tok)
                {
                    grammar[tokid] = tok;
                    _tokens.push( [tok, toktype, tokstyle] );
                }
                else
                {
                    grammar[tokid] = null;
                }
            }
            
            grammar.TokenOrder = _tokens;
            
            // types of indent etc..
            /*var hasIndent = false;
            if (grammar.indent) 
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
            
            grammar.indent = null;
            grammar.hasIndent = false;
            
            // this grammar is parsed
            grammar.__parsed = true;
            
            return grammar;
        },
        
        getMode : function(grammar, base, DEFAULT) {
            
            // build the grammar, ( grammar can extend another 'base' grammar ;) )
            grammar = self.parseGrammar(grammar, base);
            
            //console.log(grammar);
            
            var LOCALS = { 
                // default return code, when no match found
                // 'null' should be used in most cases
                DEFAULT: DEFAULT || null 
            };
            
            // markup-like grammar
            if (T_MARKUP_LIKE == grammar.type)
            {
                // generate parser with token factories (closures make grammar, LOCALS etc.. available locally)
                return function(conf, parserConf) {
                    
                    var tokenBase = tokenBaseMLFactory(grammar, LOCALS, conf, parserConf);
                    var token = tokenFactory(tokenBase, grammar, LOCALS, conf, parserConf);
                    var indentation = indentationFactory(LOCALS, conf, parserConf);
                    
                    // return the parser for the grammar
                    parser =  {
                        
                        startState: function(basecolumn) {
                              
                              LOCALS.basecolumn = basecolumn || 0;
                              
                              return {
                                  tokenize : null,
                                  lastToken : T_DEFAULT
                              };
                        },
                        
                        token: token,

                        indent: indentation
                        
                    };
                    
                    return parser;
                };
            }
            // programming-like grammar
            else
            {
                // generate parser with token factories (closures make grammar, LOCALS etc.. available locally)
                return function(conf, parserConf) {
                    
                    var tokenBase = tokenBaseFactory(grammar, LOCALS, conf, parserConf);
                    var token = tokenFactory(tokenBase, grammar, LOCALS, conf, parserConf);
                    var indentation = indentationFactory(LOCALS, conf, parserConf);
                    
                    // return the parser for the grammar
                    parser =  {
                        
                        startState: function(basecolumn) {
                              
                              LOCALS.basecolumn = basecolumn || 0;
                              
                              return {
                                  tokenize : null,
                                  lastToken : T_DEFAULT
                              };
                        },
                        
                        token: token,

                        indent: indentation
                        
                    };
                    
                    return parser;
                };
            }
        }
    };
