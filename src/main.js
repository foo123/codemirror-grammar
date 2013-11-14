    
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
            // todo
            return null;
        },
        
        parseProgrammingLikeGrammar : function(grammar, base) {
            var i, l, tmp, t1, t2, RegExpID, start, end;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if (grammar.__parsed)  return grammar;
            
            grammar = extend(grammar, base);
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            
            // comments
            if (grammar.comments)
            {
                // build comments start/end mappings
                start=[]; end=[];
                
                if (grammar.comments.line)  
                {
                    tmp = make_array(grammar.comments.line);
                    
                    for (i=0, l=tmp.length; i<l; i++)
                    {
                        start.push( getRegexp( tmp[i], RegExpID ) );
                        end.push( null );
                    }
                }
                if (grammar.comments.block)  
                {
                    tmp = make_array(grammar.comments.block);
                    
                    t1 = getRegexp( tmp[0], RegExpID );
                    t2 = (tmp[1]) ? getRegexp( tmp[1], RegExpID ) : t1;
                    start.push( t1 );
                    end.push( t2 );
                }
                
                grammar.comments = { start: start, end: end };
            }
            else
            {
                grammar.comments = { start: null, end: null };
            }
                
            // heredocs
            if (grammar.heredoc && grammar.heredoc.length)
            {
                // build heredoc start/end mappings
                start=[]; end=[];
                
                tmp = grammar.heredoc;
                
                if (is_array(tmp) && !is_array(tmp[0])) tmp = [tmp];  // array of arrays
                
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getRegexp( tmp[i][0], RegExpID );
                    t2 = (tmp[i][1]) ? getRegexp( tmp[i][1], RegExpID ) : t1;
                    start.push( t1 );
                    end.push( t2 );
                }
                
                grammar.heredoc = {start: start, end: end};
            }
            else
            {
                grammar.heredoc = {start: null, end: null};
            }
            
            // identifiers
            if (grammar.identifiers)
            {
                tmp = make_array(grammar.identifiers);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.identifiers = tmp
            }
            if (grammar.identifiers2)
            {
                tmp = make_array(grammar.identifiers2);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.identifiers2 = tmp
            }
            if (grammar.identifiers3)
            {
                tmp = make_array(grammar.identifiers3);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.identifiers3 = tmp;
            }
            if (grammar.identifiers4)
            {
                tmp = make_array(grammar.identifiers4);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.identifiers4 = tmp;
            }
            if (grammar.identifiers5)
            {
                tmp = make_array(grammar.identifiers5);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.identifiers5 = tmp;
            }
            
            // numbers
            if (grammar.numbers)
            {
                tmp = make_array(grammar.numbers);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.numbers = tmp;
            }
            if (grammar.numbers2)
            {
                tmp = make_array(grammar.numbers2);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.numbers2 = tmp;
            }
            if (grammar.numbers3)
            {
                tmp = make_array(grammar.numbers3);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.numbers3 = tmp;
            }
            
            // strings
            if (grammar.strings) 
            {
                // build strings start/end mappings
                start=[]; end=[];
                tmp = make_array(grammar.strings);
                if ( !is_array(tmp[0]) ) tmp = [tmp]; // array of arrays
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getRegexp( tmp[i][0], RegExpID );
                    t2 = (tmp[i][1]) ? getRegexp( tmp[i][1], RegExpID ) : t1;
                    start.push( t1 );
                    end.push( t2 );
                }
                grammar.strings = { start: start, end: end };
            }
            else
            {
                grammar.strings = { start: null, end: null };
            }
            if (grammar.strings2) 
            {
                // build strings start/end mappings
                start=[]; end=[];
                tmp = make_array(grammar.strings2);
                if ( !is_array(tmp[0]) ) tmp = [tmp]; // array of arrays
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getRegexp( tmp[i][0], RegExpID );
                    t2 = (tmp[i][1]) ? getRegexp( tmp[i][1], RegExpID ) : t1;
                    start.push( t1 );
                    end.push( t2 );
                }
                grammar.strings2 = { start: start, end: end };
            }
            else
            {
                grammar.strings2 = { start: null, end: null };
            }
            if (grammar.strings3) 
            {
                // build strings start/end mappings
                start=[]; end=[];
                tmp = make_array(grammar.strings3);
                if ( !is_array(tmp[0]) ) tmp = [tmp]; // array of arrays
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getRegexp( tmp[i][0], RegExpID );
                    t2 = (tmp[i][1]) ? getRegexp( tmp[i][1], RegExpID ) : t1;
                    start.push( t1 );
                    end.push( t2 );
                }
                grammar.strings3 = { start: start, end: end };
            }
            else
            {
                grammar.strings3 = { start: null, end: null };
            }
            
            // keywords, builtins, etc..
            grammar.atoms = (grammar.atoms) ? getCombinedRegexp( make_array(grammar.atoms) ) : null;
            grammar.defines = (grammar.defines) ? getCombinedRegexp( make_array(grammar.defines) ) : null;
            grammar.meta = (grammar.meta) ? getCombinedRegexp( make_array(grammar.meta) ) : null;
            grammar.keywords = (grammar.keywords) ? getCombinedRegexp( make_array(grammar.keywords) ) : null;
            grammar.builtins = (grammar.builtins) ? getCombinedRegexp( make_array(grammar.builtins) ) : null;
        
            // operators
            if (!grammar.operators) grammar.operators = { one: null, two: null, words: null };
            grammar.operators.one = (grammar.operators.one) ? getCombinedRegexp( make_array(grammar.operators.one) ) : null;
            grammar.operators.two = (grammar.operators.two) ? getCombinedRegexp( make_array(grammar.operators.two) ) : null;
            grammar.operators.words = (grammar.operators.words) ? getCombinedRegexp( make_array(grammar.operators.words) ) : null;
            
            // delimiters
            if (!grammar.delimiters) grammar.delimiters = { one: null, two: null, three: null };
            grammar.delimiters.one = (grammar.delimiters.one) ? getCombinedRegexp( make_array(grammar.delimiters.one) ) : null;
            grammar.delimiters.two = (grammar.delimiters.two) ? getCombinedRegexp( make_array(grammar.delimiters.two) ) : null;
            grammar.delimiters.three = (grammar.delimiters.three) ? getCombinedRegexp( make_array(grammar.delimiters.three) ) : null;
            
            // types of indent etc..
            var hasIndent = false;
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
            grammar.hasIndent = hasIndent;
            
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
            
            // generate parser with token factories (closures make grammar, LOCALS etc.. available locally)
            return function(conf, parserConf) {
                
                var tokenBase = tokenBaseFactory(grammar, LOCALS, conf, parserConf);
                var token = tokenFactory(tokenBase, grammar, LOCALS, conf, parserConf);
                var indentation = indentationFactory(tokenBase, grammar, LOCALS, conf, parserConf);
                
                // return the parser for the grammar
                parser =  {
                    
                    startState: function(basecolumn) {
                          
                          LOCALS.basecolumn = basecolumn;
                          
                          return {
                              tokenize : null
                          };
                    },
                    
                    token: token,

                    indent: indentation
                    
                };
                
                return parser;
            };
        }
    };
