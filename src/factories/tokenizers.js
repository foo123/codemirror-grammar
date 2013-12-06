    
    //
    // tokenizer factories
    var
        SimpleTokenizer = Extends( Object, {
            
            constructor : function(name, token, type, style) {
                if (name) this.name = name;
                if (token) this.token = token;
                if (type) this.type = type;
                if (style) this.style = style;
            },
            
            name : null,
            token : null,
            type : null,
            style : null,
            isRequired : false,
            ERROR : false,
            streamPos : null,
            stackPos : null,
            
            toString : function() {
                var s = '[';
                s += 'Tokenizer: ' + this.name;
                s += ', Type: ' + this.type;
                s += ', Token: ' + ((this.token) ? this.token.toString() : null);
                s += ']';
                return s;
            },
            
            required : function(bool) { 
                this.isRequired = (bool) ? true : false;
                return this;
            },
            
            backTrack : function(stream) {
                stream.pos -= (stream.pos - this.streamPos);
                return this;
            },
            
            pushToken : function(stack, token, i) {
                if ( this.stackPos )
                    stack.splice( this.stackPos+(i||0), 0, token );
                else
                    stack.push( token );
                return this;
            },
            
            clone : function(/* variable args here.. */) {
                
                var args = slice.call(arguments);
                
                if (args.length)
                {
                    var thisClass = args.shift();
                    
                    var argslen = args.length;
                    
                    var t = new thisClass();
                    
                    t.name = this.name;
                    t.type = this.type;
                    t.isRequired = this.isRequired;
                    t.ERROR = this.ERROR;
                    
                    for (var i=0; i<argslen; i++)   
                    {
                        t[ args[i] ] = this[ args[i] ];
                    }
                    
                    return t;
                }
                
                return null;
            },
            
            tokenize : function( stream, state ) {
                
                if ( this.token.match(stream) )
                {
                    state.currentToken = this.type;
                    return this.style;
                }
                
                return false;
            }
        }),
        
        BlockTokenizer = Extends( SimpleTokenizer, {
            
            constructor : function(name, token, type, style) {
                if (name) this.name = name;
                if (token) this.token = token;
                if (type) this.type = type;
                if (style) this.style = style;
                this.endBlock = null;
            },    
            
            endBlock : null,
            
            tokenize : function( stream, state ) {
            
                var ended = false, found = false;
                
                if ( state.inBlock == this.name )
                {
                    found = true;
                    this.endBlock = state.endBlock;
                }    
                else if ( !state.inBlock && (this.endBlock = this.token.match(stream)) )
                {
                    found = true;
                    state.inBlock = this.name;
                    state.endBlock = this.endBlock;
                }    
                
                if ( found )
                {
                    this.stackPos = state.stack.length;
                    ended = this.endBlock.match(stream);
                    
                    while ( !ended && !stream.eol() ) 
                    {
                        //stream.next();
                        if ( this.endBlock.match(stream) ) 
                        {
                            ended = true;
                            break;
                        }
                        else  
                        {
                            stream.next();
                        }
                    }
                    
                    if ( !ended )
                    {
                        this.pushToken( state.stack, this );
                    }
                    else
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    
                    state.currentToken = this.type;
                    return this.style;
                }
                
                state.inBlock = null;
                state.endBlock = null;
                return false;
            }
        }),
                
        EscBlockTokenizer = Extends( BlockTokenizer, {
            
            constructor : function(name, token, type, style, escape, multiline) {
                if (name) this.name = name;
                if (token) this.token = token;
                if (type) this.type = type;
                if (style) this.style = style;
                if (escape) this.escape = escape || "\\";
                if (multiline) this.multiline = multiline || false;
                this.endBlock = null;
                this.isEscaped = false;
            },    
            
            escape : "\\",
            multiline : false,
            
            tokenize : function( stream, state ) {
            
                var next = "", ended = false, found = false, isEscaped = false;
                
                if ( state.inBlock == this.name )
                {
                    found = true;
                    this.endBlock = state.endBlock;
                }    
                else if ( !state.inBlock && (this.endBlock = this.token.match(stream)) )
                {
                    found = true;
                    state.inBlock = this.name;
                    state.endBlock = this.endBlock;
                }    
                
                if ( found )
                {
                    state.inBlock = this.name;
                    this.stackPos = state.stack.length;
                    ended = this.endBlock.match(stream);
                    
                    while ( !ended && !stream.eol() ) 
                    {
                        //stream.next();
                        if ( !isEscaped && this.endBlock.match(stream) ) 
                        {
                            ended = true; 
                            break;
                        }
                        else  
                        {
                            next = stream.next();
                        }
                        isEscaped = !isEscaped && next == this.escape;
                    }
                    
                    ended = ended || !(isEscaped && this.multiline);
                    
                    if ( !ended )
                    {
                        this.pushToken( state.stack, this );
                    }
                    else
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    
                    state.currentToken = this.type;
                    return this.style;
                }
                
                state.inBlock = null;
                state.endBlock = null;
                return false;
            }
        }),
                
        CompositeTokenizer = Extends( SimpleTokenizer, {
            
            constructor : function(name, type) {
                if (name) this.name = name;
                if (type) this.type = type;
            },
            
            tokens : null,
            
            buildTokens : function( tokens ) {
                if ( tokens )
                {
                    this.tokens = make_array( tokens );
                    this.token = this.tokens[0];
                }
                return this;
            }
        }),
        
        ZeroOrOneTokens = Extends( CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_ZEROORONE;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
            },
            
            tokenize : function( stream, state ) {
                // this is optional
                this.isRequired = false;
                this.ERROR = false;
                this.streamPos = stream.pos;
                var style = this.token.tokenize(stream, state);
                if ( token.ERROR ) this.backTrack( stream );
                return style;
            }
        }),
        
        ZeroOrMoreTokens = Extends( CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_ZEROORMORE;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
            },
            
            tokenize : function( stream, state ) {
            
                var i, token, style, n = this.tokens.length, tokensErr = 0;
                
                // this is optional
                this.isRequired = false;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                for (i=0; i<n; i++)
                {
                    token = this.tokens[i];
                    style = token.tokenize(stream, state);
                    
                    if ( false !== style )
                    {
                        // push it to the stack for more
                        this.pushToken( state.stack, this );
                        return style;
                    }
                    else if ( token.ERROR )
                    {
                        tokensErr++;
                        this.backTrack( stream );
                    }
                }
                
                //this.ERROR = (n == tokensErr) ? true : false;
                return false;
            }
        }),
        
        OneOrMoreTokens = Extends( CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_ONEORMORE;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
                this.foundOne = false;
            },
            
            foundOne : false,
            
            tokenize : function( stream, state ) {
        
                var style, token, i, n = this.tokens.length, tokensRequired = 0, tokensErr = 0;
                
                this.isRequired = !this.foundOne;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                for (i=0; i<n; i++)
                {
                    token = this.tokens[i];
                    style = token.tokenize(stream, state);
                    
                    tokensRequired += (token.isRequired) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        this.foundOne = true;
                        this.isRequired = false;
                        this.ERROR = false;
                        // push it to the stack for more
                        this.pushToken( state.stack, this.clone(OneOrMoreTokens, "tokens", "foundOne") );
                        this.foundOne = false;
                        
                        return style;
                    }
                    else if ( token.ERROR )
                    {
                        tokensErr++;
                        this.backTrack( stream );
                    }
                }
                
                this.ERROR = (!this.foundOne /*|| n == tokensErr*/) ? true : false;
                return false;
            }
        }),
        
        EitherTokens = Extends( CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_EITHER;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
            },
            
            tokenize : function( stream, state ) {
            
                var style, token, i, n = this.tokens.length, tokensRequired = 0, tokensErr = 0;
                
                this.isRequired = true;
                this.ERROR = false;
                this.streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = this.tokens[i];
                    style = token.tokenize(stream, state);
                    
                    tokensRequired += (token.isRequired) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        return style;
                    }
                    else if ( token.ERROR )
                    {
                        tokensErr++;
                        this.backTrack( stream );
                    }
                }
                
                this.isRequired = (tokensRequired > 0) ? true : false;
                this.ERROR = (n == tokensErr && tokensRequired > 0) ? true : false;
                return false;
            }
        }),
                
        AllTokens = Extends( CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_ALL;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
                this.inSequence = 0;
            },
            
            inSequence : 0,
            
            tokenize : function( stream, state ) {
                
                var token, style, n = this.tokens.length, ret = false;
                
                this.isRequired = true;
                this.ERROR = false;
                this.inSequence = 0;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                
                token = this.tokens[ 0 ];
                style = token.required(true).tokenize(stream, state);
                
                if ( false !== style )
                {
                    this.stackPos = state.stack.length;
                    for (var i=n-1; i>0; i--)
                    {
                        this.pushToken( state.stack, this.tokens[i].required(true), n-i );
                    }
                    ret = style;
                }
                else if ( token.ERROR )
                {
                    this.ERROR = true;
                    this.backTrack( stream );
                }
                else if ( token.isRequired )
                {
                    this.ERROR = true;
                }
                
                return ret;
            }
        }),
                
        NGramTokenizer = Extends( CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_NGRAM;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
                this.inSequence = 0;
            },
            
            inSequence : 0,
            
            tokenize : function( stream, state ) {
                
                var token, style, n = this.tokens.length, ret = false;
                
                this.isRequired = false;
                this.ERROR = false;
                this.inSequence = 0;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                
                token = this.tokens[ 0 ];
                style = token.required(false).tokenize(stream, state);
                
                if ( false !== style )
                {
                    this.stackPos = state.stack.length;
                    for (var i=n-1; i>0; i--)
                    {
                        this.pushToken( state.stack, this.tokens[i].required(true), n-i );
                    }
                    ret = style;
                }
                else if ( token.ERROR )
                {
                    //this.ERROR = true;
                    this.backTrack( stream );
                }
                
                return ret;
            }
        }),
                
        getTokenizer = function(tokenID, RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens) {
            
            var tok, token = null, type, matchType, tokens;
            
            if ( !parsedTokens[ tokenID ] )
            {
                tok = Lex[ tokenID ] || Syntax[ tokenID ] || null;
                
                if ( tok )
                {
                    type = tok.type;
                    type = tokenTypes[ type.toUpperCase() ];
                    
                    if ( T_BLOCK == type )
                    {
                        token = new BlockTokenizer( 
                                    tokenID,
                                    getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, parsedRegexes, parsedMatchers ), 
                                    type, 
                                    Style[ tokenID ] || null
                                );
                    }
                    
                    else if ( T_ESCBLOCK == type )
                    {
                        token = new EscBlockTokenizer( 
                                    tokenID,
                                    getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, parsedRegexes, parsedMatchers ), 
                                    type, 
                                    Style[ tokenID ] || null,
                                    tok.escape || "\\",
                                    tok.multiline || false
                                );
                    }
                    
                    else if ( T_SIMPLE == type )
                    {
                        token = new SimpleTokenizer( 
                                    tokenID,
                                    getCompositeMatcher( tokenID, tok.tokens.slice(), RegExpID, RegExpGroups[ tokenID ], parsedRegexes, parsedMatchers ), 
                                    type, 
                                    Style[ tokenID ] || null
                                );
                    }
                    
                    else if ( T_GROUP == type )
                    {
                        matchType = groupTypes[ tok.match.toUpperCase() ]; 
                        tokens = make_array( tok.tokens ).slice();
                        
                        for (var i=0, l=tokens.length; i<l; i++)
                            tokens[i] = getTokenizer(tokens[i], RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens);
                        
                        if (T_ZEROORONE == matchType) 
                            token = new ZeroOrOneTokens(tokenID, tokens);
                        
                        else if (T_ZEROORMORE == matchType) 
                            token = new ZeroOrMoreTokens(tokenID, tokens);
                        
                        else if (T_ONEORMORE == matchType) 
                            token = new OneOrMoreTokens(tokenID, tokens);
                        
                        else if (T_EITHER == matchType) 
                            token = new EitherTokens(tokenID, tokens);
                        
                        else //if (T_ALL == matchType)
                            token = new AllTokens(tokenID, tokens);
                    }
                    
                    else if ( T_NGRAM == type )
                    {
                        // get n-gram tokenizer
                        token = make_array_2( make_array( tok.tokens ).slice() ).slice(); // array of arrays
                        
                        for (var i=0, l=token.length; i<l; i++)
                        {
                            // get tokenizers for each ngram part
                            var ngram = token[i];
                            
                            for (var j=0, l2=ngram.length; j<l2; j++)
                                ngram[j] = getTokenizer( ngram[j], RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens );
                            
                            // get a tokenizer for whole ngram
                            token[i] = new NGramTokenizer( tokenID + '_NGRAM_' + i, ngram );
                        }
                    }
                }
                
                parsedTokens[ tokenID ] = token;
            }
            
            return parsedTokens[ tokenID ];
        }
    ;
  