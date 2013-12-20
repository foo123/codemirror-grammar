    
    //
    // parser factories
    var
        Parser = Class({
            
            constructor: function(grammar, LOCALS) {
                this.LOCALS = LOCALS;
                this.Style = grammar.Style || {};
                this.tokens = grammar.Parser || [];
            },
            
            LOCALS: null,
            Style: null,
            tokens: null,
            
            // Codemirror Tokenizer compatible
            getToken: function(_stream, state) {
                
                var i,
                    tokenizer, type, numTokens = this.tokens.length, 
                    stream, stack
                ;
                
                
                var DEFAULT = this.LOCALS.DEFAULT;
                var ERROR = this.Style.error || "error";
                
                stack = state.stack;
                stream = new StringStream(null, _stream);
                
                if ( stream.eatSpace() ) 
                {
                    state.currentToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                while ( stack.length )
                {
                    tokenizer = stack.pop();
                    type = tokenizer.tokenize(stream, state, this.LOCALS);
                    
                    // match failed
                    if ( false === type )
                    {
                        // error
                        if ( tokenizer.ERROR || tokenizer.isRequired )
                        {
                            // empty the stack
                            stack.length = 0;
                            // skip this character
                            stream.next();
                            // generate error
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
                        return type;
                    }
                }
                
                for (i=0; i<numTokens; i++)
                {
                    tokenizer = this.tokens[i];
                    type = tokenizer.tokenize(stream, state, this.LOCALS);
                    
                    // match failed
                    if ( false === type )
                    {
                        // error
                        if ( tokenizer.ERROR || tokenizer.isRequired )
                        {
                            // empty the stack
                            stack.length = 0;
                            // skip this character
                            stream.next();
                            // generate error
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
                        return type;
                    }
                }
                
                // unknown, bypass
                stream.next();
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
  