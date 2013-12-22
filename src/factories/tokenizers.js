    
    //
    // tokenizer factories
    var
        SimpleTokenizer = Class({
            
            constructor : function(name, token, type, style) {
                this.type = type || null;
                this.name = name || null;
                this.t = token || null;
                this.v = style || null;
            },
            
            name : null,
            type : null,
            t : null,
            v : null,
            isRequired : false,
            ERROR : false,
            streamPos : null,
            stackPos : null,
            actionBefore : null,
            actionAfter : null,
            
            toString : function() {
                var s = '[';
                s += 'Tokenizer: ' + this.name;
                s += ', Type: ' + this.type;
                s += ', Token: ' + ((this.t) ? this.t.toString() : null);
                s += ']';
                return s;
            },
            
            required : function(bool) { 
                this.isRequired = (bool) ? true : false;
                return this;
            },
            
            push : function(stack, token, i) {
                if ( this.stackPos )
                    stack.splice( this.stackPos+(i||0), 0, token );
                else
                    stack.push( token );
                return this;
            },
            
            clone : function(/* variable args here.. */) {
                
                var t, i, args = slice.call(arguments), argslen = args.length;
                
                t = new this.$class();
                t.type = this.type;
                t.name = this.name;
                t.t = this.t;
                t.v = this.v;
                t.isRequired = this.isRequired;
                t.ERROR = this.ERROR;
                t.streamPos = this.streamPos;
                t.stackPos = this.stackPos;
                t.actionBefore = this.actionBefore;
                t.actionAfter = this.actionAfter;
                
                for (i=0; i<argslen; i++)   
                    t[ args[i] ] = this[ args[i] ];
                
                return t;
            },
            
            get : function( stream, state, LOCALS ) {
                
                if ( this.t.get(stream) )
                {
                    state.t = this.type;
                    return this.v;
                }
                return false;
            }
        }),
        
        BlockTokenizer = Class(SimpleTokenizer, {
            
            constructor : function(name, token, type, style, multiline) {
                this.$super('constructor', name, token, type, style);
                this.multiline = (false!==multiline);
                this.e = null;
            },    
            
            multiline : false,
            e : null,
            
            get : function( stream, state, LOCALS ) {
            
                var ended = false, found = false;
                
                if ( state.inBlock == this.name )
                {
                    found = true;
                    this.e = state.endBlock;
                }    
                else if ( !state.inBlock && (this.e = this.t.get(stream)) )
                {
                    found = true;
                    state.inBlock = this.name;
                    state.endBlock = this.e;
                }    
                
                if ( found )
                {
                    this.stackPos = state.stack.length;
                    ended = this.e.get(stream);
                    
                    while ( !ended && !stream.eol() ) 
                    {
                        if ( this.e.get(stream) ) 
                        {
                            ended = true;
                            break;
                        }
                        else  
                        {
                            stream.nxt();
                        }
                    }
                    
                    ended = ( ended || ( !this.multiline && stream.eol() ) );
                    
                    if ( !ended )
                    {
                        this.push( state.stack, this );
                    }
                    else
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    
                    state.t = this.type;
                    return this.v;
                }
                
                state.inBlock = null;
                state.endBlock = null;
                return false;
            }
        }),
                
        EscBlockTokenizer = Class(BlockTokenizer, {
            
            constructor : function(name, token, type, style, escape, multiline) {
                this.$super('constructor', name, token, type, style);
                this.esc = escape || "\\";
                this.multiline = multiline || false;
                this.e = null;
            },    
            
            esc : "\\",
            
            get : function( stream, state, LOCALS ) {
            
                var next = "", ended = false, found = false, isEscaped = false;
                
                if ( state.inBlock == this.name )
                {
                    found = true;
                    this.e = state.endBlock;
                }    
                else if ( !state.inBlock && (this.e = this.t.get(stream)) )
                {
                    found = true;
                    state.inBlock = this.name;
                    state.endBlock = this.e;
                }    
                
                if ( found )
                {
                    this.stackPos = state.stack.length;
                    ended = this.e.get(stream);
                    
                    while ( !ended && !stream.eol() ) 
                    {
                        if ( !isEscaped && this.e.get(stream) ) 
                        {
                            ended = true; 
                            break;
                        }
                        else  
                        {
                            next = stream.nxt();
                        }
                        isEscaped = !isEscaped && next == this.esc;
                    }
                    
                    ended = ended || !(isEscaped && this.multiline);
                    
                    if ( !ended )
                    {
                        this.push( state.stack, this );
                    }
                    else
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    
                    state.t = this.type;
                    return this.v;
                }
                
                state.inBlock = null;
                state.endBlock = null;
                return false;
            }
        }),
                
        CompositeTokenizer = Class(SimpleTokenizer, {
            
            constructor : function(name, type) {
                this.$super('constructor', name, type);
                this.ts = null;
            },
            
            ts : null,
            
            makeToks : function( tokens ) {
                if ( tokens )
                {
                    this.ts = make_array( tokens );
                    this.t = this.ts[0];
                }
                return this;
            }
        }),
        
        ZeroOrOneTokens = Class(CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_ZEROORONE;
                this.name = name || null;
                if (tokens) this.makeToks( tokens );
            },
            
            get : function( stream, state, LOCALS ) {
                
                // this is optional
                this.isRequired = false;
                this.ERROR = false;
                this.streamPos = stream.pos;
                var tok = this.t;
                var style = tok.get(stream, state);
                
                if ( tok.ERROR ) stream.bck2( this.streamPos );
                
                return style;
            }
        }),
        
        ZeroOrMoreTokens = Class(CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_ZEROORMORE;
                this.name = name || null;
                if (tokens) this.makeToks( tokens );
            },
            
            get : function( stream, state, LOCALS ) {
            
                var i, token, style, tokens = this.ts, n = tokens.length, tokensErr = 0, ret = false;
                
                // this is optional
                this.isRequired = false;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i];
                    style = token.get(stream, state, LOCALS);
                    
                    if ( false !== style )
                    {
                        // push it to the stack for more
                        this.push( state.stack, this );
                        return style;
                    }
                    else if ( token.ERROR )
                    {
                        tokensErr++;
                        stream.bck2( this.streamPos );
                    }
                }
                
                //this.ERROR = (n == tokensErr) ? true : false;
                return false;
            }
        }),
        
        OneOrMoreTokens = Class(CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_ONEORMORE;
                this.name = name || null;
                if (tokens) this.makeToks( tokens );
                this.foundOne = false;
            },
            
            foundOne : false,
            
            get : function( stream, state, LOCALS ) {
        
                var style, token, i, tokens = this.ts, n = tokens.length, tokensRequired = 0, tokensErr = 0;
                
                this.isRequired = !this.foundOne;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i];
                    style = token.get(stream, state, LOCALS);
                    
                    tokensRequired += (token.isRequired) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        this.foundOne = true;
                        this.isRequired = false;
                        this.ERROR = false;
                        // push it to the stack for more
                        this.push( state.stack, this.clone("ts", "foundOne") );
                        this.foundOne = false;
                        
                        return style;
                    }
                    else if ( token.ERROR )
                    {
                        tokensErr++;
                        stream.bck2( this.streamPos );
                    }
                }
                
                this.ERROR = (!this.foundOne /*|| n == tokensErr*/) ? true : false;
                return false;
            }
        }),
        
        EitherTokens = Class(CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_EITHER;
                this.name = name || null;
                if (tokens) this.makeToks( tokens );
            },
            
            get : function( stream, state, LOCALS ) {
            
                var style, token, i, tokens = this.ts, n = tokens.length, tokensRequired = 0, tokensErr = 0;
                
                this.isRequired = true;
                this.ERROR = false;
                this.streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i];
                    style = token.get(stream, state, LOCALS);
                    
                    tokensRequired += (token.isRequired) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        return style;
                    }
                    else if ( token.ERROR )
                    {
                        tokensErr++;
                        stream.bck2( this.streamPos );
                    }
                }
                
                this.isRequired = (tokensRequired > 0) ? true : false;
                this.ERROR = (n == tokensErr && tokensRequired > 0) ? true : false;
                return false;
            }
        }),
                
        AllTokens = Class(CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_ALL;
                this.name = name || null;
                if (tokens) this.makeToks( tokens );
            },
            
            get : function( stream, state, LOCALS ) {
                
                var token, style, tokens = this.ts, n = tokens.length, ret = false;
                
                this.isRequired = true;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                
                token = tokens[ 0 ];
                style = token.required(true).get(stream, state, LOCALS);
                
                if ( false !== style )
                {
                    this.stackPos = state.stack.length;
                    for (var i=n-1; i>0; i--)
                        this.push( state.stack, tokens[i].required(true), n-i );
                    
                    ret = style;
                    
                }
                else if ( token.ERROR )
                {
                    this.ERROR = true;
                    stream.bck2( this.streamPos );
                }
                else if ( token.isRequired )
                {
                    this.ERROR = true;
                }
                
                return ret;
            }
        }),
                
        NGramTokenizer = Class(CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_NGRAM;
                this.name = name || null;
                if (tokens) this.makeToks( tokens );
            },
            
            get : function( stream, state, LOCALS ) {
                
                var token, style, tokens = this.ts, n = tokens.length, ret = false;
                
                this.isRequired = false;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                
                token = tokens[ 0 ];
                style = token.required(false).get(stream, state, LOCALS);
                
                if ( false !== style )
                {
                    this.stackPos = state.stack.length;
                    for (var i=n-1; i>0; i--)
                        this.push( state.stack, tokens[i].required(true), n-i );
                    
                    ret = style;
                }
                else if ( token.ERROR )
                {
                    //this.ERROR = true;
                    stream.bck2( this.streamPos );
                }
                
                return ret;
            }
        }),
                
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
        
        getTokenizer = function(tokenID, RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens, comments) {
            
            var tok, token = null, type, matchType, tokens, action;
            
            if ( !parsedTokens[ tokenID ] )
            {
                tok = Lex[ tokenID ] || Syntax[ tokenID ] || null;
                
                if ( tok )
                {
                    type = tok.type || "simple";
                    type = tokenTypes[ type.toUpperCase() ];
                    action = tok.action || null;
                    
                    if ( T_BLOCK == type || T_COMMENT == type )
                    {
                        if ( T_COMMENT == type ) getComments(tok, comments);
                            
                        token = new BlockTokenizer( 
                                    tokenID,
                                    getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, parsedRegexes, parsedMatchers ), 
                                    type, 
                                    Style[ tokenID ] || DEFAULTTYPE,
                                    tok.multiline
                                );
                    }
                    
                    else if ( T_ESCBLOCK == type )
                    {
                        token = new EscBlockTokenizer( 
                                    tokenID,
                                    getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, parsedRegexes, parsedMatchers ), 
                                    type, 
                                    Style[ tokenID ] || DEFAULTTYPE,
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
                                    Style[ tokenID ] || DEFAULTTYPE
                                );
                    }
                    
                    else if ( T_GROUP == type )
                    {
                        matchType = groupTypes[ tok.match.toUpperCase() ]; 
                        tokens = make_array( tok.tokens ).slice();
                        
                        for (var i=0, l=tokens.length; i<l; i++)
                            tokens[i] = getTokenizer(tokens[i], RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens, comments);
                        
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
                                ngram[j] = getTokenizer( ngram[j], RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens, comments );
                            
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
  