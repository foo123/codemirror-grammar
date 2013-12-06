    
    //
    // parser factories
    var
        /*stackTrace = function(stack) {
            console.log( "Stack Trace Begin" );
            
            for (var i=stack.length-1; i>=0; i--)
                console.log( stack[i].toString() );
            
            console.log( "Stack Trace End" );
        },*/
        
        parserFactory = function(grammar, LOCALS) {
            
            var DEFAULT = LOCALS.DEFAULT,
                Style = grammar.Style || {},
                ERROR = Style.error || null,
                tokens = grammar.Parser || [],
                numTokens = tokens.length
            ;
            
            var parser = function(stream, state) {
                
                var i, token, style, stack;
                
                stack = state.stack = state.stack || [];
                
                if ( stream.eatSpace() ) 
                {
                    state.currentToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                //stackTrace( stack );
                
                while ( stack.length )
                {
                    token = stack.pop();
                    style = token.tokenize(stream, state);
                    
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
                            //console.log(["ERROR", stream.current()]);
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
                        return style;
                    }
                }
                
                for (i=0; i<numTokens; i++)
                {
                    token = tokens[i];
                    style = token.tokenize(stream, state);
                    
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
                            //console.log(["ERROR", stream.current()]);
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
                        return style;
                    }
                }
                
                // unknown, bypass
                stream.next();
                state.currentToken = T_DEFAULT;
                return DEFAULT;
            };
            
            return parser;
        },
        
        indentationFactory = function(LOCALS) {
            
            return function(state, textAfter) {
                
                // TODO
                return CodeMirror.Pass;
            };
        }
    ;
  