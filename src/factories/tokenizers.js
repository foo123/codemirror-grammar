    
    //
    // tokenizer factories
    var
        SimpleToken = Class({
            
            constructor : function(name, token, style) {
                this.tt = (null===token) ? T_EOL : T_SIMPLE;
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
            toClone: null,
            //actionBefore : null,
            //actionAfter : null,
            
            get : function( stream, state ) {
                var token = this.t;
                // match EOL ( with possible leading spaces )
                if ( null === token ) 
                { 
                    stream.spc();
                    if ( stream.eol() )
                    {
                        state.t = T_DEFAULT; 
                        //state.r = this.r; 
                        return this.r; 
                    }
                }
                // else match a simple token
                else if ( token.get(stream) ) 
                { 
                    state.t = this.tt; 
                    //state.r = this.r; 
                    return this.r; 
                }
                return false;
            },
            
            require : function(bool) { 
                this.required = (bool) ? 1 : 0;
                return this;
            },
            
            push : function(stack, pos, token) {
                if ( pos ) stack.splice( pos, 0, token );
                else stack.push( token );
                return this;
            },
            
            clone : function() {
                var t, toClone = this.toClone, toClonelen;
                
                t = new this.$class();
                t.tt = this.tt;
                t.tn = this.tn;
                //t.actionBefore = this.actionBefore;
                //t.actionAfter = this.actionAfter;
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
                this.mline = ( 'undefined' == typeof(allowMultiline) ) ? 1 : allowMultiline;
                this.esc = escChar || "\\";
                this.toClone = ['t', 'r', 'mline', 'esc'];
            },    
            
            mline : 0,
            esc : null,
            
            get : function( stream, state ) {
            
                var ended = 0, found = 0, endBlock, next = "", continueToNextLine, stackPos, 
                    allowMultiline = this.mline, startBlock = this.t, thisBlock = this.tn,
                    charIsEscaped = 0, isEscapedBlock = (T_ESCBLOCK == this.tt), escChar = this.esc
                ;
                
                // comments in general are not required tokens
                if ( T_COMMENT == this.tt ) this.required = 0;
                
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
                    stackPos = state.stack.length;
                    ended = endBlock.get(stream);
                    continueToNextLine = allowMultiline;
                    
                    if ( !ended )
                    {
                        while ( !stream.eol() ) 
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
                    }
                    continueToNextLine = allowMultiline || (isEscapedBlock && charIsEscaped);
                    
                    if ( ended || !continueToNextLine )
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    else
                    {
                        this.push( state.stack, stackPos, this );
                    }
                    
                    state.t = this.tt;
                    //state.r = this.r; 
                    return this.r;
                }
                
                //state.inBlock = null;
                //state.endBlock = null;
                return false;
            }
        }),
                
        RepeatedTokens = Class(SimpleToken, {
                
            constructor : function( name, tokens, min, max ) {
                this.tt = T_REPEATED;
                this.tn = name || null;
                this.t = null;
                this.ts = null;
                this.min = min || 0;
                this.max = max || INF;
                this.found = 0;
                this.toClone = ['ts', 'min', 'max', 'found'];
                if (tokens) this.set( tokens );
            },
            
            ts: null,
            min: 0,
            max: 1,
            found : 0,
            
            set : function( tokens ) {
                if ( tokens ) this.ts = make_array( tokens );
                return this;
            },
            
            get : function( stream, state ) {
            
                var i, token, style, tokens = this.ts, n = tokens.length, 
                    found = this.found, min = this.min, max = this.max,
                    tokensRequired = 0, streamPos, stackPos;
                
                this.ERR = 0;
                this.required = 0;
                streamPos = stream.pos;
                stackPos = state.stack.length;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone().require(1);
                    style = token.get(stream, state);
                    
                    if ( false !== style )
                    {
                        ++found;
                        if ( found <= max )
                        {
                            // push it to the stack for more
                            this.found = found;
                            this.push( state.stack, stackPos, this.clone() );
                            this.found = 0;
                            return style;
                        }
                        break;
                    }
                    else if ( token.required )
                    {
                        tokensRequired++;
                    }
                    if ( token.ERR ) stream.bck2( streamPos );
                }
                
                this.required = found < min;
                this.ERR = found > max || (found < min && 0 < tokensRequired);
                return false;
            }
        }),
        
        EitherTokens = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_EITHER;
            },
            
            get : function( stream, state ) {
            
                var style, token, i, tokens = this.ts, n = tokens.length, 
                    tokensRequired = 0, tokensErr = 0, streamPos;
                
                this.required = 1;
                this.ERR = 0;
                streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone();
                    style = token.get(stream, state);
                    
                    tokensRequired += (token.required) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        return style;
                    }
                    else if ( token.ERR )
                    {
                        tokensErr++;
                        stream.bck2( streamPos );
                    }
                }
                
                this.required = (tokensRequired > 0);
                this.ERR = (n == tokensErr && tokensRequired > 0);
                return false;
            }
        }),
        /*        
        NoneTokens = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_NONE;
            },
            
            get : function( stream, state ) {
            
                var style, token, i, tokens = this.ts, n = tokens.length, streamPos;
                
                this.required = 0;
                this.ERR = 0;
                streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone();
                    style = token.get(stream, state);
                    
                    // if one of the tokens matched, return an error
                    if ( false !== style )
                    {
                        this.ERR = 1;
                        stream.bck2( streamPos );
                        return false;
                    }
                }
                
                this.required = 0;
                this.ERR = 0;
                return false;
            }
        }),
        */        
        AllTokens = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_ALL;
            },
            
            get : function( stream, state ) {
                
                var token, style, tokens = this.ts, n = tokens.length,
                    streamPos, stackPos;
                
                this.required = 1;
                this.ERR = 0;
                streamPos = stream.pos;
                token = tokens[ 0 ].clone().require( 1 );
                style = token.get(stream, state);
                
                if ( false !== style )
                {
                    stackPos = state.stack.length;
                    for (var i=n-1; i>0; i--)
                        this.push( state.stack, stackPos+n-i, tokens[ i ].clone().require( 1 ) );
                    
                    return style;
                    
                }
                else if ( token.ERR )
                {
                    this.ERR = 1;
                    stream.bck2( streamPos );
                }
                else if ( token.required )
                {
                    this.ERR = 1;
                }
                
                return false;
            }
        }),
                
        NGramToken = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_NGRAM;
            },
            
            get : function( stream, state ) {
                
                var token, style, tokens = this.ts, n = tokens.length, 
                    streamPos, stackPos;
                
                this.required = 0;
                this.ERR = 0;
                streamPos = stream.pos;
                token = tokens[ 0 ].clone().require( 0 );
                style = token.get(stream, state);
                
                if ( false !== style )
                {
                    stackPos = state.stack.length;
                    for (var i=n-1; i>0; i--)
                        this.push( state.stack, stackPos+n-i, tokens[ i ].clone().require( 1 ) );
                    
                    return style;
                }
                else if ( token.ERR )
                {
                    //this.ERR = 1;
                    stream.bck2( streamPos );
                }
                
                return false;
            }
        }),
                
        getTokenizer = function(tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords) {
            
            if ( null === tokenID )
            {
                // EOL Tokenizer
                var token = new SimpleToken( 
                            tokenID,
                            tokenID,
                            DEFAULTSTYLE
                        );
                
                // pre-cache tokenizer to handle recursive calls to same tokenizer
                cachedTokens[ tokenID ] = token;
            }
            else
            {
                tokenID = '' + tokenID;
                if ( !cachedTokens[ tokenID ] )
                {
                    var tok, token = null, type, combine, action, matchType, tokens;
                
                    // allow token to be literal and wrap to simple token with default style
                    tok = Lex[ tokenID ] || Syntax[ tokenID ] || { type: "simple", tokens: tokenID };
                    
                    if ( tok )
                    {
                        // tokens given directly, no token configuration object, wrap it
                        if ( (T_STR | T_ARRAY) & get_type( tok ) )
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
                            combine = ( 'undefined' ==  typeof(tok.combine) ) ? "\\b" : tok.combine;
                            token = new SimpleToken( 
                                        tokenID,
                                        getCompositeMatcher( tokenID, tok.tokens.slice(), RegExpID, combine, cachedRegexes, cachedMatchers ), 
                                        Style[ tokenID ] || DEFAULTSTYLE
                                    );
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
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
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            if ( tok.interleave ) commentTokens.push( token.clone() );
                        }
                        
                        else if ( T_GROUP & type )
                        {
                            tokens = tok.tokens.slice();
                            if ( T_ARRAY & get_type( tok.match ) )
                            {
                                token = new RepeatedTokens(tokenID, null, tok.match[0], tok.match[1]);
                            }
                            else
                            {
                                matchType = groupTypes[ tok.match.toUpperCase() ]; 
                                
                                if (T_ZEROORONE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 0, 1);
                                
                                else if (T_ZEROORMORE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 0, INF);
                                
                                else if (T_ONEORMORE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 1, INF);
                                
                                else if (T_EITHER & matchType) 
                                    token = new EitherTokens(tokenID, null);
                                
                                else if (T_NONE & matchType) 
                                    token = new NoneTokens(tokenID, null);
                                
                                else //if (T_ALL == matchType)
                                    token = new AllTokens(tokenID, null);
                            }
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            for (var i=0, l=tokens.length; i<l; i++)
                                tokens[i] = getTokenizer( tokens[i], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords );
                            
                            token.set(tokens);
                            
                        }
                        
                        else if ( T_NGRAM & type )
                        {
                            // get n-gram tokenizer
                            token = make_array_2( tok.tokens.slice() ).slice(); // array of arrays
                            var ngrams = [], ngram;
                            
                            for (var i=0, l=token.length; i<l; i++)
                            {
                                // get tokenizers for each ngram part
                                ngrams[i] = token[i].slice();
                                // get tokenizer for whole ngram
                                token[i] = new NGramToken( tokenID + '_NGRAM_' + i, null );
                            }
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            for (var i=0, l=token.length; i<l; i++)
                            {
                                ngram = ngrams[i];
                                
                                for (var j=0, l2=ngram.length; j<l2; j++)
                                    ngram[j] = getTokenizer( ngram[j], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens,  comments, keywords );
                                
                                // get tokenizer for whole ngram
                                token[i].set( ngram );
                            }
                        }
                    }
                }
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
                cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if ( grammar.__parsed ) return grammar;
            
            cachedRegexes = {}; cachedMatchers = {}; cachedTokens = {}; comments = {}; keywords = {};
            commentTokens = [];
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
                
                token = getTokenizer( tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) || null;
                
                if ( token )
                {
                    if ( T_ARRAY & get_type( token ) )  tokens = tokens.concat( token );
                    
                    else  tokens.push( token );
                }
            }
            
            grammar.Parser = tokens;
            grammar.cTokens = commentTokens;
            grammar.Style = Style;
            grammar.Comments = comments;
            grammar.Keywords = keywords;
            
            // this grammar is parsed
            grammar.__parsed = 1;
            
            return grammar;
        }
    ;
  