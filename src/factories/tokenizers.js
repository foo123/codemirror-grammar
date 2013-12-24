    
    //
    // tokenizer factories
    var
        SimpleToken = Class({
            
            constructor : function(name, token, style) {
                this.tt = T_SIMPLE;
                this.tn = name;
                this.t = token;
                this.r = style;
                this.required = 0;
                this.ERR = 0;
                this.toClone = ['t', 'r'];
            },
            
            // tokenizer/token name
            tn : null,
            // tokenizer type
            tt : null,
            // tokenizer token matcher
            t : null,
            // tokenizer return val
            r : null,
            required : 0,
            ERR : 0,
            streamPos : null,
            stackPos : null,
            toClone: null,
            actionBefore : null,
            actionAfter : null,
            
            get : function( stream, state ) {
                if ( this.t.get(stream) ) { state.t = this.tt; return this.r; }
                return false;
            },
            
            require : function(bool) { 
                this.required = (bool) ? 1 : 0;
                return this;
            },
            
            push : function(stack, token, i) {
                if ( this.stackPos ) stack.splice( this.stackPos+(i||0), 0, token );
                else stack.push( token );
                return this;
            },
            
            clone : function() {
                var t, toClone = this.toClone, toClonelen;
                
                t = new this.$class();
                t.tt = this.tt;
                t.tn = this.tn;
                t.streamPos = this.streamPos;
                t.stackPos = this.stackPos;
                t.actionBefore = this.actionBefore;
                t.actionAfter = this.actionAfter;
                //t.required = this.required;
                //t.ERR = this.ERR;
                
                if (toClone && toClone.length)
                {
                    toClonelen = toClone.length;
                    for (var i=0; i<toClonelen; i++)   
                        t[ toClone[i] ] = this[ toClone[i] ];
                }
                return t;
            },
            
            toString : function() {
                return ['[', 'Tokenizer: ', this.tn, ', Matcher: ', ((this.t) ? this.t.toString() : null), ']'].join('');
            }
        }),
        
        BlockToken = Class(SimpleToken, {
            
            constructor : function(type, name, token, style, allowMultiline, escChar) {
                this.$super('constructor', name, token, style);
                this.tt = type;
                // a block is multiline by default
                this.mline = ( T_UNDEF & get_type(allowMultiline) ) ? 1 : allowMultiline;
                this.esc = escChar || "\\";
                this.toClone = ['t', 'r', 'mline', 'esc'];
            },    
            
            mline : 0,
            esc : null,
            
            get : function( stream, state ) {
            
                var ended = 0, found = 0, endBlock, next = "", continueToNextLine,
                    allowMultiline = this.mline, startBlock = this.t, thisBlock = this.tn,
                    charIsEscaped = 0, isEscapedBlock = (T_ESCBLOCK == this.tt), escChar = this.esc
                ;
                
                if ( state.inBlock == thisBlock )
                {
                    found = 1;
                    endBlock = state.endBlock;
                }    
                else if ( !state.inBlock && (endBlock = startBlock.get(stream)) )
                {
                    found = 1;
                    state.inBlock = thisBlock;
                    state.endBlock = endBlock;
                }    
                
                if ( found )
                {
                    this.stackPos = state.stack.length;
                    ended = endBlock.get(stream);
                    continueToNextLine = allowMultiline;
                    
                    while ( !ended && !stream.eol() ) 
                    {
                        //next = stream.nxt();
                        if ( !(isEscapedBlock && charIsEscaped) && endBlock.get(stream) ) 
                        {
                            ended = 1; 
                            break;
                        }
                        else
                        {
                            next = stream.nxt();
                        }
                        charIsEscaped = !charIsEscaped && next == escChar;
                    }
                    continueToNextLine = allowMultiline && (!isEscapedBlock || charIsEscaped);
                    
                    if ( ended || !continueToNextLine )
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    else
                    {
                        this.push( state.stack, this );
                    }
                    
                    state.t = this.tt;
                    return this.r;
                }
                
                state.inBlock = null;
                state.endBlock = null;
                return false;
            }
        }),
                
        ZeroOrOneTokens = Class(SimpleToken, {
                
            constructor : function( name, tokens ) {
                this.tt = T_ZEROORONE;
                this.tn = name || null;
                this.t = null;
                this.ts = null;
                this.foundOne = 0;
                this.toClone = ['ts', 'foundOne'];
                if (tokens) this.makeToks( tokens );
            },
            
            ts : null,
            foundOne : 0,
            
            makeToks : function( tokens ) {
                if ( tokens ) this.ts = make_array( tokens );
                return this;
            },
            
            get : function( stream, state ) {
            
                var i, token, style, tokens = this.ts, n = tokens.length, tokensErr = 0, ret = false;
                
                this.ERR = this.foundOne;
                // already found one, no more
                if ( this.ERR ) return false;
                
                // this is optional
                this.required = 0;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i];
                    style = token.get(stream, state);
                    
                    if ( false !== style )
                    {
                        // push it to the stack for more
                        this.foundOne = 1;
                        this.push( state.stack, this.clone() );
                        this.foundOne = 0;
                        return style;
                    }
                    else if ( token.ERR )
                    {
                        tokensErr++;
                        stream.bck2( this.streamPos );
                    }
                }
                
                //this.ERR = (n == tokensErr) ? true : false;
                return false;
            }
        }),
        
        ZeroOrMoreTokens = Class(ZeroOrOneTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens);
                this.tt = T_ZEROORMORE;
            },
            
            get : function( stream, state ) {
            
                var i, token, style, tokens = this.ts, n = tokens.length, tokensErr = 0, ret = false;
                
                // this is optional
                this.required = 0;
                this.ERR = 0;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i];
                    style = token.get(stream, state);
                    
                    if ( false !== style )
                    {
                        // push it to the stack for more
                        this.push( state.stack, this );
                        return style;
                    }
                    else if ( token.ERR )
                    {
                        tokensErr++;
                        stream.bck2( this.streamPos );
                    }
                }
                
                //this.ERR = (n == tokensErr) ? true : false;
                return false;
            }
        }),
        
        OneOrMoreTokens = Class(ZeroOrOneTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens);
                this.tt = T_ONEORMORE;
                this.foundOne = 0;
            },
            
            get : function( stream, state ) {
        
                var style, token, i, tokens = this.ts, n = tokens.length, tokensRequired = 0, tokensErr = 0;
                
                this.required = !this.foundOne;
                this.ERR = 0;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i];
                    style = token.get(stream, state);
                    
                    tokensRequired += (token.required) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        this.foundOne = 1;
                        this.required = 0;
                        this.ERR = 0;
                        // push it to the stack for more
                        this.push( state.stack, this.clone() );
                        this.foundOne = 0;
                        
                        return style;
                    }
                    else if ( token.ERR )
                    {
                        tokensErr++;
                        stream.bck2( this.streamPos );
                    }
                }
                
                this.ERR = (!this.foundOne /*|| n == tokensErr*/) ? 1 : 0;
                return false;
            }
        }),
        
        EitherTokens = Class(ZeroOrOneTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens);
                this.tt = T_EITHER;
            },
            
            get : function( stream, state ) {
            
                var style, token, i, tokens = this.ts, n = tokens.length, tokensRequired = 0, tokensErr = 0;
                
                this.required = 1;
                this.ERR = 0;
                this.streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i];
                    style = token.get(stream, state);
                    
                    tokensRequired += (token.required) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        return style;
                    }
                    else if ( token.ERR )
                    {
                        tokensErr++;
                        stream.bck2( this.streamPos );
                    }
                }
                
                this.required = (tokensRequired > 0) ? 1 : 0;
                this.ERR = (n == tokensErr && tokensRequired > 0) ? 1 : 0;
                return false;
            }
        }),
                
        AllTokens = Class(ZeroOrOneTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens);
                this.tt = T_ALL;
            },
            
            get : function( stream, state ) {
                
                var token, style, tokens = this.ts, n = tokens.length, ret = false;
                
                this.required = 1;
                this.ERR = 0;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                
                token = tokens[ 0 ];
                style = token.require(0).get(stream, state);
                
                if ( false !== style )
                {
                    this.stackPos = state.stack.length;
                    for (var i=n-1; i>0; i--)
                        this.push( state.stack, tokens[i].require(1), n-i );
                    
                    ret = style;
                    
                }
                else if ( token.ERR )
                {
                    this.ERR = 1;
                    stream.bck2( this.streamPos );
                }
                else if ( token.required )
                {
                    this.ERR = 1;
                }
                
                return ret;
            }
        }),
                
        NGramToken = Class(ZeroOrOneTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens);
                this.tt = T_NGRAM;
            },
            
            get : function( stream, state ) {
                
                var token, style, tokens = this.ts, n = tokens.length, ret = false;
                
                this.required = 0;
                this.ERR = 0;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                
                token = tokens[ 0 ];
                style = token.require(0).get(stream, state);
                
                if ( false !== style )
                {
                    this.stackPos = state.stack.length;
                    for (var i=n-1; i>0; i--)
                        this.push( state.stack, tokens[i].require(1), n-i );
                    
                    ret = style;
                }
                else if ( token.ERR )
                {
                    //this.ERR = 1;
                    stream.bck2( this.streamPos );
                }
                
                return ret;
            }
        }),
                
        getTokenizer = function(tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, comments, keywords) {
            
            if ( !cachedTokens[ tokenID ] )
            {
                var tok, token = null, type, combine, action, matchType, tokens, T;
            
                tok = Lex[ tokenID ] || Syntax[ tokenID ] || null;
                
                if ( tok )
                {
                    T = get_type( tok );
                    // tokens given directly, no token configuration object, wrap it
                    if ( (T_STR | T_ARRAY) & T )
                    {
                        tok = { type: "simple", tokens: tok };
                    }
                    
                    // provide some defaults
                    //type = tok.type || "simple";
                    type = (tok.type) ? tokenTypes[ tok.type.toUpperCase().replace('-', '').replace('_', '') ] : T_SIMPLE;
                    tok.tokens = make_array( tok.tokens );
                    action = tok.action || null;
                    
                    if ( T_SIMPLE & type )
                    {
                        if ( tok.autocomplete ) getAutoComplete(tok, tokenID, keywords);
                        
                        // combine by default if possible using word-boundary delimiter
                        combine = ( 'undefined' ===  typeof(tok.combine) ) ? "\\b" : tok.combine;
                        token = new SimpleToken( 
                                    tokenID,
                                    getCompositeMatcher( tokenID, tok.tokens.slice(), RegExpID, combine, cachedRegexes, cachedMatchers ), 
                                    Style[ tokenID ] || DEFAULTSTYLE
                                );
                    }
                    
                    else if ( T_BLOCK & type )
                    {
                        if ( T_COMMENT & type ) getComments(tok, comments);

                        token = new BlockToken( 
                                    type,
                                    tokenID,
                                    getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
                                    Style[ tokenID ] || DEFAULTSTYLE,
                                    tok.multiline,
                                    tok.escape
                                );
                    }
                    
                    else if ( T_GROUP & type )
                    {
                        matchType = groupTypes[ tok.match.toUpperCase() ]; 
                        tokens = tok.tokens.slice();
                        
                        for (var i=0, l=tokens.length; i<l; i++)
                            tokens[i] = getTokenizer( tokens[i], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, comments, keywords );
                        
                        if (T_ZEROORONE & matchType) 
                            token = new ZeroOrOneTokens(tokenID, tokens);
                        
                        else if (T_ZEROORMORE & matchType) 
                            token = new ZeroOrMoreTokens(tokenID, tokens);
                        
                        else if (T_ONEORMORE & matchType) 
                            token = new OneOrMoreTokens(tokenID, tokens);
                        
                        else if (T_EITHER & matchType) 
                            token = new EitherTokens(tokenID, tokens);
                        
                        else //if (T_ALL == matchType)
                            token = new AllTokens(tokenID, tokens);
                    }
                    
                    else if ( T_NGRAM & type )
                    {
                        // get n-gram tokenizer
                        token = make_array_2( tok.tokens.slice() ).slice(); // array of arrays
                        
                        for (var i=0, l=token.length; i<l; i++)
                        {
                            // get tokenizers for each ngram part
                            var ngram = token[i];
                            
                            for (var j=0, l2=ngram.length; j<l2; j++)
                                ngram[j] = getTokenizer( ngram[j], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, comments, keywords );
                            
                            // get a tokenizer for whole ngram
                            token[i] = new NGramToken( tokenID + '_NGRAM_' + i, ngram );
                        }
                    }
                }
                cachedTokens[ tokenID ] = token;
            }
            
            return cachedTokens[ tokenID ];
        },
        
        getComments = function(tok, comments) {
            // build start/end mappings
            var tmp = make_array_2(tok.tokens.slice()); // array of arrays
            var start, end, lead;
            for (i=0, l=tmp.length; i<l; i++)
            {
                start = tmp[i][0];
                end = (tmp[i].length>1) ? tmp[i][1] : tmp[i][0];
                lead = (tmp[i].length>2) ? tmp[i][2] : "";
                
                if ( null === end )
                {
                    // line comment
                    comments.line = comments.line || [];
                    comments.line.push( start );
                }
                else
                {
                    // block comment
                    comments.block = comments.block || [];
                    comments.block.push( [start, end, lead] );
                }
            }
        },
        
        getAutoComplete = function(tok, type, keywords) {
            var kws = [].concat(make_array(tok.tokens)).map(function(word) { return { word: word, meta: type }; });
            keywords.autocomplete = concat.apply( keywords.autocomplete || [], kws );
        },
        
        parseGrammar = function(grammar) {
            var RegExpID, tokens, numTokens, _tokens, 
                Style, Lex, Syntax, t, tokenID, token, tok,
                cachedRegexes, cachedMatchers, cachedTokens, comments, keywords;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if ( grammar.__parsed ) return grammar;
            
            cachedRegexes = {}; cachedMatchers = {}; cachedTokens = {}; comments = {}; keywords = {};
            grammar = extend(grammar, defaultGrammar);
            
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            
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
                
                token = getTokenizer( tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, comments, keywords ) || null;
                
                if ( token )
                {
                    if ( T_ARRAY & get_type( token ) )  tokens = tokens.concat( token );
                    
                    else  tokens.push( token );
                }
            }
            
            grammar.Parser = tokens;
            grammar.Style = Style;
            grammar.Comments = comments;
            grammar.Keywords = keywords;
            
            // this grammar is parsed
            grammar.__parsed = 1;
            
            return grammar;
        }
    ;
  