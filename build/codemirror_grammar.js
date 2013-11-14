/**
*
*   CodeMirrorGrammar
*   Transform a grammar specification in JSON format,
*   into a CodeMirror syntax-highlight parser mode
*
*   https://github.com/foo123/codemirror-grammar
*
**/
(function(root, undef){
    
    var VERSION = "0.1";
    
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
        }
    ;
    
    var
        //
        // default grammar settings
        programmingLikeGrammar = {
            
            // prefix ID for regular expressions used in the grammar
            "RegExpID" : null,
            
            //
            // style model
            
            // lang token type  -> CodeMirror (style) tag
            "style" : {
                "error":       "error",
                "comment":     "comment",
                "meta":        "meta",
                "defines":     "def",
                "atom":        "atom",
                "keyword":     "keyword",
                "builtin":     "builtin",
                "operator":    "operator",
                "identifier":  "variable",
                "identifier2": "variable",
                "identifier3": "variable",
                "identifier4": "variable",
                "identifier5": "variable",
                "number":      "number",
                "number2":     "number",
                "number3":     "number",
                "string":      "string",
                "string2":     "string",
                "string3":     "string",
                "heredoc":     "string",
                "delimiter":   "meta"
            },

            
            //
            // lexical model
            
            // comments
            "comments" : { "line" : null, "block" : null },
            
            // identifiers (ie. variables, function names, etc..)
            // in order of matching
            "identifiers" : null,
            "identifiers2" : null,
            "identifiers3" : null,
            "identifiers4" : null,
            "identifiers5" : null,
            
            "attributes" : null,
            "properties" : null,
            
            // numbers, in order of matching
            "numbers" : null,
            "numbers2" : null,
            "numbers3" : null,

            // strings
            "strings" : null,
            "strings2" : null,
            "strings3" : null,
            "heredoc" : null,
            
            // operators
            "operators" : { "one" : null, "two" : null, "words" : null },
            
            // atoms
            "atoms" : null,
            
            // meta
            "meta" : null,
            
            // defines
            "defines" : null,
            
            // keywords
            "keywords" : null,
            
            // builtin functions, constructs, etc..
            "builtins" : null,
            
            // delimiters
            "delimiters" : { "one" : null, "two" : null, "three" : null },
            
            // how are scoped blocks defined (possible values are : indent startchars, dedent endchars, etc.. )
            "indent" : null
        },
        
        markupLikeGrammar = {
            
            // prefix ID for regular expressions used in the grammar
            "RegExpID" : null,
            
            //
            // style model
            
            // lang token type  -> CodeMirror (style) tag
            "style" : {
                "error":       "error",
                "comment":     "comment",
                "meta":        "meta",
                "defines":     "def",
                "atom":        "atom",
                "keyword":     "keyword",
                "builtin":     "builtin",
                "attribute":   "attribute",
                "tag":         "tag",
                "tag2":        "tag",
                "tag3":        "tag",
                "tag4":        "tag",
                "tag5":        "tag",
                "identifier":  "variable",
                "identifier2": "variable",
                "identifier3": "variable",
                "identifier4": "variable",
                "identifier5": "variable",
                "number":      "number",
                "number2":     "number",
                "number3":     "number",
                "string":      "string",
                "string2":     "string",
                "string3":     "string",
                "cdata":       "string",
                "delimiter":   "meta"
            },

            
            //
            // lexical model
            
            // comments
            "comments" : { "line" : null, "block" : null },
            
            "autoclose" : null,
            
            // tags, in order of matching
            "tags" : null,
            "tags2" : null,
            "tags3" : null,
            "tags4" : null,
            "tags5" : null,
            
            // identifiers, in order of matching
            "identifiers" : null,
            "identifiers2" : null,
            "identifiers3" : null,
            "identifiers4" : null,
            "identifiers5" : null,
            
            "attributes" : null,
            "properties" : null,
            
            // numbers, in order of matching
            "numbers" : null,
            "numbers2" : null,
            "numbers3" : null,

            // strings, in order of matching
            "strings" : null,
            "strings2" : null,
            "strings3" : null,
            "cdata" : null,
            
            // atoms
            "atoms" : null,
            
            // meta
            "meta" : null,
            
            // defines
            "defines" : null,
            
            // keywords
            "keywords" : null,
            
            // builtin functions, constructs, etc..
            "builtins" : null,
            
            // delimiters
            "delimiters" : { "one" : null, "two" : null, "three" : null },
            
            // how are scoped blocks defined (possible values are : indent startchars, dedent endchars, etc.. )
            "indent" : null
        }
    ;
        
    //
    // parser types
    var    
        //
        // token types
        T_ERROR = -1,
        T_DEFAULT = 0,
        T_META = 1,
        T_DEF = 2,
        T_ATOM = 3,
        T_KEYWORD = 4,
        T_BUILTIN = 5,
        T_COMMENT = 6,
        T_OP = 7,
        T_DELIM = 8,
        T_STRING = 9,
        T_HEREDOC = 10,
        T_NUMBER = 11,
        T_IDENTIFIER = 12,
        T_PROPERTY = 13,
        T_QUALIFIER = 14,
        T_ATTRIBUTE = 15,
        T_AUTOCLOSEDTAG = 16,
        T_IMPLICITLYCLOSEDTAG = 17,
        T_TAG = 18,
        T_ENDTAG = 19,
        T_CDATA = 20,
        T_DOCTYPE = 21,
        
        //
        // indentation types
        T_TOP_LEVEL = 100,
        T_STATEMENT_LEVEL = 110,
        T_DELIM_LEVEL = 120,
        T_BLOCK_LEVEL = 130,
        T_DO_INDENT = 140,
        T_DO_DEDENT = 150,
        
        //
        // tokenizer types
        T_TOKENBASE = 200,
        T_TOKENBASEML = 220,
        T_TOKEN = 210
    ;
    
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
      
    //
    //  CodeMirror Grammar main class
    
    var self = {
        
        VERSION : VERSION,
        
        parseGrammar : function(grammar, base) {
            if (grammar.type && "markup-like" == grammar.type)
            {
                return self.parseMarkupLikeGrammar(grammar, base || markupLikeGrammar);
            }
            else
            {
                return self.parseProgrammingLikeGrammar(grammar, base || programmingLikeGrammar);
            }
        },
        
        parseMarkupLikeGrammar : function(grammar, base) {
            // todo
            return null;
        },
        
        parseProgrammingLikeGrammar : function(grammar, base) {
            var i, l, tmp, t1, t2, RegExpID, start, end;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if (grammar.__parsed)  return grammar;
            
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
            if (grammar.identifiers4)
            {
                tmp = make_array(grammar.identifiers4);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.identifiers4 = tmp;
            }
            if (grammar.identifiers5)
            {
                tmp = make_array(grammar.identifiers5);
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getRegexp( tmp[i], RegExpID );
                grammar.identifiers5 = tmp;
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
            if (grammar.strings2) 
            {
                // build strings start/end mappings
                start=[]; end=[];
                tmp = make_array(grammar.strings2);
                if ( !is_array(tmp[0]) ) tmp = [tmp]; // array of arrays
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getRegexp( tmp[i][0], RegExpID );
                    t2 = (tmp[i][1]) ? getRegexp( tmp[i][1], RegExpID ) : t1;
                    start.push( t1 );
                    end.push( t2 );
                }
                grammar.strings2 = { start: start, end: end };
            }
            else
            {
                grammar.strings2 = { start: null, end: null };
            }
            if (grammar.strings3) 
            {
                // build strings start/end mappings
                start=[]; end=[];
                tmp = make_array(grammar.strings3);
                if ( !is_array(tmp[0]) ) tmp = [tmp]; // array of arrays
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getRegexp( tmp[i][0], RegExpID );
                    t2 = (tmp[i][1]) ? getRegexp( tmp[i][1], RegExpID ) : t1;
                    start.push( t1 );
                    end.push( t2 );
                }
                grammar.strings3 = { start: start, end: end };
            }
            else
            {
                grammar.strings3 = { start: null, end: null };
            }
            
            // keywords, builtins, etc..
            grammar.atoms = (grammar.atoms) ? getCombinedRegexp( make_array(grammar.atoms) ) : null;
            grammar.defines = (grammar.defines) ? getCombinedRegexp( make_array(grammar.defines) ) : null;
            grammar.meta = (grammar.meta) ? getCombinedRegexp( make_array(grammar.meta) ) : null;
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
            var hasIndent = false;
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
                    
                    hasIndent = true;
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
                    
                    hasIndent = true;
                }
                else
                {
                    grammar.indent["block-level"].delims = { start: null, end: null };
                }
                    
                if (grammar.indent["statement-level"].delims)
                {
                    grammar.indent["statement-level"].delims = make_array(grammar.indent["statement-level"].delims);
                    hasIndent = true;
                }
                else
                {
                    grammar.indent["statement-level"].delims = [];
                }
            }
            else
            {
                grammar.indent = null;
            }
            grammar.hasIndent = hasIndent;
            
            // this grammar is parsed
            grammar.__parsed = true;
            
            return grammar;
        },
        
        getMode : function(grammar, base, DEFAULT) {
            
            // build the grammar, ( grammar can extend another 'base' grammar ;) )
            grammar = self.parseGrammar(grammar, base);
            
            //console.log(grammar);
            
            var LOCALS = { 
                // default return code, when no match found
                // 'null' should be used in most cases
                DEFAULT: DEFAULT || null 
            };
            
            // generate parser with token factories (closures make grammar, LOCALS etc.. available locally)
            return function(conf, parserConf) {
                
                var tokenBase = tokenBaseFactory(grammar, LOCALS, conf, parserConf);
                var token = tokenFactory(tokenBase, grammar, LOCALS, conf, parserConf);
                var indentation = indentationFactory(tokenBase, grammar, LOCALS, conf, parserConf);
                
                // return the parser for the grammar
                parser =  {
                    
                    startState: function(basecolumn) {
                          
                          LOCALS.basecolumn = basecolumn;
                          
                          return {
                              tokenize : null
                          };
                    },
                    
                    token: token,

                    indent: indentation
                    
                };
                
                return parser;
            };
        }
    };
    
    // export it
    if ('undefined' != typeof (module) && module.exports)  module.exports = self;
    
    else if ('undefined' != typeof (exports)) exports = self;
    
    else this.CodeMirrorGrammar = self;

    
}).call(this);