    
    //
    // parser factories
    var
        Parser = Extends(Object, {
            
            constructor: function(grammar, LOCALS) {
                this.LOCALS = LOCALS;
                this.Style = grammar.Style || {};
                this.tokens = grammar.Parser || [];
            },
            
            LOCALS: null,
            Style: null,
            tokens: null,
            
            resetState: function( state ) {
                state = state || {};
                state.stack = []; 
                state.inBlock = null; 
                state.current = null; 
                state.currentToken = T_DEFAULT;
                state.init = null;
                return state;
            },
            
            copyState: function( state ) {
                var copy = {};
                for (var k in state)
                {
                    if ( T_ARRAY == get_type(state[k]) )
                        copy[k] = state[k].slice();
                    else
                        copy[k] = state[k];
                }
                return copy;
            },
            
            // Codemirror Tokenizer compatible
            getToken: function(_stream, state) {
                
                var i, token, style, stream, stack, numTokens = this.tokens.length;
                
                var DEFAULT = this.LOCALS.DEFAULT;
                var ERROR = this.Style.error || "error";
                
                if ( state.init ) this.resetState( state );
                
                stack = state.stack;
                stream = new Stream(null, _stream);
                
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
        
        getParser = function(grammar, LOCALS) {
            return new Parser(grammar, LOCALS);
        },
        
        getIndentation = function(LOCALS) {
            return function(state, textAfter, fullLine) {
                return CodeMirror.Pass;
            };
        }
    ;
  