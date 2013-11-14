    
    //
    // tokenizer factories
    var
        Indentation = function(offset, type, delim) {
            this.offset = offset || 0;
            this.type = type || T_TOP_LEVEL;
            this.delim = delim || "";
        },
        
        getIndentation = function(state) {
            return state.__indents[0];
        },
        
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
        
        tokenBlockFactory = function(delim, type, style, nextTokenizer) {
            
            var tokenBlock;
            
            if (null == delim)
            {
                // single line block, eg. single-line comment
                tokenBlock = function(stream, state) {
                    
                    stream.skipToEnd();
                    state.tokenize = nextTokenizer || null;
                    state.__lastToken = type;
                    return style;
                };
            }
            else
            {
                tokenBlock = function(stream, state) {
                    
                    var found = false;
                    while (!stream.eol()) 
                    {
                        if (stream.match(delim)) 
                        {
                            found = true;
                            break;
                        }
                        else stream.next();
                    }
                    if (found) state.tokenize = nextTokenizer || null;
                    state.__lastToken = type;
                    return style;
                };
            }
            
            tokenBlock.__type = type;
            return tokenBlock;
        },
        
        tokenStringFactory = function(delim, style, multiLineStrings, nextTokenizer) {
            
            var tokenString = function(stream, state) {
                
                var escaped = false, next, end = false;
                while ((next = stream.next()) != null) 
                {
                    if (next == delim && !escaped) 
                    {
                        end = true; 
                        break;
                    }
                    escaped = !escaped && next == "\\";
                }
                if (end || !(escaped || multiLineStrings)) 
                    state.tokenize = nextTokenizer || null;
                
                state.__lastToken = T_STRING;
                return style;
            };
            
            tokenString.__type = T_STRING;
            return tokenString;
        },
        
        tokenTagFactory = function(delim, style, nextTokenizer) {
            
            var DEFAULT = null;
            
            var tokenTag = function(stream, state) {
                
                if (stream.eatSpace())
                {
                    state.__lastToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                if (stream.match(delim))
                {
                    state.tokenize = nextTokenizer || null;
                    state.__lastToken = T_ENDTAG;
                    return style.tag;
                }
                else if (stream.match(attributes))
                {
                    state.__lastToken = T_ATTRIBUTE;
                    return style.attribute;
                }
                else if (stream.match(attribute_assignments))
                {
                    type = "equals";
                    state.__lastToken = T_DEFAULT;
                    return DEFAULT;
                }
                else if (stream.match(strings))
                {
                    state.tokenize = tokenStringFactory(stringEnd, style.string, false, tokenTag);
                    return state.tokenize(stream, state);
                }
                state.__lastToken = T_DEFAULT;
                return DEFAULT;
            };
            
            tokenTag.__type = T_TAG;
            return tokenTag;
        },

        tokenDoctypeFactory = function(style, nextTokenizer) {
            
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
                
                state.__lastToken = T_DOCTYPE;
                return style;
            };
            
            tokenDoctype.__type = T_DOCTYPE;
            return tokenDoctype;
        },

        tokenBaseFactory = function(grammar, LOCALS, conf/*, parserConf*/) {
            
            var DEFAULT = LOCALS.DEFAULT,
                 
                multiLineStrings = conf.multiLineStrings,
               
                style = grammar.style,
                
                heredoc = grammar.heredoc.start || null,
                heredocEnd = grammar.heredoc.end || null,
                
                comments = grammar.comments.start || null,
                commentsEnd = grammar.comments.end || null,
                
                strings = grammar.strings.start || null,
                stringsEnd = grammar.strings.end || null,
                strings2 = grammar.strings2.start || null,
                strings2End = grammar.strings2.end || null,
                strings3 = grammar.strings3.start || null,
                strings3End = grammar.strings3.end || null,
                
                identifiers = grammar.identifiers,
                identifiers2 = grammar.identifiers2,
                identifiers3 = grammar.identifiers3,
                identifiers4 = grammar.identifiers4,
                identifiers5 = grammar.identifiers5,
                
                numbers = grammar.numbers,
                numbers2 = grammar.numbers2,
                numbers3 = grammar.numbers3,
                
                operators = grammar.operators,
                atoms = grammar.atoms,
                meta = grammar.meta,
                defs = grammar.defines,
                keywords = grammar.keywords,
                builtins = grammar.builtins,
                delims = grammar.delimiters.
                
                hasIndent = grammar.hasIndent,
                indent = grammar.indent//,
                /*indentBlockLevel = indent["block-level"] || {},
                indentStatementLevel = indent["statement-level"] || {},
                indentBlockDelims = indentBlockLevel.delims.start || null,
                indentBlockDelimsEnd = indentBlockLevel.delims.end || null,
                blockKeywords = indentBlockLevel.keywords || {},
                indentStatementDelims = indentStatementLevel.delims || []*/
            ;
            
            var tokenBase = function(stream, state) {
                
                var i, l, current, struct, 
                    ctx, ctxOffset, lineOffset;
                
                // Handle indentation changes
                // start of line
                /*if (hasIndent && stream.sol()) 
                {
                    ctx = getIndentation(state);
                    ctxOffset = ctx.offset;
                    if (stream.eatSpace()) 
                    {
                        lineOffset = stream.indentation();
                        
                        if (lineOffset > ctxOffset) 
                        {
                            LOCALS.indentInfo = T_DO_INDENT;
                        } 
                        else if (lineOffset < ctxOffset) 
                        {
                            LOCALS.indentInfo = T_DO_DEDENT;
                        }
                        return ret(state, T_DEFAULT, DEFAULT);
                    } 
                    else 
                    {
                        if (ctxOffset > 0) 
                        {
                            doDedent(state, stream);
                        }
                    }
                }*/
                
                if (stream.eatSpace()) 
                {
                    state.__lastToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                //
                // Heredocs
                if (heredoc) 
                {
                    struct = streamGetMatchAnyWithKey(stream, heredoc);
                    if (struct)
                    {
                        var key = struct.key, val = struct.val, endheredoc = heredocEnd[key];
                        
                        // regex given, get the matched group for the ending of this heredoc
                        if ( is_number(endheredoc) )  endheredoc = val[endheredoc];
                        
                        state.tokenize = tokenBlockFactory(endheredoc, T_HEREDOC, style.heredoc);
                        return state.tokenize(stream, state);
                    }
                }
                
                //
                // Comments
                if (comments) 
                {
                    struct = streamGetMatchAnyWithKey(stream, comments);
                    if (struct)
                    {
                        var key = struct.key, val = struct.val, endcomment = commentsEnd[key];
                        
                        // regex given, get the matched group for the ending of this comment
                        if ( is_number(endcomment) )  endcomment = val[endcomment];
                        
                        state.tokenize = tokenBlockFactory(endcomment, T_COMMENT, style.comment);
                        return state.tokenize(stream, state);
                    }
                }
                
                //
                // Numbers
                if (numbers && streamMatchAny(stream, numbers))
                {
                    state.__lastToken = T_NUMBER;
                    return style.number;
                }
                if (numbers2 && streamMatchAny(stream, numbers2))
                {
                    state.__lastToken = T_NUMBER;
                    return style.number2;
                }
                if (numbers3 && streamMatchAny(stream, numbers3))
                {
                    state.__lastToken = T_NUMBER;
                    return style.number3;
                }
                
                
                //
                // Strings
                if (strings) 
                {
                    struct = streamGetMatchAnyWithKey(stream, strings);
                    if (struct)
                    {
                        var key = struct.key, val = struct.val, endstring = stringsEnd[key];
                        
                        // regex given, get the matched group for the ending of this string
                        if ( is_number(endstring) )  endstring = val[endstring];
                        
                        state.tokenize = tokenStringFactory(endstring, style.string, multiLineStrings);
                        return state.tokenize(stream, state);
                    }
                }
                if (strings2) 
                {
                    struct = streamGetMatchAnyWithKey(stream, strings2);
                    if (struct)
                    {
                        var key = struct.key, val = struct.val, endstring = strings2End[key];
                        
                        // regex given, get the matched group for the ending of this string
                        if ( is_number(endstring) )  endstring = val[endstring];
                        
                        state.tokenize = tokenStringFactory(endstring, style.string2, multiLineStrings);
                        return state.tokenize(stream, state);
                    }
                }
                if (strings3) 
                {
                    struct = streamGetMatchAnyWithKey(stream, strings3);
                    if (struct)
                    {
                        var key = struct.key, val = struct.val, endstring = strings3End[key];
                        
                        // regex given, get the matched group for the ending of this string
                        if ( is_number(endstring) )  endstring = val[endstring];
                        
                        state.tokenize = tokenStringFactory(endstring, style.string3, multiLineStrings);
                        return state.tokenize(stream, state);
                    }
                }
                
                //
                // multi-character Delimiters
                if ( delims &&
                    (   (delims.three && stream.match(delims.three)) || 
                        (delims.two && stream.match(delims.two))    )
                ) 
                {
                    state.__lastToken = T_DELIM;
                    return style.delimiter;
                }
                
                //
                // Operators
                if ( operators && 
                    (   ( operators.two && stream.match(operators.two) ) ||
                        ( operators.one && stream.match(operators.one) ) ||
                        ( operators.words && stream.match(operators.words) )    )
                )
                {
                    state.__lastToken = T_OP;
                    return style.operator;
                }
                
                //
                // single-character Delimiters
                if (delims && delims.one && stream.match(delims.one)) 
                {
                    state.__lastToken = T_DELIM;
                    return style.delimiter;
                }
                
                //
                // Atoms
                if (atoms && stream.match(atoms)) 
                {
                    state.__lastToken = T_ATOM;
                    return style.atom;
                }
                
                //
                // Meta
                if (meta && stream.match(meta)) 
                {
                    state.__lastToken = T_META;
                    return style.meta;
                }
                
                //
                // Defs
                if (defs && stream.match(defs)) 
                {
                     state.__lastToken = T_DEF;
                    return style.defines;
               }
                
                //
                // Keywords
                if (keywords && stream.match(keywords)) 
                {
                    current = stream.current();
                    /*if (blockKeywords[current]) 
                    {
                        state.__indentType = T_BLOCK_LEVEL;
                        state.__indentDelim = "keyword_" + current;
                    }*/
                    state.__lastToken = T_KEYWORD;
                    return style.keyword;
                }
                
                //
                // Builtins
                if (builtins && stream.match(builtins)) 
                {
                    current = stream.current();
                    /*if (blockKeywords[current])
                    {
                        state.__indentType = T_BLOCK_LEVEL;
                        state.__indentDelim = "builtin_" + current;
                    }*/
                    state.__lastToken = T_BUILTIN;
                    return style.builtin;
                }
                
                //
                // identifiers, variables etc..
                if (identifiers && streamMatchAny(stream, identifiers)) 
                {
                    state.__lastToken = T_IDENTIFIER;
                    return style.identifier;
                }
                if (identifiers2 && streamMatchAny(stream, identifiers2)) 
                {
                    state.__lastToken = T_IDENTIFIER;
                    return style.identifier2;
                }
                if (identifiers3 && streamMatchAny(stream, identifiers3)) 
                {
                    state.__lastToken = T_IDENTIFIER;
                    return style.identifier3;
                }
                if (identifiers4 && streamMatchAny(stream, identifiers4)) 
                {
                    state.__lastToken = T_IDENTIFIER;
                    return style.identifier4;
                }
                if (identifiers5 && streamMatchAny(stream, identifiers5)) 
                {
                    state.__lastToken = T_IDENTIFIER;
                    return style.identifier5;
                }
                
                // bypass
                stream.next();
                state.__lastToken = T_DEFAULT;
                return DEFAULT;
            };
            
            tokenBase.__type = T_TOKENBASE;
            return tokenBase;
        },
        
        tokenBaseMLFactory = function(grammar, LOCALS, conf) {
            
            var DEFAULT = LOCALS.DEFAULT
            ;
            
            return function(stream, state) {

                if (stream.eatSpace()) 
                {
                    state.__lastToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                //
                // Cdata
                if (cdata) 
                {
                    struct = streamGetMatchAnyWithKey(stream, cdata);
                    if (struct)
                    {
                        var key = struct.key, val = struct.val, endcdata = cdataEnd[key];
                        
                        // regex given, get the matched group for the ending of this heredoc
                        if ( is_number(endcdata) )  endcdata = val[endcdata];
                        
                        state.tokenize = tokenBlockFactory(endcdata, T_CDATA, style.cdata);
                        return state.tokenize(stream, state);
                   }
                }
                
                //
                // Comments
                if (comments) 
                {
                    struct = streamGetMatchAnyWithKey(stream, comments);
                    if (struct)
                    {
                        var key = struct.key, val = struct.val, endcomment = commentsEnd[key];
                        
                        // regex given, get the matched group for the ending of this comment
                        if ( is_number(endcomment) )  endcomment = val[endcomment];
                        
                        state.tokenize = tokenBlockFactory(endcomment, T_COMMENT, style.comment);
                        return state.tokenize(stream, state);
                    }
                }
                
                //
                // Doctype, etc..
                if (doctype) 
                {
                    struct = streamGetMatchAnyWithKey(stream, doctype);
                    if (struct)
                    {
                        var key = struct.key, val = struct.val, enddoctype = doctypeEnd[key];
                        
                        // regex given, get the matched group for the ending of this heredoc
                        if ( is_number(enddoctype) )  enddoctype = val[enddoctype];
                        
                        state.tokenize = tokenDoctypeFactory(style.doctype);
                        return state.tokenize(stream, state);
                    }
                }
                
                //
                // Meta
                if (meta) 
                {
                    struct = streamGetMatchAnyWithKey(stream, meta);
                    if (struct)
                    {
                        var key = struct.key, val = struct.val, endmeta = metaEnd[key];
                        
                        // regex given, get the matched group for the ending of this heredoc
                        if ( is_number(endmeta) )  endmeta = val[endmeta];
                        
                        state.tokenize = tokenBlockFactory(endmeta, T_META, style.meta);
                        return state.tokenize(stream, state);
                    }
                }
                
                //
                // Tags
                if (tags) 
                {
                    struct = streamGetMatchAnyWithKey(stream, tags);
                    if (struct)
                    {
                        var key = struct.key, val = struct.val, endtag = tagEnd[key];
                        
                        // regex given, get the matched group for the ending of this heredoc
                        if ( is_number(endtag) )  endtag = val[endtag];
                        
                        state.tokenize = tokenTagFactory(endtag, T_TAG, style.tag);
                        return state.tokenize(stream, state);
                    }
                }
                
                //
                // Atoms
                if (atoms && stream.match(atoms)) 
                {
                    state.__lastToken = T_ATOM;
                    return style.atom;
                }
                
                // bypass
                stream.next();
                state.__lastToken = T_DEFAULT;
                return DEFAULT;
            };
            
            tokenBase.__type = T_TOKENBASEML;
            return tokenBase;
        },

        tokenFactory = function(tokenBase, grammar, LOCALS, conf/*, parserConf*/) {
            
            var DEFAULT = LOCALS.DEFAULT,
                basecolumn = LOCALS.basecolumn || 0,
                
                indentUnit = conf.indentUnit,
                
                style = grammar.style,
                
                hasIndent = grammar.hasIndent//,
                /*indent = grammar.indent,
                indentBlockLevel = indent["block-level"] || {},
                indentStatementLevel = indent["statement-level"] || {},
                indentBlockDelims = indentBlockLevel.delims.start || null,
                indentBlockDelimsEnd = indentBlockLevel.delims.end || null,
                mainIndentBlockStartDelim = (indentBlockDelims) ? indentBlockDelims[0] : null,
                mainIndentBlockEndDelim = (indentBlockDelimsEnd) ? indentBlockDelimsEnd[0] : null,
                indentStatementDelims = indentStatementLevel.delims || []*/
            ;
            
            var tokenMain = function(stream, state) {
                
                var i, l, ctx, 
                    codeStyle, tokType, current,
                    indentType, indentDelim, indentFound = false;
                
                LOCALS.indentInfo = null;
                
                if ( null == state.tokenize ) state.tokenize = tokenBase;
                
                codeStyle = state.tokenize(stream, state);
                tokType = state.__lastToken;
                current = stream.current();
                
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
                }*/
                
                return codeStyle;
            };
            
            tokenMain.__type = T_TOKEN;
            return tokenMain;
        },
        
        indentationFactory = function(tokenBase, grammar, LOCALS, conf/*, parserConf*/) {
            
            var DEFAULT = LOCALS.DEFAULT,
                basecolumn = LOCALS.basecolumn || 0,
                
                indentUnit = conf.indentUnit,
                
                hasIndent = grammar.hasIndent
            ;
            
            return function(state, textAfter) {
                
                var ctx;
                
                return CodeMirror.Pass;
                /*
                if ( !hasIndent ) return CodeMirror.Pass;
                
                if ( state.tokenize != tokenBase )
                    return (state.tokenize.__type == T_STRING ? CodeMirror.Pass : 0;
                
                ctx = getIndentation(state);
                return ctx.offset;*/
            };
        }
    ;
  