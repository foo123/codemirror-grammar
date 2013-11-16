    
    //
    // tokenizer factories
    var
        /*Indentation = function(offset, type, delim) {
            this.offset = offset || 0;
            this.type = type || T_TOP_LEVEL;
            this.delim = delim || "";
        },
        
        getIndentation = function(state) {
            return state.indents[0];
        },*/
        
        /*doIndent = function(state, type, col, current, conf_indentUnit) {
            type = type || T_BLOCK_LEVEL;
            var indentUnit = 0, i, l, ctx = state.__indents[0];
            if (T_BLOCK_LEVEL === type) 
            {
                if (T_BLOCK_LEVEL !== ctx.type) 
                {
                    ctx.offset = stream.indentation();
                    return;
                }
                for (i=0, l=state.__indents.length; i < l; ++i) 
                {
                    ctx = state.__indents[i];
                    if (T_BLOCK_LEVEL === ctx.type) 
                    {
                        indentUnit = ctx.offset + conf_indentUnit;
                        break;
                    }
                }
            } 
            else 
            {
                indentUnit = col + current.length;
            }
            
            state.__indents.unshift( new Indentation(indentUnit, type) );
        },

        doDedent = function(state, stream, type, delim) {
            type = type || T_BLOCK_LEVEL;
            if (state.__indents.length == 1) return;
            
            var i, l, 
                _indent, _indent_index,
                ctx = state.__indents[0];
            
            if (T_BLOCK_LEVEL === ctx.type) 
            {
                _indent = stream.indentation();
                _indent_index = -1;
                for (i=0, l=state.__indents.length; i < l; ++i) 
                {
                    ctx = state.__indents[i];
                    if (_indent === ctx.offset) 
                    {
                        _indent_index = i;
                        break;
                    }
                }
                if (_indent_index === -1) 
                {
                    return true;
                }
                while (state.__indents[0].offset !== _indent) 
                {
                    state.__indents.shift();
                }
                return false;
            } 
            else 
            {
                if (T_BLOCK_LEVEL === type) 
                {
                    state.__indents[0].offset = stream.indentation();
                    return false;
                } 
                else 
                {
                    if (state.__indents[0].type != type) 
                    {
                        return true;
                    }
                    state.__indents.shift();
                    return false;
                }
            }
        },*/
        
        getBlockTokenizer = function(endBlock, type, style, nextTokenizer) {
            
            var tokenBlock = function(stream, state) {
                
                var ended = false;
                while (!stream.eol()) 
                {
                    if ( endBlock.match(stream) ) 
                    {
                        ended = true;
                        break;
                    }
                    else stream.next();
                }
                if ( ended ) state.tokenize = nextTokenizer || null;
                state.lastToken = type;
                return style;
            };
            
            tokenBlock.type = type | T_BLOCK;
            return tokenBlock;
        },
        
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
                if ( ended || !( escaped || multiLineStrings ) )   state.tokenize = nextTokenizer || null;
                state.lastToken = type;
                return style;
            };
            
            tokenString.type = type;
            return tokenString;
        },
        
        getTagTokenizer = function(endTag, LOCALS, nextTokenizer) {
            
            var DEFAULT = LOCALS.DEFAULT,
                style = LOCALS.style,
                
                tagName = LOCALS.tagNames,
                attribute = LOCALS.attributes,
                assignment = LOCALS.assignments,
                string = LOCALS.strings,
                
                foundTag = false,
                tag_name = ''
                ;
            
            var tokenTag = function(stream, state) {
                
                var token, endString,
                    lastToken = state.lastToken;
                
                if ( !foundTag && tagName && (token = tagName.match(stream)) )
                {
                    //tag_name = token.val;
                    state.lastToken = T_TAG;
                    foundTag = true;
                    return style.tag;
                }
                
                if ( foundTag )
                {
                    if ( stream.eatSpace() )
                    {
                        state.lastToken = T_DEFAULT;
                        return DEFAULT;
                    }
                    
                    if (
                        //( (T_TAG | T_ATTRIBUTE | T_STRING | T_DEFAULT) & lastToken ) &&
                        endTag.match(stream)
                    )
                    {
                        state.tokenize = nextTokenizer || null;
                        state.lastToken = T_ENDTAG;
                        return style.tag;
                    }
                    
                    if (
                        //( T_DEFAULT & lastToken ) &&
                        attribute && attribute.match(stream)
                    )
                    {
                        state.lastToken = T_ATTRIBUTE;
                        return style.attribute;
                    }
                    
                    if (
                        //( T_ATTRIBUTE & lastToken ) &&
                        assignment && assignment.match(stream)
                    )
                    {
                        state.lastToken = T_ASSIGNMENT;
                        return DEFAULT;
                    }
                    
                    if (
                        //( T_ASSIGNMENT & lastToken ) &&
                        string && (endString = string.match(stream))
                    )
                    {
                        state.tokenize = getStringTokenizer(endString, T_STRING, style.string, false, tokenTag);
                        return state.tokenize(stream, state);
                    }
                    
                    state.lastToken = T_DEFAULT;
                    return DEFAULT;
                }
                else
                {
                    state.lastToken = T_ERROR;
                    return style.error;
                }
            };
            
            tokenTag.type = T_TAG;
            return tokenTag;
        },

        getDoctypeTokenizer = function(style, nextTokenizer) {
            
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
        },

        tokenBaseFactory = function(grammar, LOCALS) {
            
            var DEFAULT = LOCALS.DEFAULT,
                 
                style = grammar.Style || {},
                
                tokens = grammar.TokenOrder || [],
                numTokens = tokens.length,
                
                hasIndent = grammar.hasIndent,
                indent = grammar.indent
            ;
            
            var tokenBase = function(stream, state) {
                
                var
                    multiLineStrings = LOCALS.conf.multiLineStrings
                ;
                
                var i, tok, token, tokenType, tokenStyle, endMatcher;
                
                if ( stream.eatSpace() ) 
                {
                    state.lastToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                for (i=0; i<numTokens; i++)
                {
                    tok = tokens[i];
                    
                    if (!tok) continue;
                    
                    token = tok[0];
                    tokenType = tok[1];
                    tokenStyle = tok[2];
                    
                    // comments or general blocks, eg heredocs, cdata, meta, etc..
                    if ( (T_COMMENT | T_BLOCK) & tokenType )
                    {
                        if ( (endMatcher = token.match(stream)) )
                        {
                            state.tokenize = getBlockTokenizer(endMatcher, tokenType, tokenStyle);
                            return state.tokenize(stream, state);
                        }
                    }
                    
                    // strings
                    if ( T_STRING & tokenType )
                    {
                        if ( (endMatcher = token.match(stream)) )
                        {
                            state.tokenize = getStringTokenizer(endMatcher, tokenType, tokenStyle, multiLineStrings);
                            return state.tokenize(stream, state);
                        }
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
                
                style = grammar.Style || {},
                
                tokens = grammar.TokenOrder || [],
                numTokens = tokens.length,
                
                tagNames = grammar.tagNames || null,
                
                attributes = grammar.attributes || null,
                attributes2 = grammar.attributes2 || null,
                attributes3 = grammar.attributes3 || null,
                
                assignments = grammar.assignments || null,
                
                hasIndent = grammar.hasIndent,
                indent = grammar.indent
            ;
            
            return function(stream, state) {

                var
                    multiLineStrings = LOCALS.conf.multiLineStrings
                ;
                
                var i, tok, token, tokenType, tokenStyle, endMatcher;
                
                if ( stream.eatSpace() ) 
                {
                    state.lastToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                for (i=0; i<numTokens; i++)
                {
                    tok = tokens[i];
                    
                    if (!tok) continue;
                    
                    token = tok[0];
                    tokenType = tok[1];
                    tokenStyle = tok[2];
                    
                    // comments or general blocks, eg cdata, meta, etc..
                    if ( (T_COMMENT | T_BLOCK) & tokenType )
                    {
                        if ( (endMatcher = token.match(stream)) )
                        {
                            state.tokenize = getBlockTokenizer(endMatcher, tokenType, tokenStyle);
                            return state.tokenize(stream, state);
                        }
                    }
                    
                    // doctypes, etc..
                    if ( T_DOCTYPE & tokenType )
                    {
                        if (token.match(stream)) 
                        {
                            state.tokenize = getDoctypeTokenizer(tokenStyle);
                            return state.tokenize(stream, state);
                        }
                    }
                    
                    // tags
                    if ( T_TAG & tokenType )
                    {
                        if ( (endMatcher = token.match(stream)) ) 
                        {
                            // pass any necessary data to the tokenizer
                            LOCALS.style = style;
                            LOCALS.tagNames = tagNames;
                            LOCALS.attributes = attributes;
                            LOCALS.assignments = assignments;
                            LOCALS.strings = grammar.strings;
                            
                            state.tokenize = getTagTokenizer(endMatcher, LOCALS);
                            return state.tokenize(stream, state);
                        }
                    }
                    
                    // strings
                    if ( T_STRING & tokenType )
                    {
                        if ( (endMatcher = token.match(stream)) )
                        {
                            state.tokenize = getStringTokenizer(endMatcher, tokenType, tokenStyle, multiLineStrings);
                            return state.tokenize(stream, state);
                        }
                    }
                    
                    // other types of tokens
                    if ( token.match(stream) )
                    {
                        state.lastToken = tokenType;
                        return tokenStyle;
                    }
                }
                
                // unknown, bypass
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
            
            var DEFAULT = LOCALS.DEFAULT
            ;
            
            return function(state, textAfter) {
                
                var
                    basecolumn = LOCALS.basecolumn || 0,
                    indentUnit = LOCALS.conf.indentUnit
                ;
                
                var ctx;
                
                // TODO
                return CodeMirror.Pass;
            };
        }
    ;
  