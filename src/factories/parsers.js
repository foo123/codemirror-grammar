    
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
                
                /*if ( !state.context )
                {
                    state.context = new Context( { indentation:stream.indentation(), prev: null } );
                }
                
                if ( stream.sol() )
                {
                    state.indentation = stream.indentation();
                }*/
                
                //stackTrace( stack );
                
                /*if (stack.length && T_ACTION==stack[stack.length-1])
                {
                    token = stack.pop();
                    console.log(token.toString());
                    token.doAction(stream, state, LOCALS);
                }*/
                
                if ( stream.eatSpace() ) 
                {
                    state.current = null;
                    state.currentToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                while ( stack.length )
                {
                    token = stack.pop();
                    
                    /*if ( T_ACTION == token.type )
                    {
                        console.log(token.toString());
                        token.doAction(stream, state, LOCALS);
                        continue;
                    }*/
                    
                    style = token.tokenize(stream, state, LOCALS);
                    
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
                            state.current = null;
                            state.currentToken = T_ERROR;
                            state.sol = false;
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
                        state.sol = false;
                        return style;
                    }
                }
                
                for (i=0; i<numTokens; i++)
                {
                    token = tokens[i];
                    style = token.tokenize(stream, state, LOCALS);
                    
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
                            state.current = null;
                            state.currentToken = T_ERROR;
                            state.sol = false;
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
                        state.sol = false;
                        return style;
                    }
                }
                
                // unknown, bypass
                stream.next();
                state.current = null;
                state.currentToken = T_DEFAULT;
                state.sol = false;
                return DEFAULT;
            };
            
            return parser;
        },
        
        indentationFactory = function(LOCALS) {
            
            return function(state, textAfter) {
                
                /*
                // TODO
                //console.log(textAfter);
                //console.log(state);
                if ( state.context )
                {
                    if ( state.context.textAfter )
                    {
                        console.log('dedent');
                        return state.context.textAfter( textAfter, state );
                    }
                    return state.context.indentation;
                }
                */
                return CodeMirror.Pass;
            };
        }
    ;
  