    
    //
    // parser factories
    var
        Parser = Extends(Object, {
            
            constructor: function(grammar, LOCALS) {
                this.LOCALS = LOCALS;
                this.Style = grammar.Style || {};
                this.tokens = grammar.Parser || [];
                //this.state = null;
            },
            
            LOCALS: null,
            Style: null,
            tokens: null,
            //state: null,
            
            resetState: function( state ) {
                state.stack = []; 
                state.inBlock = null; 
                state.current = null; 
                state.currentToken = T_DEFAULT;
                state.init = null;
                return state;
            },
            
            parse: function(cmStream, state) {
                
                var i, token, style, stream, stack, numTokens = this.tokens.length;
                
                var DEFAULT = this.LOCALS.DEFAULT;
                var ERROR = this.Style.error || "error";
                
                if ( state.init )
                {
                    this.resetState( state );
                }
                stack = state.stack;
                stream = new Stream(null, cmStream);
                
                if ( stream.eatSpace() ) 
                {
                    state.current = null;
                    state.currentToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                while ( stack.length )
                {
                    token = stack.pop();
                    style = token.tokenize(stream, state, this.LOCALS);
                    
                    // match failed
                    if ( false === style )
                    {
                        // error
                        if ( token.ERROR || token.isRequired )
                        {
                            // empty the stack
                            state.stack.length = 0;
                            // skip this character
                            stream.next();
                            // generate error
                            state.current = null;
                            state.currentToken = T_ERROR;
                            return ERROR;
                        }
                        // optional
                        else
                        {
                            continue;
                        }
                    }
                    // found token
                    else
                    {
                        state.current = token.tokenName;
                        return style;
                    }
                }
                
                for (i=0; i<numTokens; i++)
                {
                    token = this.tokens[i];
                    style = token.tokenize(stream, state, this.LOCALS);
                    
                    // match failed
                    if ( false === style )
                    {
                        // error
                        if ( token.ERROR || token.isRequired )
                        {
                            // empty the stack
                            state.stack.length = 0;
                            // skip this character
                            stream.next();
                            // generate error
                            state.current = null;
                            state.currentToken = T_ERROR;
                            return ERROR;
                        }
                        // optional
                        else
                        {
                            continue;
                        }
                    }
                    // found token
                    else
                    {
                        state.current = token.tokenName;
                        return style;
                    }
                }
                
                // unknown, bypass
                stream.next();
                state.current = null;
                state.currentToken = T_DEFAULT;
                return DEFAULT;
            }
        }),
        
        parserFactory = function(grammar, LOCALS) {
            return new Parser(grammar, LOCALS);
        },
        
        indentationFactory = function(LOCALS) {
            
            return function(state, textAfter) {
                return CodeMirror.Pass;
            };
        }
    ;
  