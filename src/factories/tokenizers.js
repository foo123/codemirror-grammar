    
    //
    // tokenizer factories
    var
        getBlockTokenizer = function(endBlock, type, style, nextTokenizer) {
            
            var tokenBlock = function(stream, state) {
                
                if ( endBlock.match(stream) )
                {
                    state.tokenize = nextTokenizer || null;
                    state.lastToken = type;
                    return style;
                }
                
                var ended = false;
                while ( !stream.eol() ) 
                {
                    stream.next();
                    if ( endBlock.match(stream) ) 
                    {
                        ended = true;
                        break;
                    }
                }
                if ( ended ) state.tokenize = nextTokenizer || null;
                state.lastToken = type;
                return style;
            };
            
            tokenBlock.type = type | T_BLOCK;
            return tokenBlock;
        },
        
        /*getEscapedBlockTokenizer = function(endBlock, type, style, nextTokenizer) {
            
            var tokenBlock = function(stream, state) {
                
                var escaped = false, next = "", ended = false;
                while (!stream.eol()) 
                {
                    if ( !escaped && endBlock.match(stream) ) 
                    {
                        ended = true; 
                        break;
                    }
                    else  next = stream.next();
                    
                    escaped = !escaped && next == "\\";
                }
                if ( ended || !escaped )  state.tokenize = nextTokenizer || null;
                state.lastToken = type;
                return style;
            };
            
            tokenBlock.type = type | T_BLOCK;
            return tokenBlock;
        },*/
        
        getStringTokenizer = function(endString, type, style, multiLineStrings, nextTokenizer) {
            
            var tokenString = function(stream, state) {
                
                var escaped = false, next = "", ended = false;
                while (!stream.eol()) 
                {
                    if ( !escaped && endString.match(stream) ) 
                    {
                        ended = true; 
                        break;
                    }
                    else  next = stream.next();
                    
                    escaped = !escaped && next == "\\";
                }
                if ( ended || !( escaped || multiLineStrings ) )  state.tokenize = nextTokenizer || null;
                state.lastToken = type;
                return style;
            };
            
            tokenString.type = type | T_STRING;
            return tokenString;
        },
        
        getTagTokenizer = function(tagMatcher, type, style, stack, nextTokenizer) {
            
            var endTag = tagMatcher[0], tagName = tagMatcher[1];
            
            var tokenTag = function(stream, state) {
                
                var top;
                
                //console.log(stack[0]);
                
                top = stack[0] || null;
                if ( top && (endTag === top[0]) )
                {
                    stack.shift();
                    state.lastToken = type | T_ENDTAG;
                }
                else
                {
                    stack.unshift( [ endTag, tokenTag/*, tagName*/ ] );
                    state.lastToken = type;
                }
                
                //console.log(stack[0]);
                
                state.tokenize = nextTokenizer || null;
                return style;
            };
            
            tokenTag.type = type | T_TAG;
            return tokenTag;
        },

        /*getDoctypeTokenizer = function(style, nextTokenizer) {
            
            var tokenDoctype = function(stream, state) {
                
                var ch, done = false, depth = 1;
                
                while (!done) 
                {
                    ch = stream.next(); 
                    
                    if (null == ch) break;
                    
                    if ("<" == ch) 
                    {
                        depth++;
                        continue;
                    } 
                    else if (">" == ch) 
                    {
                        if (1 == depth) 
                        {
                            state.tokenize = nextTokenizer || null;
                            break;
                        } 
                        else 
                        {
                            depth--;
                            continue;
                        }
                    }
                }
                
                state.lastToken = T_DOCTYPE;
                return style;
            };
            
            tokenDoctype.type = T_DOCTYPE;
            return tokenDoctype;
        },*/

        tokenBaseFactory = function(grammar, LOCALS) {
            
            var DEFAULT = LOCALS.DEFAULT,
                 
                //stack = [],
                
                tokens = grammar.TokenOrder || [],
                numTokens = tokens.length,
                
                hasIndent = grammar.hasIndent,
                indent = grammar.indent
            ;
            
            var tokenBase = function(stream, state) {
                
                var multiLineStrings = LOCALS.conf.multiLineStrings;
                
                var stackTop = null, i, tok, token, tokenType, tokenStyle, endMatcher;
                
                if ( stream.eatSpace() ) 
                {
                    state.lastToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                /*stackTop = stack[0] || null;
                if ( stackTop && stackTop[0].match(stream) )
                {
                    state.tokenize = stackTop[1];
                    return state.tokenize(stream, state);
                }*/
                    
                for (i=0; i<numTokens; i++)
                {
                    tok = tokens[i];
                    
                    if (!tok) continue;
                    
                    token = tok[0];
                    tokenType = tok[1];
                    tokenStyle = tok[2];
                    
                    // comments or general blocks, eg heredocs, cdata, meta, etc..
                    if ( ((T_COMMENT | T_BLOCK) & tokenType) &&  (endMatcher = token.match(stream)) )
                    {
                        state.tokenize = getBlockTokenizer(endMatcher, tokenType, tokenStyle);
                        return state.tokenize(stream, state);
                    }
                    
                    // strings
                    if ( (T_STRING & tokenType) && (endMatcher = token.match(stream)) )
                    {
                        state.tokenize = getStringTokenizer(endMatcher, tokenType, tokenStyle, multiLineStrings);
                        return state.tokenize(stream, state);
                    }
                    
                    // other types of tokens
                    if ( token.match(stream) )
                    {
                        state.lastToken = tokenType;
                        return tokenStyle;
                    }
                }
                
                // unknow, bypass
                stream.next();
                state.lastToken = T_DEFAULT;
                return DEFAULT;
            };
            
            tokenBase.type = T_TOKENBASE;
            return tokenBase;
        },
        
        tokenBaseMLFactory = function(grammar, LOCALS) {
            
            var DEFAULT = LOCALS.DEFAULT,
                
                stack = [],
                
                tokens = grammar.TokenOrder || [],
                numTokens = tokens.length,
                
                hasIndent = grammar.hasIndent,
                indent = grammar.indent
            ;
            
            return function(stream, state) {

                var multiLineStrings = LOCALS.conf.multiLineStrings;
                
                var stackTop = null, i, tok, token, tokenType, tokenStyle, endMatcher;
                
                if ( stream.eatSpace() ) 
                {
                    state.lastToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                stackTop = stack[0] || null;
                if ( stackTop && stackTop[0].match(stream) )
                {
                    state.tokenize = stackTop[1];
                    return state.tokenize(stream, state);
                }
                    
                for (i=0; i<numTokens; i++)
                {
                    tok = tokens[i];
                    
                    if (!tok) continue;
                    
                    token = tok[0];
                    tokenType = tok[1];
                    tokenStyle = tok[2];
                    
                    // comments or general blocks, eg cdata, meta, etc..
                    if ( ((T_COMMENT | T_BLOCK) & tokenType) && (endMatcher = token.match(stream)) )
                    {
                        state.tokenize = getBlockTokenizer(endMatcher, tokenType, tokenStyle);
                        return state.tokenize(stream, state);
                    }
                    
                    // doctypes, etc..
                    /*if ( (T_DOCTYPE & tokenType) && token.match(stream) )
                    {
                        state.tokenize = getDoctypeTokenizer(tokenStyle);
                        return state.tokenize(stream, state);
                    }*/
                    
                    // tags
                    if ( (T_TAG & tokenType) && (endMatcher = token.match(stream)) )
                    {
                        state.tokenize = getTagTokenizer(endMatcher, tokenType, tokenStyle, stack);
                        return state.tokenize(stream, state);
                    }
                    
                    // strings
                    if ( (T_STRING & tokenType) && (endMatcher = token.match(stream)) )
                    {
                        state.tokenize = getStringTokenizer(endMatcher, tokenType, tokenStyle, multiLineStrings);
                        return state.tokenize(stream, state);
                    }
                    
                    // (tag) attributes
                    if ( stack.length && (T_ATTRIBUTE & tokenType) && token.match(stream) )
                    {
                        state.lastToken = tokenType;
                        return tokenStyle;
                    }
                    
                    // other types of tokens
                    if ( !(T_ATTRIBUTE & tokenType) && token.match(stream) )
                    {
                        state.lastToken = tokenType;
                        return tokenStyle;
                    }
                }
                
                // unknow, bypass
                stream.next();
                state.lastToken = T_DEFAULT;
                return DEFAULT;
            };
            
            tokenBase.type = T_TOKENBASEML;
            return tokenBase;
        },

        tokenFactory = function(tokenBase, grammar, LOCALS) {
            
            var DEFAULT = LOCALS.DEFAULT,
                hasIndent = grammar.hasIndent
            ;
            
            var tokenMain = function(stream, state) {
                
                var
                    multiLineStrings = LOCALS.conf.multiLineStrings,
                    basecolumn = LOCALS.basecolumn || 0,
                    indentUnit = LOCALS.conf.indentUnit
                ;
                
                var ctx, codeStyle, tokType, current;
                
                LOCALS.indentInfo = null;
                
                if ( null == state.tokenize ) state.tokenize = tokenBase;
                
                codeStyle = state.tokenize(stream, state);
                //tokType = state.lastToken;
                //current = stream.current();
                return codeStyle;
                
                //if ( tokType == T_COMMENT || tokType == T_META ) return codeStyle;
                
                // Handle scope changes.
                /*if (current === 'pass' || current === 'return') 
                {
                    state.dedent += 1;
                }
                if (current === 'lambda') state.lambda = true;
                if ((current === ':' && !state.lambda && state.scopes[0].type == T_BLOCK_LEVEL)
                || LOCALS.indentInfo === T_DO_INDENT) 
                {
                    doIndent(stream, state);
                }
                var delimiter_index = '[({'.indexOf(current);
                if (delimiter_index !== -1) 
                {
                    doIndent(stream, state, '])}'.slice(delimiter_index, delimiter_index+1));
                }
                if (LOCALS.indentInfo === T_DO_DEDENT) 
                {
                    if (doDedent(state, stream)) 
                    {
                        return ret(state, T_DEFAULT, DEFAULT);
                    }
                }
                delimiter_index = '])}'.indexOf(current);
                if (delimiter_index !== -1) 
                {
                    if (doDedent(stream, state, current)) 
                    {
                        return ret(state, T_DEFAULT, DEFAULT);
                    }
                }
                if (state.dedent > 0 && stream.eol() && state.scopes[0].type == T_BLOCK_LEVEL) 
                {
                    if (state.scopes.length > 1) state.scopes.shift();
                        state.dedent -= 1;
                }
                
                return codeStyle;
                */
            };
            
            tokenMain.type = T_TOKEN;
            return tokenMain;
        },
        
        indentationFactory = function(LOCALS) {
            
            var DEFAULT = LOCALS.DEFAULT;
            
            return function(state, textAfter) {
                
                var basecolumn = LOCALS.basecolumn || 0,
                    indentUnit = LOCALS.conf.indentUnit
                ;
                
                // TODO
                return CodeMirror.Pass;
            };
        }
    ;
  