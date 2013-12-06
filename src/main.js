    
    var 
        parse = function(grammar) {
            var RegExpID, RegExpGroups, tokens, numTokens, _tokens, 
                Style, Lex, Syntax, t, tokenID, token, tok,
                parsedRegexes = {}, parsedMatchers = {}, parsedTokens = {};
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if ( grammar.__parsed )  return grammar;
            
            grammar = extend(grammar, defaultGrammar);
            
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            
            RegExpGroups = grammar.RegExpGroups || {};
            grammar.RegExpGroups = null;
            delete grammar.RegExpGroups;
            
            Lex = grammar.Lex || {};
            grammar.Lex = null;
            delete grammar.Lex;
            
            Syntax = grammar.Syntax || {};
            grammar.Syntax = null;
            delete grammar.Syntax;
            
            Style = grammar.Style || {};
            
            _tokens = grammar.Parser || [];
            numTokens = _tokens.length;
            tokens = [];
            
            
            // build tokens
            for (t=0; t<numTokens; t++)
            {
                tokenID = _tokens[ t ];
                
                token = getTokenizer( tokenID, RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens ) || null;
                
                if ( token )
                {
                    if ( T_ARRAY == get_type( token ) )
                        tokens = tokens.concat( token );
                    
                    else
                        tokens.push( token );
                }
            }
            
            grammar.Parser = tokens;
            grammar.Style = Style;
            
            // this grammar is parsed
            grammar.__parsed = true;
            
            return grammar;
        }
    ;
    
    //
    //  CodeMirror Grammar main class
    
    var self = {
        
        VERSION : VERSION,
        
        init : function(RegExAnalyzer) {
            RegexAnalyzer = RegExAnalyzer;
        },
        
        // extend a grammar using another base grammar
        extend : extend,
        
        // parse a grammar
        parse : parse,
        
        // get a codemirror syntax-highlight mode from a grammar
        getMode : function(grammar, DEFAULT) {
            
            // build the grammar
            grammar = parse( grammar );
            
            //console.log(grammar);
            
            var 
                LOCALS = { 
                    // default return code, when no match or empty found
                    // 'null' should be used in most cases
                    DEFAULT: DEFAULT || null
                },
                parser, indentation
            ;
            
            parser = parserFactory( grammar, LOCALS );
            indentation = indentationFactory( LOCALS );
            
            // generate parser with token factories (grammar, LOCALS are available locally by closures)
            return function(conf, parserConf) {
                
                LOCALS.conf = conf;
                LOCALS.parserConf = parserConf;
                
                // return the (codemirror) parser mode for the grammar
                return  {
                    startState: function( basecolumn ) {
                        
                        LOCALS.basecolumn = basecolumn || 0;
                        
                        return {
                            stack : null,
                            currentToken : T_DEFAULT
                        };
                    },
                    
                    token: parser,
                    
                    indent: indentation
                };
            };
        }
    };
