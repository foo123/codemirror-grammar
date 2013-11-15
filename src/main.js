    
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
            var t1, t2, i, l, RegExpID, RegExpGroups;
            
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
            
            // comments
            if (grammar.comments)
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
                grammar.comments = (t1.length) ? getStartEndMatchersFor(t1, RegExpID) : { start: null, end: null };
            }
            else
            {
                grammar.comments = { start: null, end: null };
            }
                
            // general blocks ( 3 types ), eg. heredocs, cdata, etc..
            grammar.blocks = (grammar.blocks) ? getStartEndMatchersFor(grammar.blocks, RegExpID) : { start: null, end: null };
            grammar.blocks2 = (grammar.blocks2) ? getStartEndMatchersFor(grammar.blocks2, RegExpID) : { start: null, end: null };
            grammar.blocks3 = (grammar.blocks3) ? getStartEndMatchersFor(grammar.blocks3, RegExpID) : { start: null, end: null };
            
            // strings ( 3 string types )
            grammar.strings = (grammar.strings) ? getStartEndMatchersFor(grammar.strings, RegExpID) : { start: null, end: null };
            grammar.strings2 = (grammar.strings2) ? getStartEndMatchersFor(grammar.strings2, RegExpID) : { start: null, end: null };
            grammar.strings3 = (grammar.strings3) ? getStartEndMatchersFor(grammar.strings3, RegExpID) : { start: null, end: null };
            
            // general identifiers ( 5 identifier types ), eg. variables, etc..
            grammar.identifiers = (grammar.identifiers) ? getMatchersFor(grammar.identifiers, RegExpID, RegExpGroups['identifiers']) : null;
            grammar.identifiers2 = (grammar.identifiers2) ? getMatchersFor(grammar.identifiers2, RegExpID, RegExpGroups['identifiers2']) : null;
            grammar.identifiers3 = (grammar.identifiers3) ? getMatchersFor(grammar.identifiers3, RegExpID, RegExpGroups['identifiers3']) : null;
            grammar.identifiers4 = (grammar.identifiers4) ? getMatchersFor(grammar.identifiers4, RegExpID, RegExpGroups['identifiers4']) : null;
            grammar.identifiers5 = (grammar.identifiers5) ? getMatchersFor(grammar.identifiers5, RegExpID, RegExpGroups['identifiers5']) : null;
            
            // numbers ( 3 number types )
            grammar.numbers = (grammar.numbers) ? getMatchersFor(grammar.numbers, RegExpID, RegExpGroups['numbers']) : null;
            grammar.numbers2 = (grammar.numbers2) ? getMatchersFor(grammar.numbers2, RegExpID, RegExpGroups['numbers2']) : null;
            grammar.numbers3 = (grammar.numbers3) ? getMatchersFor(grammar.numbers3, RegExpID, RegExpGroups['numbers3']) : null;
            
            // atoms
            grammar.atoms = (grammar.atoms) ? getMatchersFor(grammar.atoms, RegExpID, RegExpGroups['atoms']) : null;
            
            // meta
            grammar.meta = (grammar.meta) ? getMatchersFor(grammar.meta, RegExpID, RegExpGroups['meta']) : null;
            
            // defs
            grammar.defines = (grammar.defines) ? getMatchersFor(grammar.defines, RegExpID, RegExpGroups['defines']) : null;
            
            // keywords
            grammar.keywords = (grammar.keywords) ? getMatchersFor(grammar.keywords, RegExpID, RegExpGroups['keywords']) : null;
            
            // builtins
            grammar.builtins = (grammar.builtins) ? getMatchersFor(grammar.builtins, RegExpID, RegExpGroups['builtins']) : null;
            
        
            // operators
            if (!grammar.operators) grammar.operators = { one: null, two: null, words: null };
            grammar.operators.one = (grammar.operators.one) ? getMatchersFor(grammar.operators.one, RegExpID, RegExpGroups['operators'] && RegExpGroups['operators']['one']) : null;
            grammar.operators.two = (grammar.operators.two) ? getMatchersFor(grammar.operators.two, RegExpID, RegExpGroups['operators'] && RegExpGroups['operators']['two']) : null;
            grammar.operators.words = (grammar.operators.words) ? getMatchersFor(grammar.operators.words, RegExpID, RegExpGroups['operators'] && RegExpGroups['operators']['words']) : null;
            
            // delimiters
            if (!grammar.delimiters) grammar.delimiters = { one: null, two: null, three: null };
            grammar.delimiters.one = (grammar.delimiters.one) ? getMatchersFor(grammar.delimiters.one, RegExpID, RegExpGroups['delimiters'] && RegExpGroups['delimiters']['one']) : null;
            grammar.delimiters.two = (grammar.delimiters.two) ? getMatchersFor(grammar.delimiters.two, RegExpID, RegExpGroups['delimiters'] && RegExpGroups['delimiters']['two']) : null;
            grammar.delimiters.three = (grammar.delimiters.three) ? getMatchersFor(grammar.delimiters.three, RegExpID, RegExpGroups['delimiters'] && RegExpGroups['delimiters']['three']) : null;
            
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
            
            console.log(grammar);
            
            var LOCALS = { 
                // default return code, when no match found
                // 'null' should be used in most cases
                DEFAULT: DEFAULT || null 
            };
            
            // generate parser with token factories (closures make grammar, LOCALS etc.. available locally)
            return function(conf, parserConf) {
                
                var tokenBase = tokenBaseFactory(grammar, LOCALS, conf, parserConf);
                var token = tokenFactory(tokenBase, grammar, LOCALS, conf, parserConf);
                var indentation = indentationFactory(LOCALS, conf, parserConf);
                
                // return the parser for the grammar
                parser =  {
                    
                    startState: function(basecolumn) {
                          
                          LOCALS.basecolumn = basecolumn;
                          
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
    };
