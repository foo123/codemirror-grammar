    
    //
    // tokenizer factories
    var
        // state scope/context
        /*Context = function( args ) {
            if ( args )
            {
                for (var p in args)  
                    this[p] = args[p];
            }
        },
        
        pushContext = function(state, ctx) {
            ctx.prev = state.context || null;
            return state.context = new Context( ctx );
        },
        
        popContext = function(state) {
            if ( state.context )
                state.context = state.context.prev || null;
            return state.context;
        },
            
        Action = Extends( Object, {
            
            constructor : function(name, action, token) {
                this.type = T_ACTION;
                this.name = name || null;
                this.action = (action) ? actionTypes[ action.toUpperCase() ] : null;
                this.token = token || null;
            },    
            
            type : null,
            name : null,
            action : null,
            token : null,
            
            toString : function() {
                return '[Action: ' + ((T_INDENT == this.action) ? 'INDENT' : 'OUTDENT') + ']';
            },
            
            doAction : function(stream, state, LOCALS) {
                
                var indentUnit = LOCALS.conf.indentUnit;
                
                if ( T_INDENT == this.action )
                {
                    //if ( !state.context || state.context.type != state.current )
                    console.log('indent action')
                    pushContext( state, { token: state.current, current: stream.current(), indentation: stream.indentation() + indentUnit } );
                }
                
                else if ( T_OUTDENT == this.action )
                {
                    if ( state.context )
                    {
                        state.context.textAfter = function( textAfter, state ) {
                            popContext( state );
                            return ( state.context ) ? (state.context.indentation) : 0;
                        };
                    }
                }
                
                return true;
            }
        }),
        */
        SimpleTokenizer = Extends( Object, {
            
            constructor : function(name, token, type, style) {
                if (name) this.name = name;
                if (token) this.token = token;
                if (type) this.type = type;
                if (style) this.style = style;
                this.tokenName = this.name;
            },
            
            name : null,
            token : null,
            tokenName : null,
            type : null,
            style : null,
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
                    t.actionBefore = this.actionBefore;
                    t.actionAfter = this.actionAfter;
                    
                    for (var i=0; i<argslen; i++)   
                    {
                        t[ args[i] ] = this[ args[i] ];
                    }
                    
                    return t;
                }
                
                return null;
            },
            
            test : function(textAfter) {
                return this.token.test( textAfter );
            },
            
            tokenize : function( stream, state, LOCALS ) {
                
                /*if ( this.actionBefore )
                {
                    this.actionBefore.doAction(stream, state, LOCALS);
                }*/
                
                if ( this.token.match(stream) )
                {
                    state.currentToken = this.type;
                    /*if ( this.actionAfter )
                    {
                        this.actionAfter.doAction(stream, state, LOCALS);
                    }*/
                    return this.style;
                }
                
                return false;
            }
        }),
        
        BlockTokenizer = Extends( SimpleTokenizer, {
            
            constructor : function(name, token, type, style, multiline) {
                if (name) this.name = name;
                if (token) this.token = token;
                if (type) this.type = type;
                if (style) this.style = style;
                this.multiline = (false!==multiline);
                this.endBlock = null;
                this.tokenName = this.name;
            },    
            
            multiline : false,
            endBlock : null,
            
            tokenize : function( stream, state, LOCALS ) {
            
                var ended = false, found = false;
                
                /*if ( this.actionBefore )
                {
                    this.actionBefore.doAction(stream, state, LOCALS);
                }*/
                
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
                    
                    ended = ( ended || ( !this.multiline && stream.eol() ) );
                    
                    if ( !ended )
                    {
                        this.pushToken( state.stack, this );
                    }
                    else
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                        
                        /*if ( this.actionAfter )
                        {
                            this.actionAfter.doAction(stream, state, LOCALS);
                        }*/
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
                this.tokenName = this.name;
            },    
            
            escape : "\\",
            
            tokenize : function( stream, state, LOCALS ) {
            
                var next = "", ended = false, found = false, isEscaped = false;
                
                /*if ( this.actionBefore )
                {
                    this.actionBefore.doAction(stream, state, LOCALS);
                }*/
                
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
                        
                        /*if ( this.actionAfter )
                        {
                            this.actionAfter.doAction(stream, state, LOCALS);
                        }*/
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
                this.tokenName = this.name;
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
                this.tokenName = this.name;
            },
            
            test : function(textAfter) {
                return this.token.test( textAfter );
            },
            
            tokenize : function( stream, state, LOCALS ) {
                
                /*if ( this.actionBefore )
                {
                    this.actionBefore.doAction(stream, state, LOCALS);
                }*/
                
                // this is optional
                this.isRequired = false;
                this.ERROR = false;
                this.streamPos = stream.pos;
                var style = this.token.tokenize(stream, state);
                
                if ( token.ERROR ) this.backTrack( stream );
                
                /*if ( style && this.actionAfter )
                {
                    this.actionAfter.doAction(stream, state, LOCALS);
                }*/

                return style;
            }
        }),
        
        ZeroOrMoreTokens = Extends( CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_ZEROORMORE;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
                this.tokenName = this.name;
            },
            
            test : function(textAfter) {
                var ret;
                for (var i=0, n=this.tokens.length; i<n; i++)
                {
                    ret = this.tokens[i].test( textAfter );
                    if (ret) return true;
                }
                return false;
            },
            
            tokenize : function( stream, state, LOCALS ) {
            
                var i, token, style, n = this.tokens.length, tokensErr = 0, ret = false;
                
                // this is optional
                this.isRequired = false;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                /*if ( this.actionBefore )
                {
                    this.actionBefore.doAction(stream, state, LOCALS);
                }*/
                
                for (i=0; i<n; i++)
                {
                    token = this.tokens[i];
                    style = token.tokenize(stream, state, LOCALS);
                    
                    if ( false !== style )
                    {
                        // push it to the stack for more
                        this.pushToken( state.stack, this );
                        
                        /*if ( this.actionAfter )
                        {
                            this.actionAfter.doAction(stream, state, LOCALS);
                        }*/
                        
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
                this.tokenName = this.name;
            },
            
            foundOne : false,
            
            test : function(textAfter) {
                var ret;
                for (var i=0, n=this.tokens.length; i<n; i++)
                {
                    ret = this.tokens[i].test( textAfter );
                    if (ret) return true;
                }
                return false;
            },
            
            tokenize : function( stream, state, LOCALS ) {
        
                var style, token, i, n = this.tokens.length, tokensRequired = 0, tokensErr = 0;
                
                this.isRequired = !this.foundOne;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                /*if ( this.actionBefore )
                {
                    this.actionBefore.doAction(stream, state, LOCALS);
                }*/
                
                for (i=0; i<n; i++)
                {
                    token = this.tokens[i];
                    style = token.tokenize(stream, state, LOCALS);
                    
                    tokensRequired += (token.isRequired) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        this.foundOne = true;
                        this.isRequired = false;
                        this.ERROR = false;
                        // push it to the stack for more
                        this.pushToken( state.stack, this.clone(OneOrMoreTokens, "tokens", "foundOne") );
                        this.foundOne = false;
                        
                        /*if ( this.actionAfter )
                        {
                            this.actionAfter.doAction(stream, state, LOCALS);
                        }*/
                        
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
                this.tokenName = this.name;
            },
            
            test : function(textAfter) {
                var ret;
                for (var i=0, n=this.tokens.length; i<n; i++)
                {
                    ret = this.tokens[i].test( textAfter );
                    if (ret) return true;
                }
                return false;
            },
            
            tokenize : function( stream, state, LOCALS ) {
            
                var style, token, i, n = this.tokens.length, tokensRequired = 0, tokensErr = 0;
                
                this.isRequired = true;
                this.ERROR = false;
                this.streamPos = stream.pos;
                
                /*if ( this.actionBefore )
                {
                    this.actionBefore.doAction(stream, state, LOCALS);
                }*/
                
                for (i=0; i<n; i++)
                {
                    token = this.tokens[i];
                    style = token.tokenize(stream, state, LOCALS);
                    
                    tokensRequired += (token.isRequired) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        /*if ( this.actionAfter )
                        {
                            this.actionAfter.doAction(stream, state, LOCALS);
                        }*/
                        
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
                this.tokenName = this.name;
            },
            
            test : function(textAfter) {
                return this.tokens[this.tokens.length-1].test( textAfter );
            },
            
            tokenize : function( stream, state, LOCALS ) {
                
                var token, style, n = this.tokens.length, ret = false, off=0;
                
                this.isRequired = true;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                
                /*if ( this.actionBefore )
                {
                    this.actionBefore.doAction(stream, state, LOCALS);
                }*/
                
                token = this.tokens[ 0 ];
                style = token.required(true).tokenize(stream, state, LOCALS);
                
                if ( false !== style )
                {
                    this.stackPos = state.stack.length;
                    /*if ( this.actionAfter )
                    {
                        this.pushToken( state.stack, this.actionAfter, 1 );
                        off=1;
                    }*/
                    for (var i=n-1; i>0; i--)
                    {
                        this.pushToken( state.stack, this.tokens[i].required(true), n-i+off );
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
                this.tokenName = this.tokens[0].name;
            },
            
            test : function( textAfter ) {
                return this.tokens[this.tokens.length-1].test( textAfter );
            },
            
            tokenize : function( stream, state, LOCALS ) {
                
                var token, style, n = this.tokens.length, ret = false, off=0;
                
                this.isRequired = false;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                
                /*if ( this.actionBefore )
                {
                    this.actionBefore.doAction(stream, state, LOCALS);
                }*/
                
                token = this.tokens[ 0 ];
                style = token.required(false).tokenize(stream, state, LOCALS);
                
                if ( false !== style )
                {
                    this.stackPos = state.stack.length;
                    /*if ( this.actionAfter )
                    {
                        console.log('pushed action after: '+this.actionAfter.toString());
                        this.pushToken( state.stack, this.actionAfter, 1 );
                        off=1;
                    }*/
                    for (var i=n-1; i>0; i--)
                    {
                        this.pushToken( state.stack, this.tokens[i].required(true), n-i+off );
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
            
            var tok, token = null, type, matchType, tokens, action;
            
            if ( !parsedTokens[ tokenID ] )
            {
                tok = Lex[ tokenID ] || Syntax[ tokenID ] || null;
                
                if ( tok )
                {
                    type = tok.type || "simple";
                    type = tokenTypes[ type.toUpperCase() ];
                    action = tok.action || null;
                    
                    if ( T_BLOCK == type )
                    {
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
                /*
                if ( action )
                {
                    if ( T_ARRAY == get_type(action) )
                    {
                        if (action[1] && action[1].toLowerCase() == "before" )
                            token.actionBefore = new Action( tokenID, action[0], token );
                        
                        else
                            token.actionAfter = new Action( tokenID, action[0], token );
                    }
                    else
                    {
                        token.actionAfter = new Action( tokenID, action, token );
                    }
                }
                */    
                parsedTokens[ tokenID ] = token;
            }
            
            return parsedTokens[ tokenID ];
        }
    ;
  