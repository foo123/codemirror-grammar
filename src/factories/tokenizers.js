    
    //
    // tokenizer factories
    var
        Indentation = function(offset, type, delim) {
            this.offset = offset || 0;
            this.type = type || T_TOP_LEVEL;
            this.delim = delim || "";
        },
        
        getIndentation = function(state) {
            return state.indents[0];
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
        
        getBlockTokenizer = function(endMatcher, type, style, nextTokenizer) {
            
            var tokenBlock;
            
            if (null == endMatcher)
            {
                // single line block, eg. single-line comment
                tokenBlock = function(stream, state) {
                    
                    stream.skipToEnd();
                    state.tokenize = nextTokenizer || null;
                    state.lastToken = type;
                    return style;
                };
            }
            else
            {
                tokenBlock = function(stream, state) {
                    
                    var found = false;
                    while (!stream.eol()) 
                    {
                        if (endMatcher(stream)) 
                        {
                            found = true;
                            break;
                        }
                        else stream.next();
                    }
                    if (found) state.tokenize = nextTokenizer || null;
                    state.lastToken = type;
                    return style;
                };
            }
            
            tokenBlock.__type = type;
            return tokenBlock;
        },
        
        getStringTokenizer = function(endMatcher, style, multiLineStrings, nextTokenizer) {
            
            var tokenString = function(stream, state) {
                
                var escaped = false, next, end = false;
                while (!stream.eol()) 
                {
                    if (endMatcher(stream) && !escaped) 
                    {
                        end = true; 
                        break;
                    }
                    else
                    {
                        next = stream.next();
                    }
                    escaped = !escaped && next == "\\";
                }
                if (end || !(escaped || multiLineStrings)) 
                    state.tokenize = nextTokenizer || null;
                
                state.lastToken = T_STRING;
                return style;
            };
            
            tokenString.__type = T_STRING;
            return tokenString;
        },
        
        getTagTokenizer = function(endMatcher, LOCALS, nextTokenizer) {
            
            var DEFAULT = LOCALS.DEFAULT,
                style = LOCALS.style;
            
            var tokenTag = function(stream, state) {
                var struct, endblock;
                
                var lastToken = state.lastToken;
                
                if (stream.eatSpace())
                {
                    state.lastToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                if (stream.match(/[a-zA-Z_][a-zA-Z_0-9\-]*\b/))
                {
                    state.lastToken = T_TAG;
                    return style.tag;
                }
                else if (
                    ( (T_TAG | T_ATTRIBUTE | T_STRING | T_DEFAULT) & lastToken ) 
                    && endMatcher(stream)
                )
                {
                    state.tokenize = nextTokenizer || null;
                    state.lastToken = T_ENDTAG;
                    return style.tag;
                }
                else if (
                    ( T_DEFAULT & lastToken )
                    && attributes && matchAny(stream, attributes)
                )
                {
                    state.lastToken = T_ATTRIBUTE;
                    return style.attribute;
                }
                else if (
                    ( T_ATTRIBUTE & lastToken )
                    && assignments && matchAny(stream, assignments)
                )
                {
                    state.lastToken = T_ASSIGNMENT;
                    return DEFAULT;
                }
                else if (
                    ( T_ASSIGNMENT & lastToken )
                    && strings && matchAny(strings)
                )
                {
                    state.tokenize = getStringTokenizer(getMatcher(stringEnd), style.string, false, tokenTag);
                    return state.tokenize(stream, state);
                }
                state.lastToken = T_ERROR;
                return style.error;
            };
            
            tokenTag.__type = T_TAG;
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
            
            tokenDoctype.__type = T_DOCTYPE;
            return tokenDoctype;
        },

        tokenBaseFactory = function(grammar, LOCALS, conf/*, parserConf*/) {
            
            var DEFAULT = LOCALS.DEFAULT,
                 
                multiLineStrings = conf.multiLineStrings,
               
                style = grammar.style,
                
                comments = grammar.comments.start || null,
                commentsEnd = grammar.comments.end || null,
                
                blocks = grammar.blocks.start || null,
                blocksEnd = grammar.blocks.end || null,
                blocks2 = grammar.blocks2.start || null,
                blocks2End = grammar.blocks2.end || null,
                blocks3 = grammar.blocks3.start || null,
                blocks3End = grammar.blocks3.end || null,
                
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
                
                atoms = grammar.atoms,
                meta = grammar.meta,
                defs = grammar.defines,
                keywords = grammar.keywords,
                builtins = grammar.builtins,
                operators = grammar.operators,
                delims = grammar.delimiters,
                
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
                
                var i, l, current, struct, endblock,
                    ctx, ctxOffset, lineOffset;
                
                if (stream.eatSpace()) 
                {
                    state.lastToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                //
                // Comments
                if ( comments && (struct = matchAny(stream, comments)) ) 
                {
                    endblock = commentsEnd[struct.key];
                    
                    // regex given, get the matched group for the ending of this comment
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_COMMENT, style.comment);
                    return state.tokenize(stream, state);
                }
                
                //
                // Blocks, eg. heredocs
                if ( blocks && (struct = matchAny(stream, blocks)) ) 
                {
                    endblock = blocksEnd[ struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block);
                    return state.tokenize(stream, state);
                }
                if ( blocks2 && (struct = matchAny(stream, blocks2)) ) 
                {
                    endblock = blocks2End[ struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block2);
                    return state.tokenize(stream, state);
                }
                if ( blocks3 && (struct = matchAny(stream, blocks3)) ) 
                {
                    endblock = blocks3End[ struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block3);
                    return state.tokenize(stream, state);
                }
                
                //
                // Numbers
                if (numbers && matchAny(stream, numbers))
                {
                    state.lastToken = T_NUMBER;
                    return style.number;
                }
                if (numbers2 && matchAny(stream, numbers2))
                {
                    state.lastToken = T_NUMBER;
                    return style.number2;
                }
                if (numbers3 && matchAny(stream, numbers3))
                {
                    state.lastToken = T_NUMBER;
                    return style.number3;
                }
                
                
                //
                // Strings
                if ( strings && (struct = matchAny(stream, strings)) ) 
                {
                    endblock = stringsEnd[struct.key];
                    
                    // regex given, get the matched group for the ending of this string
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getStringTokenizer(getMatcher(endblock), style.string, multiLineStrings);
                    return state.tokenize(stream, state);
                }
                if ( strings2 && (struct = matchAny(stream, strings2)) ) 
                {
                    endblock = strings2End[struct.key];
                    
                    // regex given, get the matched group for the ending of this string
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getStringTokenizer(getMatcher(endblock), style.string2, multiLineStrings);
                    return state.tokenize(stream, state);
                }
                if ( strings3 && (struct = matchAny(stream, strings3)) ) 
                {
                    endblock = strings3End[struct.key];
                    
                    // regex given, get the matched group for the ending of this string
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getStringTokenizer(getMatcher(endblock), style.string3, multiLineStrings);
                    return state.tokenize(stream, state);
                }
                
                //
                // multi-character Delimiters
                if ( delims &&
                    (   (delims.three && matchAny(stream, delims.three)) || 
                        (delims.two && matchAny(stream, delims.two))    )
                ) 
                {
                    state.lastToken = T_DELIM;
                    return style.delimiter;
                }
                
                //
                // Operators
                if ( operators && 
                    (   ( operators.two && matchAny(stream, operators.two) ) ||
                        ( operators.one && matchAny(stream, operators.one) ) ||
                        ( operators.words && matchAny(stream, operators.words) )    )
                )
                {
                    state.lastToken = T_OP;
                    return style.operator;
                }
                
                //
                // single-character Delimiters
                if (delims && delims.one && matchAny(stream, delims.one)) 
                {
                    state.lastToken = T_DELIM;
                    return style.delimiter;
                }
                
                //
                // Atoms
                if (atoms && matchAny(stream, atoms)) 
                {
                    state.lastToken = T_ATOM;
                    return style.atom;
                }
                
                //
                // Meta
                if (meta && matchAny(stream, meta)) 
                {
                    state.lastToken = T_META;
                    return style.meta;
                }
                
                //
                // Defs
                if (defs && matchAny(stream, defs)) 
                {
                     state.lastToken = T_DEF;
                    return style.defines;
               }
                
                //
                // Keywords
                if (keywords && matchAny(stream, keywords)) 
                {
                    current = stream.current();
                    /*if (blockKeywords[current]) 
                    {
                        state.__indentType = T_BLOCK_LEVEL;
                        state.__indentDelim = "keyword_" + current;
                    }*/
                    state.lastToken = T_KEYWORD;
                    return style.keyword;
                }
                
                //
                // Builtins
                if (builtins && matchAny(stream, builtins)) 
                {
                    current = stream.current();
                    /*if (blockKeywords[current])
                    {
                        state.__indentType = T_BLOCK_LEVEL;
                        state.__indentDelim = "builtin_" + current;
                    }*/
                    state.lastToken = T_BUILTIN;
                    return style.builtin;
                }
                
                //
                // General Identifiers, variables etc..
                if (identifiers && matchAny(stream, identifiers)) 
                {
                    state.lastToken = T_IDENTIFIER;
                    return style.identifier;
                }
                if (identifiers2 && matchAny(stream, identifiers2)) 
                {
                    state.lastToken = T_IDENTIFIER;
                    return style.identifier2;
                }
                if (identifiers3 && matchAny(stream, identifiers3)) 
                {
                    state.lastToken = T_IDENTIFIER;
                    return style.identifier3;
                }
                if (identifiers4 && matchAny(stream, identifiers4)) 
                {
                    state.lastToken = T_IDENTIFIER;
                    return style.identifier4;
                }
                if (identifiers5 && matchAny(stream, identifiers5)) 
                {
                    state.lastToken = T_IDENTIFIER;
                    return style.identifier5;
                }
                
                // bypass
                stream.next();
                state.lastToken = T_DEFAULT;
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
                    state.lastToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                //
                // Comments
                if ( comments && (struct = matchAny(stream, comments)) ) 
                {
                    var key = struct.key, val = struct.val, endcomment = commentsEnd[key];
                    
                    // regex given, get the matched group for the ending of this comment
                    if ( is_number(endcomment) )  endcomment = val[endcomment];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endcomment), T_COMMENT, style.comment);
                    return state.tokenize(stream, state);
                }
                
                //
                // Blocks, eg. cdata
                if ( blocks && (struct = matchAny(stream, blocks)) ) 
                {
                    endblock = blocksEnd[ struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block);
                    return state.tokenize(stream, state);
                }
                if ( blocks2 && (struct = matchAny(stream, blocks2)) ) 
                {
                    endblock = blocks2End[ struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block2);
                    return state.tokenize(stream, state);
                }
                if ( blocks3 && (struct = matchAny(stream, blocks3)) ) 
                {
                    endblock = blocks3End[ struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block3);
                    return state.tokenize(stream, state);
                }
                
                //
                // Doctype, etc..
                if ( doctype && (struct = matchAny(stream, doctype)) ) 
                {
                    var key = struct.key, val = struct.val, enddoctype = doctypeEnd[key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(enddoctype) )  enddoctype = val[enddoctype];
                    
                    state.tokenize = getDoctypeTokenizer(style.doctype);
                    return state.tokenize(stream, state);
                }
                
                //
                // Meta
                if ( meta && (struct = matchAny(stream, meta)) ) 
                {
                    var key = struct.key, val = struct.val, endmeta = metaEnd[key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endmeta) )  endmeta = val[endmeta];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endmeta), T_META, style.meta);
                    return state.tokenize(stream, state);
                }
                
                //
                // Atoms
                if (atoms && matchAny(stream, atoms)) 
                {
                    state.lastToken = T_ATOM;
                    return style.atom;
                }
                
                //
                // Tags
                if ( tags && (struct = matchAny(stream, tags)) ) 
                {
                    var key = struct.key, val = struct.val, endtag = tagEnd[key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endtag) )  endtag = val[endtag];
                    
                    state.tokenize = getTagTokenizer(getMatcher(endtag), T_TAG, style.tag);
                    return state.tokenize(stream, state);
                }
                
                // bypass
                stream.next();
                state.lastToken = T_DEFAULT;
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
                
                hasIndent = grammar.hasIndent
            ;
            
            var tokenMain = function(stream, state) {
                
                var i, l, ctx, 
                    codeStyle, tokType, current,
                    indentType, indentDelim, indentFound = false;
                
                LOCALS.indentInfo = null;
                
                if ( null == state.tokenize ) state.tokenize = tokenBase;
                
                codeStyle = state.tokenize(stream, state);
                tokType = state.lastToken;
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
        
        indentationFactory = function(LOCALS, conf/*, parserConf*/) {
            
            var DEFAULT = LOCALS.DEFAULT,
                basecolumn = LOCALS.basecolumn || 0,
                
                indentUnit = conf.indentUnit
            ;
            
            return function(state, textAfter) {
                
                var ctx;
                return CodeMirror.Pass;
            };
        }
    ;
  