(function(root, undef){
    
    var self, _VERSION_ = "0.1";
    
    // IE8- mostly
    if ( !Array.prototype.indexOf ) 
    {
        var Abs = Math.abs;
        
        Array.prototype.indexOf = function (searchElement , fromIndex) {
            var i,
                pivot = (fromIndex) ? fromIndex : 0,
                length;

            if ( !this ) 
            {
                throw new TypeError();
            }

            length = this.length;

            if (length === 0 || pivot >= length)
            {
                return -1;
            }

            if (pivot < 0) 
            {
                pivot = length - Abs(pivot);
            }

            for (i = pivot; i < length; i++) 
            {
                if (this[i] === searchElement) 
                {
                    return i;
                }
            }
            return -1;
        };
    }
    
    var ESC = /([\-\.\*\+\?\^\$\{\}\(\)\|\[\]\/\\])/g,
    
        slice = Array.prototype.slice, 
        
        hasKey = Object.prototype.hasOwnProperty,
        
        Str = Object.prototype.toString,

        is_number = function(n) {
            return ('number'==typeof(n) || n instanceof Number);
        },
        
        is_string = function(s) {
            return (s && ('string'==typeof(s) || s instanceof String));
        },
        
        is_array = function(a) {
            return (a && "[object Array]"==Str.call(a));
        },
        
        is_object = function(o) {
            return (o && "[object Object]"==Str.call(o));
        },
        
        make_array = function(a) {
            return (is_array(a)) ? a : [a];
        },
        
        clone = function(o) {
            if (!is_object(o) && !is_array(o)) return o;
            
            var co = {};
            for (var k in o) 
            {
                if (hasKey.call(o, k)) 
                { 
                    if (is_object(o[k]))
                        co[k] = clone(o[k]);
                    else if (is_array(o[k]))
                        co[k] = o[k].slice();
                    else
                        co[k] = o[k]; 
                }
            }
            return co;
        },
        
        extend = function(o1, o2) {
            if (!is_object(o2) && !is_array(o2)) return clone(o1);
            
            var o = {}; 
            for (var k in o2) 
            { 
                if (hasKey.call(o2, k))
                {
                    if (hasKey.call(o1, k)) 
                    { 
                        if (is_object(o1[k]) && !is_string(o1[k]))
                        {
                            o[k] = extend(o1[k], o2[k]);
                        }
                        else if (is_array(o1[k]))
                        {
                            o[k] = o1[k].slice();
                        }
                        else
                        {
                            o[k] = o1[k];
                        }
                    }
                    else
                    {
                        o[k] = clone(o2[k]);
                    }
                }
            }
            return o;
        },
        
        getRegexp = function(rstr, rxid)  {
            if ( is_number(rstr) ) return rstr;
            
            var l = (rxid) ? rxid.length : 0;
            
            if ( l && rxid == rstr.substr(0, l) )
                return new RegExp("^" + rstr.substr(l) + "");
            
            else
                return rstr;
        },
        
        getCombinedRegexp = function(words)  {
            for (var i=0, l=words.length; i<l; i++) words[i] = words[i].replace(ESC, '\\$1');
            return new RegExp("^((" + words.join(")|(") + "))\\b");
        },
        
        streamMatchAny = function(stream, rs, eat) {
            eat = (undef===eat) ? true : eat;
            var i, l=rs.length;
            for (i=0; i<l; i++)
                if (stream.match(rs[i], eat)) return true;
            return false;
        },
        
        streamGetMatchAny = function(stream, rs, eat) {
            eat = (undef===eat) ? true : eat;
            var i, l=rs.length, m;
            for (i=0; i<l; i++)
            {
                m = stream.match(rs[i], eat);
                if (m) return is_string( rs[i] ) ? rs[i] : m;
            }
            return false;
        },
        
        streamGetMatchAnyWithKey = function(stream, rs, eat) {
            eat = (undef===eat) ? true : eat;
            var i, l=rs.length, m;
            for (i=0; i<l; i++)
            {
                m = stream.match(rs[i], eat);
                if (m) return { key: i, val: (is_string( rs[i] ) ? rs[i] : m) };
            }
            return false;
        },
        
        /*streamGetMatchAnyRegExp = function(stream, rs, eat) {
            eat = (undef===eat) ? true : eat;
            var i, l=rs.length, m;
            for (i=0; i<l; i++)
            {
                m = stream.match(rs[i], eat);
                if (m) return m;
            }
            return false;
        },
        
        streamGetMatchAnyStr = function(stream, rs, eat) {
            eat = (undef===eat) ? true : eat;
            var i, l=rs.length, m;
            for (i=0; i<l; i++)
            {
                m = stream.match(rs[i], eat);
                if (m) return rs[i];
            }
            return false;
        },*/
        
        // parser types
        T = {
            //
            // token types
            ERROR : 0,
            META : 1,
            COMMENT : 2,
            ATOM : 3,
            KEYWORD : 4,
            BUILTIN : 5,
            OP : 6,
            DELIM : 7,
            STRING : 8,
            HEREDOC : 18,
            NUMBER : 9,
            IDENTIFIER : 12,
            DEFAULT : -1,
            
            //
            // indent types
            TOP_LEVEL : 1,
            STATEMENT_LEVEL : 50,
            BLOCK_LEVEL : 100
        },
        
        //
        // tokenizer factories
        //
        
        ret = function(state, tok, style) {
            state.__lastToken = tok;
            return style;
        },
    
        Context = function(indented, column, type, delim, align, prev) {
            this.indented = indented || 0;
            this.column = column || 0;
            this.type = type || T.TOP_LEVEL;
            this.delim = delim || "";
            this.align = align || null;
            this.prev = prev || null;
        },
        
        pushContext = function(state, col, type, delim) {
            var indent = state.__indented;
            var t = state.__context.type;
            if (T.STATEMENT_LEVEL == t)  indent = state.__context.indented;
            return state.__context = new Context(indent, col, type, delim || "", null, state.__context);
        },
        
        popContext = function(state) {
            var t = state.__context.type;
            if ( T.BLOCK_LEVEL == t)  state.__indented = state.__context.indented;
            return state.__context = state.__context.prev;
        },
        
        tokenCommentFactory = function(delim, style) {
            
            return function(stream, state) {
                
                // line comment
                if (null===delim)
                {
                    stream.skipToEnd();
                    state.tokenize = null;
                    return ret(state, T.COMMENT, style);
                }
                // block comment
                else
                {
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
                    if (found) state.tokenize = null;
                    return ret(state, T.COMMENT, style);
                }
            }
        },

        tokenHeredocFactory = function(delim, style) {
            
            return function(stream, state) {
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
                if (found) state.tokenize = null;
                return ret(state, T.HEREDOC, style);
            };
        },

        tokenStringFactory = function(delim, style, multiLineStrings) {
            
            return function(stream, state) {
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
                if (end || !(escaped || multiLineStrings)) state.tokenize = null;
                return ret(state, T.STRING, style);
            };
        },
        
        tokenBaseFactory = function(grammar, DEFAULT, conf/*, parserConf*/) {
            
            var
                style = grammar.style,
                
                hasIndent = grammar.hasIndent,
                indent = grammar.indent,
                indentBlockLevel = indent["block-level"] || {},
                indentStatementLevel = indent["statement-level"] || {},
                indentBlockDelims = indentBlockLevel.delims.start || null,
                indentBlockDelimsEnd = indentBlockLevel.delims.end || null,
                blockKeywords = indentBlockLevel.keywords || {},
                indentStatementDelims = indentStatementLevel.delims || [],
                
                heredoc = grammar.heredoc.start || null,
                heredocEnd = grammar.heredoc.end || null,
                
                comments = grammar.comments.start || null,
                commentsEnd = grammar.comments.end || null,
                
                strings = grammar.strings.start || null,
                stringsEnd = grammar.strings.end || null,
                
                identifiers = grammar.identifiers,
                identifiers2 = grammar.identifiers2,
                identifiers3 = grammar.identifiers3,
                
                numbers = grammar.numbers,
                numbers2 = grammar.numbers2,
                numbers3 = grammar.numbers3,
                
                operators = grammar.operators,
                atoms = grammar.atoms,
                keywords = grammar.keywords,
                builtins = grammar.builtins,
                delims = grammar.delimiters,
                
                multiLineStrings = conf.multiLineStrings
            ;
            
            return function(stream, state) {
                var i, l, current, struct;
                
                if (stream.eatSpace()) return ret(state, T.DEFAULT, DEFAULT);
                
                // any special indent delims
                if (hasIndent)
                {
                    current = streamGetMatchAny(stream, indentStatementDelims, false);
                    if (current) 
                    {
                        state.__indentType = T.STATEMENT_LEVEL;
                        state.__indentDelim = current;
                    }
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
                        
                        state.tokenize = tokenHeredocFactory(endheredoc, style.heredoc);
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
                        
                        state.tokenize = tokenCommentFactory(endcomment, style.comment);
                        return state.tokenize(stream, state);
                    }
                }
                
                //
                // Numbers
                if (numbers && streamMatchAny(stream, numbers))
                {
                    return ret(state, T.NUMBER, style.number);
                }
                if (numbers2 && streamMatchAny(stream, numbers2))
                {
                    return ret(state, T.NUMBER, style.number2);
                }
                if (numbers3 && streamMatchAny(stream, numbers3))
                {
                    return ret(state, T.NUMBER, style.number3);
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
                
                //
                // multi-character Delimiters
                if ( delims &&
                    (   (delims.three && stream.match(delims.three)) || 
                        (delims.two && stream.match(delims.two))    )
                ) 
                {
                    return ret(state, T.DELIM, style.delimiter);
                }
                
                //
                // Operators
                if ( operators && 
                    (   ( operators.two && stream.match(operators.two) ) ||
                        ( operators.one && stream.match(operators.one) ) ||
                        ( operators.words && stream.match(operators.words) )    )
                )
                {
                    return ret(state, T.OP, style.operator);
                }
                
                //
                // single-character Delimiters
                if (delims && delims.one && stream.match(delims.one)) 
                {
                    return ret(state, T.DELIM, style.delimiter);
                }
                
                //
                // Atoms
                if (atoms && stream.match(atoms)) 
                {
                    return ret(state, T.ATOM, style.atom);
                }
                
                //
                // Keywords
                if (keywords && stream.match(keywords)) 
                {
                    current = stream.current();
                    if (blockKeywords[current]) 
                    {
                        state.__indentType = T.BLOCK_LEVEL;
                        state.__indentDelim = "keyword_" + current;
                    }
                    return ret(state, T.KEYWORD, style.keyword);
                }
                
                //
                // Builtins
                if (builtins && stream.match(builtins)) 
                {
                    current = stream.current();
                    if (blockKeywords[current])
                    {
                        state.__indentType = T.BLOCK_LEVEL;
                        state.__indentDelim = "builtin_" + current;
                    }
                    return ret(state, T.BUILTIN, style.builtin);
                }
                
                //
                // identifiers, variables etc..
                if (identifiers && streamMatchAny(stream, identifiers)) 
                {
                    return ret(state, T.IDENTIFIER, style.identifier);
                }
                if (identifiers2 && streamMatchAny(stream, identifiers2)) 
                {
                    return ret(state, T.IDENTIFIER, style.identifier2);
                }
                if (identifiers3 && streamMatchAny(stream, identifiers3)) 
                {
                    return ret(state, T.IDENTIFIER, style.identifier3);
                }
                
                // bypass
                stream.next();
                return ret(state, T.DEFAULT, DEFAULT);
            };
        },
        
        tokenFactory = function(tokenBase, grammar, DEFAULT, conf/*, parserConf*/) {
            
            var indentUnit = conf.indentUnit,
                style = grammar.style,
                hasIndent = grammar.hasIndent,
                indent = grammar.indent,
                indentBlockLevel = indent["block-level"] || {},
                indentStatementLevel = indent["statement-level"] || {},
                indentBlockDelims = indentBlockLevel.delims.start || null,
                indentBlockDelimsEnd = indentBlockLevel.delims.end || null,
                mainIndentBlockStartDelim = (indentBlockDelims) ? indentBlockDelims[0] : null,
                mainIndentBlockEndDelim = (indentBlockDelimsEnd) ? indentBlockDelimsEnd[0] : null,
                indentStatementDelims = indentStatementLevel.delims || []
            ;
            
            return function(stream, state) {
                
                var i, l, ctx, 
                    codeStyle, tokType, 
                    indentType, indentDelim, indentFound = false;
                
                if ( !state.__context )  state.__context = new Context(0 /*- indentUnit*/);
                    
                ctx = state.__context;
                
                // start of line
                if ( stream.sol() ) 
                {
                    if (null == ctx.align) ctx.align = false;
                    state.__startOfLine = true;
                    state.__indented = stream.indentation();
                }
                
                if ( null == state.tokenize ) state.tokenize = tokenBase;
                
                codeStyle = state.tokenize(stream, state);
                tokType = state.__lastToken;
                
                if ( tokType == T.COMMENT || tokType == T.META ) return codeStyle;
                
                if ( null == ctx.align ) ctx.align = true;

                // handle any indentation if needed
                if ( hasIndent )
                {
                    indentType = state.__indentType;
                    indentDelim = state.__indentDelim;
                    
                    if ( T.STATEMENT_LEVEL == ctx.type && indentStatementDelims.indexOf(indentDelim) > -1 )
                    {                
                        popContext( state );
                        indentFound = true;
                    }
                    
                    if ( !indentFound && indentBlockDelims )
                    {
                        var struct = streamGetMatchAnyWithKey(stream, indentBlockDelims, false);
                        if ( struct )
                        {
                            pushContext( state, stream.column(), T.BLOCK_LEVEL, indentBlockDelimsEnd[struct.key] );
                            indentFound = true;
                        }
                        
                        if ( !indentFound )
                        {
                            if ( streamMatchAny(stream, indentBlockDelimsEnd, false) )
                            {
                                while ( T.STATEMENT_LEVEL == ctx.type )  ctx = popContext( state );
                                
                                if ( ctx.delim == mainIndentBlockEndDelim ) ctx = popContext( state );
                                
                                while ( T.STATEMENT_LEVEL == ctx.type )  ctx = popContext( state );
                                
                                indentFound = true;
                            }
                        }
                    }
                    
                    if ( !indentFound && indentDelim == ctx.delim )
                    {
                        popContext( state );
                        indentFound = true;
                    }
                    
                    if ( !indentFound && 
                        ( (ctx.delim == mainIndentBlockEndDelim || ctx.type == T.TOP_LEVEL) /*&& indentDelim != ';'*/ ) || 
                        ( ctx.type == T.STATEMENT_LEVEL && indentType == T.BLOCK_LEVEL ) 
                    )
                    {
                        pushContext( state, stream.column(), T.STATEMENT_LEVEL );
                        indentFound = true;
                    }
                }
                
                state.__startOfLine = false;
                
                return codeStyle;
            };
        },
        
        indentationFactory = function(tokenBase, grammar, DEFAULT, conf/*, parserConf*/) {
            
            var indentUnit = conf.indentUnit,
                hasIndent = grammar.hasIndent,
                indent = grammar.indent,
                indentBlockLevel = indent["block-level"] || {},
                indentStatementLevel = indent["statement-level"] || {},
                indentBlockDelims = indentBlockLevel.delims.start || null,
                indentBlockDelimsEnd = indentBlockLevel.delims.end || null,
                mainIndentBlockStartDelim = (indentBlockDelims) ? indentBlockDelims[0] : null,
                mainIndentBlockEndDelim = (indentBlockDelimsEnd) ? indentBlockDelimsEnd[0] : null,
                indentStatementDelims = indentStatementLevel.delims || []
            ;
            
            return function(state, textAfter) {
                
                var ctx, firstChar, closing;
                
                if ( !hasIndent ) return CodeMirror.Pass;
                
                if (!state.__context) state.__context = new Context(0 /*- indentUnit*/);
                    
                if (state.tokenize != tokenBase && state.tokenize != null)  return CodeMirror.Pass;
                
                ctx = state.__context; 
                firstChar = textAfter && textAfter.charAt(0);
                
                if (mainIndentBlockEndDelim && ctx.type == T.STATEMENT_LEVEL && firstChar == mainIndentBlockEndDelim) 
                    ctx = ctx.prev;
                
                closing = firstChar == ctx.delim;
                
                if (ctx.type == T.STATEMENT_LEVEL) 
                    return ctx.indented + (mainIndentBlockStartDelim && firstChar == mainIndentBlockStartDelim ? 0 : indentUnit);
                    
                /*else if (dontAlignCalls && ctx.delim == ")" && !closing) 
                    return ctx.indented + indentUnit;*/
                
                else if (ctx.align) 
                    return ctx.column + (closing ? 0 : 1);
                
                else 
                    return ctx.indented + (closing ? 0 : indentUnit);
            };
        },
        
        defaults = {
            
            // prefix ID for regular expressions used in the grammar
            "RegExpID" : null,
            
            //
            // style model
            //
            
            // lang token type  -> CodeMirror (style) tag
            "style" : {
                  "error":       "error",
                  "meta":        "meta",
                  "comment":     "comment",
                  "atom":        "atom",
                  "keyword":     "keyword",
                  "builtin":     "builtin",
                  "operator":    "operator",
                  "identifier":  "variable",
                  "identifier2": "variable",
                  "identifier3": "variable",
                  "number":      "number",
                  "number2":     "number",
                  "number3":     "number",
                  "string":      "string",
                  "heredoc":     "string",
                  "delimiter":   "meta"
            },

            
            //
            // lexical model
            //
            
            // any electric chars
            //"electric" : null,
            
            // how are scoped blocks defined (possible values are : indent startchars, dedent endchars, etc.. )
            "indent" : null,
            
            // comments
            "comments" : { "line" : null, "block" : null },
            
            // identifiers (ie. variables, function names, etc..)
            // in order of matching
            "identifiers" : null,
            "identifiers2" : null,
            "identifiers3" : null,
            
            "attributes" : null,
            "properties" : null,
            
            // numbers, in order of matching
            "numbers" : null,
            "numbers2" : null,
            "numbers3" : null,

            // strings
            "strings" : null,
            "heredoc" : null,
            
            // operators
            "operators" : { "one" : null, "two" : null, "words" : null },
            
            // atoms
            "atoms" : null,
            
            // keywords
            "keywords" : null,
            
            // builtin functions, constructs, etc..
            "builtins" : null,
            
            // delimiters
            "delimiters" : { "one" : null, "two" : null, "three" : null }
        }
    ;
    
    
    //
    //  Codemirror Grammar main class
    //
    
    self = {
    
        parseGrammar : function(grammar, base) {
            var i, l, tmp, t1, t2, RegExpID, start, end;
            
            grammar = extend(grammar, base);
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            
            // comments
            if (grammar.comments)
            {
                // build comments start/end mappings
                start=[]; end=[];
                
                if (grammar.comments.line)  
                {
                    tmp = make_array(grammar.comments.line);
                    
                    for (i=0, l=tmp.length; i<l; i++)
                    {
                        start.push( getRegexp( tmp[i], RegExpID ) );
                        end.push( null );
                    }
                }
                if (grammar.comments.block)  
                {
                    tmp = make_array(grammar.comments.block);
                    
                    t1 = getRegexp( tmp[0], RegExpID );
                    t2 = (tmp[1]) ? getRegexp( tmp[1], RegExpID ) : t1;
                    start.push( t1 );
                    end.push( t2 );
                }
                
                grammar.comments = { start: start, end: end };
            }
            else
            {
                grammar.comments = { start: null, end: null };
            }
                
            // heredocs
            if (grammar.heredoc && grammar.heredoc.length)
            {
                // build heredoc start/end mappings
                start=[]; end=[];
                
                tmp = grammar.heredoc;
                
                if (is_array(tmp) && !is_array(tmp[0])) tmp = [tmp];  // array of arrays
                
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getRegexp( tmp[i][0], RegExpID );
                    t2 = (tmp[i][1]) ? getRegexp( tmp[i][1], RegExpID ) : t1;
                    start.push( t1 );
                    end.push( t2 );
                }
                
                grammar.heredoc = {start: start, end: end};
            }
            else
            {
                grammar.heredoc = {start: null, end: null};
            }
            
            // identifiers
            if (grammar.identifiers)
            {
                tmp = make_array(grammar.identifiers);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.identifiers = tmp
            }
            if (grammar.identifiers2)
            {
                tmp = make_array(grammar.identifiers2);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.identifiers2 = tmp
            }
            if (grammar.identifiers3)
            {
                tmp = make_array(grammar.identifiers3);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.identifiers3 = tmp;
            }
            
            // numbers
            if (grammar.numbers)
            {
                tmp = make_array(grammar.numbers);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.numbers = tmp;
            }
            if (grammar.numbers2)
            {
                tmp = make_array(grammar.numbers2);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.numbers2 = tmp;
            }
            if (grammar.numbers3)
            {
                tmp = make_array(grammar.numbers3);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.numbers3 = tmp;
            }
            
            // strings
            if (grammar.strings) 
            {
                // build strings start/end mappings
                start=[]; end=[];
                tmp = make_array(grammar.strings);
                if ( !is_array(tmp[0]) ) tmp = [tmp]; // array of arrays
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getRegexp( tmp[i][0], RegExpID );
                    t2 = (tmp[i][1]) ? getRegexp( tmp[i][1], RegExpID ) : t1;
                    start.push( t1 );
                    end.push( t2 );
                }
                grammar.strings = { start: start, end: end };
            }
            else
            {
                grammar.strings = { start: null, end: null };
            }
            
            // keywords, builtins, etc..
            grammar.atoms = (grammar.atoms) ? getCombinedRegexp( make_array(grammar.atoms) ) : null;
            grammar.keywords = (grammar.keywords) ? getCombinedRegexp( make_array(grammar.keywords) ) : null;
            grammar.builtins = (grammar.builtins) ? getCombinedRegexp( make_array(grammar.builtins) ) : null;
        
            // operators
            if (!grammar.operators) grammar.operators = { one: null, two: null, words: null };
            grammar.operators.one = (grammar.operators.one) ? getCombinedRegexp( make_array(grammar.operators.one) ) : null;
            grammar.operators.two = (grammar.operators.two) ? getCombinedRegexp( make_array(grammar.operators.two) ) : null;
            grammar.operators.words = (grammar.operators.words) ? getCombinedRegexp( make_array(grammar.operators.words) ) : null;
            
            // delimiters
            if (!grammar.delimiters) grammar.delimiters = { one: null, two: null, three: null };
            grammar.delimiters.one = (grammar.delimiters.one) ? getCombinedRegexp( make_array(grammar.delimiters.one) ) : null;
            grammar.delimiters.two = (grammar.delimiters.two) ? getCombinedRegexp( make_array(grammar.delimiters.two) ) : null;
            grammar.delimiters.three = (grammar.delimiters.three) ? getCombinedRegexp( make_array(grammar.delimiters.three) ) : null;
            
            // types of indent etc..
            if (grammar.indent) 
            {
                if (!grammar.indent["block-level"]) grammar.indent["block-level"] = { keywords: null, delims: null };
                if (!grammar.indent["statement-level"]) grammar.indent["statement-level"] = { delims: null };
                
                if (grammar.indent["block-level"].keywords)
                {
                    tmp = make_array(grammar.indent["block-level"].keywords);
                    
                    // build a lookup hashmap
                    var bks = {};
                    for (i=0, l=tmp.length; i<l; i++ )  bks[ tmp[i] ] = true;
                    
                    grammar.indent["block-level"].keywords = bks;
                }
                else
                {
                    grammar.indent["block-level"].keywords = {};
                }
                
                if (grammar.indent["block-level"].delims)
                {
                    tmp = make_array(grammar.indent["block-level"].delims);
                    
                    // build a start/end mapping
                    start=[]; end=[];
                    
                    if (is_array(tmp) && !is_array(tmp[0])) tmp = [tmp]; // array of arrays
                    
                    for (i=0, l=tmp.length; i<l; i++)
                    {
                        t1 = getRegexp( tmp[i][0], RegExpID );
                        t2 = (tmp[i][1]) ? getRegexp( tmp[i][1], RegExpID ) : t1;
                        start.push( t1 );
                        end.push( t2 );
                    }
                    
                    grammar.indent["block-level"].delims = { start: start, end: end };
                }
                else
                {
                    grammar.indent["block-level"].delims = { start: null, end: null };
                }
                    
                if (grammar.indent["statement-level"].delims) 
                    grammar.indent["statement-level"].delims = make_array(grammar.indent["statement-level"].delims);
                else
                    grammar.indent["statement-level"].delims = [];
                
                grammar.hasIndent = true;
            }
            else
            {
                grammar.indent = null;
                grammar.hasIndent = false;
            }
            
            return grammar;
        },
        
        getMode : function(grammar, base, DEFAULT) {
            
            // default return code, when no match found
            // 'null' should be used in most cases
            DEFAULT = DEFAULT || null;
            
            // build the grammar
            grammar = self.parseGrammar(grammar, base || defaults);
            
            //console.log(grammar);
            
            // generate parser with token factories (closure makes grammar available locally)
            return function(conf, parserConf) {
                
                var tokenBase = tokenBaseFactory(grammar, DEFAULT, conf, parserConf);
                var token = tokenFactory(tokenBase, grammar, DEFAULT, conf, parserConf);
                var indentation = indentationFactory(tokenBase, grammar, DEFAULT, conf, parserConf);
                
                // return the parser for the grammar
                parser =  {
                    
                    startState: function(basecolumn) {
                          return {
                              tokenize : null,
                              __context : new Context((basecolumn || 0) - conf.indentUnit),
                              __lastToken : T.DEFAULT,
                              __startOfLine : false,
                              __indentType : T.TOP_LEVEL,
                              __indentDelim : "",
                              __intended : 0
                          };
                    },
                    
                    token: token,

                    indent: indentation
                    
                };
                
                //if (grammar.electric)  parser.electricChars = grammar.electric;
                
                return parser;
            };
        }
    };

    
    // export it
    if ('undefined' != typeof (module) && module.exports)  module.exports = self;
    
    else if ('undefined' != typeof (exports)) exports = self;
    
    else this.CodeMirrorGrammar = self;

    
}).call(this);