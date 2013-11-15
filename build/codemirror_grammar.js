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
    /*if ( !Array.prototype.indexOf ) 
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
    }*/
    
    var slice = Array.prototype.slice, 
        
        hasKey = Object.prototype.hasOwnProperty,
        
        Str = Object.prototype.toString,

        is_number = function(n) {
            return ('number'==typeof(n) || n instanceof Number);
        },
        
        is_char = function(c) {
            return (c && ('string'==typeof(c) || c instanceof String) && 1 == c.length);
        },
        
        is_string = function(s) {
            return (s && ('string'==typeof(s) || s instanceof String));
        },
        
        is_regex = function(r) {
            return (r && ("[object RegExp]"==Str.call(r) || r instanceof RegExp));
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
        }
    ;
    
    var
        //
        // default grammar settings
        programmingLikeGrammar = {
            
            // prefix ID for regular expressions used in the grammar
            "RegExpID" : null,
            
            // lists of (simple/string) tokens to be grouped into one regular expression,
            // else matched one by one, 
            // this is usefull for speed fine-tuning the parser
            "RegExpGroups" : null,
            
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
                "block":       "string",
                "block2":      "string",
                "block3":      "string",
                "block4":      "string",
                "block5":      "string",
                "delimiter":   "meta"
            },

            
            //
            // lexical model
            
            // comments
            "comments" : { "line" : null, "block" : null },
            
            // general blocks, eg heredocs, cdata, etc..
            "blocks" : null,
            "blocks2" : null,
            "blocks3" : null,
            "blocks4" : null,
            "blocks5" : null,
            
            // general identifiers, in order of matching
            "identifiers" : null,
            "identifiers2" : null,
            "identifiers3" : null,
            "identifiers4" : null,
            "identifiers5" : null,
            
            // numbers, in order of matching
            "numbers" : null,
            "numbers2" : null,
            "numbers3" : null,

            // strings, in order of matching
            "strings" : null,
            "strings2" : null,
            "strings3" : null,
            
            // general attributes, in order of matching
            //"attributes" : null,
            //"attributes2" : null,
            //"attributes3" : null,
            //"properties" : null,
            
            // operators
            "operators" : { "one" : null, "two" : null, "words" : null },
            
            // delimiters
            "delimiters" : { "one" : null, "two" : null, "three" : null },
            
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
            
            // how are scoped blocks defined (possible values are : indent startchars, dedent endchars, etc.. )
            "indent" : null
        },
        
        markupLikeGrammar = {
            
            // prefix ID for regular expressions used in the grammar
            "RegExpID" : null,
            
            // lists of (simple/string) tokens to be grouped into one regular expression,
            // else matched one by one, 
            // this is usefull for speed fine-tuning the parser
            "RegExpGroups" : null,
            
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
                "assignment":  null,
                "tag":         "tag",
                "tag2":        "tag",
                "tag3":        "tag",
                "attribute":   "attribute",
                "attribute2":  "attribute",
                "attribute3":  "attribute",
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
                "block":       "string",
                "block2":      "string",
                "block3":      "string",
                "block4":      "string",
                "block5":      "string",
                "delimiter":   "meta"
            },

            
            //
            // lexical model
            
            // comments
            "comments" : { "line" : null, "block" : null },
            
            // general blocks, eg heredocs, cdata, etc..
            "blocks" : null,
            "blocks2" : null,
            "blocks3" : null,
            "blocks4" : null,
            "blocks5" : null,
            
            // general tags, in order of matching
            "tags" : null,
            "tags2" : null,
            "tags3" : null,
            
            "autoclose" : null,
            
            // general attributes, in order of matching
            "attributes" : null,
            "attributes2" : null,
            "attributes3" : null,
            //"properties" : null,
            
            // general identifiers, in order of matching
            "identifiers" : null,
            "identifiers2" : null,
            "identifiers3" : null,
            "identifiers4" : null,
            "identifiers5" : null,
            
            // numbers, in order of matching
            "numbers" : null,
            "numbers2" : null,
            "numbers3" : null,

            // strings, in order of matching
            "strings" : null,
            "strings2" : null,
            "strings3" : null,
            
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
            
            // assignments
            "assignments" : null,
            
            // operators
            "operators" : { "one" : null, "two" : null, "words" : null },
            
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
        T_DEFAULT = 1,
        T_META = 2,
        T_COMMENT = 4,
        T_DEF = 8,
        T_ATOM = 16,
        T_KEYWORD = 32,
        T_BUILTIN = 64,
        T_STRING = 128,
        T_IDENTIFIER = 256,
        T_NUMBER = 512,
        T_TAG = 1024,
        T_ATTRIBUTE = 2048,
        T_ASSIGNMENT = 4096,
        T_ENDTAG = 8192,
        T_ERROR = 16384,
        
        T_BLOCK = 32768,
        T_DOCTYPE = 65536,
        T_OP = 131072,
        T_DELIM = 262144,
        
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
        T_TOKENBASEML = 210,
        T_TOKEN = 220,
        
        //
        // matcher types
        T_CHAR = 300,
        T_STR = 310,
        T_REGEX = 320
    ;
    
    //
    // matcher factories
    var ESC = /([\-\.\*\+\?\^\$\{\}\(\)\|\[\]\/\\])/g,
    
        getRegexp = function(rstr, rxid)  {
            if ( !rstr || is_number(rstr) ) return rstr;
            
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
        
        getMatcher = function(r, i) {
            // get a fast customized matcher for < r >
            
            // manipulate the codemirror stream directly for speed,
            // if codemirror code for stream matching changes,
            // only this part of the code needs to be adapted
            var matcher, strlen;
            
            i = i || 0;
            
            if (is_number(r))  
            {
                return r;
            }
            else if (is_char(r))
            {
                //strlen = r.length;
                matcher = function(stream, eat/*, ignoreCase*/) {
                    
                    // manipulate the codemirror stream directly for speed
                    eat = (false !== eat);
                    var ch = r; //(ignoreCase) ? r.toLowerCase() : r;
                    var sch = stream.string.charAt(stream.pos) || '';
                    var sch2 = sch; //(ignoreCase) ? sch.toLowerCase() : sch;
                    if (ch == sch) 
                    {
                        if (eat) stream.pos += 1;
                        return { key: i, val: sch };
                    }
                    return false;
                };
                matcher.__type = T_CHAR;
                return matcher;
            }
            else if (is_string(r))
            {
                strlen = r.length;
                matcher = function(stream, eat/*, ignoreCase*/) {
                    
                    // manipulate the codemirror stream directly for speed
                    eat = (false !== eat);
                    var cased = r; //(ignoreCase) ? r.toLowerCase() : r;
                    var str = stream.string.substr(stream.pos, strlen);
                    var str2 = str; //(ignoreCase) ? str.toLowerCase() : str;
                    if (cased == str2) 
                    {
                        if (eat) stream.pos += strlen;
                        return { key: i, val: str };
                    }
                    return false;
                };
                matcher.__type = T_STR;
                return matcher;
            }
            else if (is_regex(r))
            {
                matcher = function(stream, eat) {
                    
                    // manipulate the codemirror stream directly for speed
                    eat = (false !== eat);
                    var match = stream.string.slice(stream.pos).match(r);
                    if (!match || match.index > 0) return false;
                    if (eat) stream.pos += match[0].length;
                    return { key: i, val: match };
                };
                matcher.__type = T_REGEX;
                return matcher;
            }
            else
            {
                return r;
            }
            
        },
        
        getMatchersFor = function(tokens, RegExpID, isRegExpGroup) {
            if (isRegExpGroup)
            {   
                return [ getMatcher( getCombinedRegexp( make_array(tokens) ) ) ];
            }
            else
            {
                var tmp, i, l;
                
                tmp = make_array(tokens);
                
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getMatcher( getRegexp( tmp[i], RegExpID ), i );
                
                return tmp;
            }
        },
        
        getStartEndMatchersFor = function(tokens, RegExpID) {
            var tmp, i, l, start, end, t1, t2;
            
            // build start/end mappings
            start=[]; end=[];
            tmp = make_array(tokens);
            if ( !is_array(tmp[0]) ) tmp = [tmp]; // array of arrays
            for (i=0, l=tmp.length; i<l; i++)
            {
                t1 = getMatcher( getRegexp( tmp[i][0], RegExpID ), i );
                t2 = (tmp[i].length>1) ? getMatcher( getRegexp( tmp[i][1], RegExpID ), i ) : t1;
                start.push( t1 );
                end.push( t2 );
            }
            return { start: start, end: end };
        },
        
        matchAny = function(stream, matchers, eat) {
            var i, l=matchers.length, m;
            for (i=0; i<l; i++)
            {
                // each one is a custom matcher in its own
                m = matchers[i](stream, eat);
                if (m) return m;
            }
            return false;
        },
        
        streamEat = function(stream, s) {
            stream.pos += s.length;
            return stream;
        }
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
                style = LOCALS.style,
                
                tags = LOCALS.tags,
                attributes = LOCALS.attributes,
                assignments = LOCALS.assignments,
                strings = LOCALS.strings,
                stringsEnd = LOCALS.stringsEnd,
                
                foundTag = false,
                tagName = ''
                ;
            
            var tokenTag = function(stream, state) {
                
                var struct, endblock, ok = false,
                    lastToken = state.lastToken;
                
                if ( !foundTag && tags && (struct = matchAny(stream, tags)) )
                {
                    state.lastToken = T_TAG;
                    foundTag = true;
                    //tagName = struct.val;
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
                        endMatcher(stream)
                    )
                    {
                        state.tokenize = nextTokenizer || null;
                        state.lastToken = T_ENDTAG;
                        return style.tag;
                    }
                    
                    if (
                        //( T_DEFAULT & lastToken ) &&
                        attributes && matchAny(stream, attributes)
                    )
                    {
                        state.lastToken = T_ATTRIBUTE;
                        return style.attribute;
                    }
                    
                    if (
                        //( T_ATTRIBUTE & lastToken ) &&
                        assignments && matchAny(stream, assignments)
                    )
                    {
                        state.lastToken = T_ASSIGNMENT;
                        return DEFAULT;
                    }
                    
                    if (
                        //( T_ASSIGNMENT & lastToken ) &&
                        strings && (struct = matchAny(stream, strings))
                    )
                    {
                        state.tokenize = getStringTokenizer(getMatcher(stringsEnd[struct.key]), style.string, false, tokenTag);
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
                blocks4 = grammar.blocks4.start || null,
                blocks4End = grammar.blocks4.end || null,
                blocks5 = grammar.blocks5.start || null,
                blocks5End = grammar.blocks5.end || null,
                
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
                    ctx;
                
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
                    endblock = blocksEnd[struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block);
                    return state.tokenize(stream, state);
                }
                if ( blocks2 && (struct = matchAny(stream, blocks2)) ) 
                {
                    endblock = blocks2End[struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block2);
                    return state.tokenize(stream, state);
                }
                if ( blocks3 && (struct = matchAny(stream, blocks3)) ) 
                {
                    endblock = blocks3End[struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block3);
                    return state.tokenize(stream, state);
                }
                if ( blocks4 && (struct = matchAny(stream, blocks4)) ) 
                {
                    endblock = blocks4End[struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block4);
                    return state.tokenize(stream, state);
                }
                if ( blocks5 && (struct = matchAny(stream, blocks5)) ) 
                {
                    endblock = blocks5End[struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block5);
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
            
            var DEFAULT = LOCALS.DEFAULT,
                
                style = grammar.style,
                
                comments = grammar.comments.start || null,
                commentsEnd = grammar.comments.end || null,
                
                blocks = grammar.blocks.start || null,
                blocksEnd = grammar.blocks.end || null,
                blocks2 = grammar.blocks2.start || null,
                blocks2End = grammar.blocks2.end || null,
                blocks3 = grammar.blocks3.start || null,
                blocks3End = grammar.blocks3.end || null,
                blocks4 = grammar.blocks4.start || null,
                blocks4End = grammar.blocks4.end || null,
                blocks5 = grammar.blocks5.start || null,
                blocks5End = grammar.blocks5.end || null,
                
                strings = grammar.strings.start || null,
                stringsEnd = grammar.strings.end || null,
                strings2 = grammar.strings2.start || null,
                strings2End = grammar.strings2.end || null,
                strings3 = grammar.strings3.start || null,
                strings3End = grammar.strings3.end || null,
                
                doctype = grammar.doctype,
                
                tagsStart = grammar.tags.start || null,
                tags = grammar.tags.tags || null,
                tagsEnd = grammar.tags.end || null,
                
                attributes = grammar.attributes,
                attributes2 = grammar.attributes2,
                attributes3 = grammar.attributes3,
                
                assignments = grammar.assignments,
                
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
                indent = grammar.indent
            ;
            
            return function(stream, state) {

                var i, l, current, struct, endblock,
                    ctx;
                
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
                // Blocks, eg. cdata, meta etc..
                if ( blocks && (struct = matchAny(stream, blocks)) ) 
                {
                    endblock = blocksEnd[struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block);
                    return state.tokenize(stream, state);
                }
                if ( blocks2 && (struct = matchAny(stream, blocks2)) ) 
                {
                    endblock = blocks2End[struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block2);
                    return state.tokenize(stream, state);
                }
                if ( blocks3 && (struct = matchAny(stream, blocks3)) ) 
                {
                    endblock = blocks3End[struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block3);
                    return state.tokenize(stream, state);
                }
                if ( blocks4 && (struct = matchAny(stream, blocks4)) ) 
                {
                    endblock = blocks4End[struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block4);
                    return state.tokenize(stream, state);
                }
                if ( blocks5 && (struct = matchAny(stream, blocks5)) ) 
                {
                    endblock = blocks5End[struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getBlockTokenizer(getMatcher(endblock), T_BLOCK, style.block5);
                    return state.tokenize(stream, state);
                }
                
                //
                // Doctypes, etc..
                if ( doctype && matchAny(stream, doctype) ) 
                {
                    state.tokenize = getDoctypeTokenizer(style.doctype);
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
                // Strings
                if ( strings && (struct = matchAny(stream, strings)) ) 
                {
                    endblock = stringsEnd[struct.key];
                    
                    // regex given, get the matched group for the ending of this string
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getStringTokenizer(getMatcher(endblock), style.string, false);
                    return state.tokenize(stream, state);
                }
                if ( strings2 && (struct = matchAny(stream, strings2)) ) 
                {
                    endblock = strings2End[struct.key];
                    
                    // regex given, get the matched group for the ending of this string
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getStringTokenizer(getMatcher(endblock), style.string2, false);
                    return state.tokenize(stream, state);
                }
                if ( strings3 && (struct = matchAny(stream, strings3)) ) 
                {
                    endblock = strings3End[struct.key];
                    
                    // regex given, get the matched group for the ending of this string
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    state.tokenize = getStringTokenizer(getMatcher(endblock), style.string3, false);
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
                // Tags
                if ( tagsStart && (struct = matchAny(stream, tagsStart)) ) 
                {
                    endblock = tagsEnd[struct.key];
                    
                    // regex given, get the matched group for the ending of this heredoc
                    if ( is_number(endblock) )  endblock = struct.val[endblock];
                    
                    // pass any necessary data to the tokenizer
                    LOCALS.style = style;
                    LOCALS.tags = tags;
                    LOCALS.attributes = attributes;
                    LOCALS.assignments = assignments;
                    LOCALS.strings = strings;
                    LOCALS.stringsEnd = stringsEnd;
                    
                    state.tokenize = getTagTokenizer(getMatcher(endblock), LOCALS);
                    return state.tokenize(stream, state);
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
                    state.lastToken = T_KEYWORD;
                    return style.keyword;
                }
                
                //
                // Builtins
                if (builtins && matchAny(stream, builtins)) 
                {
                    current = stream.current();
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
            
            tokenBase.__type = T_TOKENBASEML;
            return tokenBase;
        },

        tokenFactory = function(tokenBase, grammar, LOCALS, conf/*, parserConf*/) {
            
            var DEFAULT = LOCALS.DEFAULT,
                basecolumn = LOCALS.basecolumn || 0,
                indentUnit = conf.indentUnit,
                //style = grammar.style,
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
                // TODO
                return CodeMirror.Pass;
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
            var t1, t2, i, l, RegExpID, RegExpGroups;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if (grammar.__parsed)  return grammar;
            
            grammar = extend(grammar, base);
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            RegExpGroups = grammar.RegExpGroups || {};
            grammar.RegExpGroups = null;
            delete grammar.RegExpGroups;
            
            grammar.type = null;
            delete grammar.type;
            grammar.isMarkup = true;
            
            // comments
            if (grammar.comments)
            {
                t1 = [];
                if (grammar.comments.line)  
                {
                    t2 = make_array(grammar.comments.line);
                    
                    for (i=0, l=t2.length; i<l; i++)
                        t1.push( [t2[i], null] );
                }
                if (grammar.comments.block)  
                {
                    t2 = make_array(grammar.comments.block);
                    t1.push( [t2[0], ((t2[1]) ? t2[1] : t2[0])] );
                }
                grammar.comments = (t1.length) ? getStartEndMatchersFor(t1, RegExpID) : { start: null, end: null };
            }
            else
            {
                grammar.comments = { start: null, end: null };
            }
                
            // general blocks ( 5 types ), eg. heredocs, cdata, etc..
            grammar.blocks = (grammar.blocks) ? getStartEndMatchersFor(grammar.blocks, RegExpID) : { start: null, end: null };
            grammar.blocks2 = (grammar.blocks2) ? getStartEndMatchersFor(grammar.blocks2, RegExpID) : { start: null, end: null };
            grammar.blocks3 = (grammar.blocks3) ? getStartEndMatchersFor(grammar.blocks3, RegExpID) : { start: null, end: null };
            grammar.blocks4 = (grammar.blocks4) ? getStartEndMatchersFor(grammar.blocks4, RegExpID) : { start: null, end: null };
            grammar.blocks5 = (grammar.blocks5) ? getStartEndMatchersFor(grammar.blocks5, RegExpID) : { start: null, end: null };
            
            // tags ( 3 types )
            if (grammar.tags)
            {
                t1 = [];
                t2 = [];
                var tmp = make_array(grammar.tags);
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1.push( [ tmp[i][0], tmp[i][1] ] );
                    t2 = t2.concat( tmp[i][2] );
                }
                t1 = getStartEndMatchersFor(t1, RegExpID);
                t2 = getMatchersFor(t2, RegExpID, RegExpGroups['tags']);
                grammar.tags = { start: t1.start, tags: t2, end: t1.end };
            }
            else
            {
                grammar.tags = { start: null, tags: null, end: null };
            }
            grammar.tags2 = { start: null, tags: null, end: null };
            grammar.tags3 = { start: null, tags: null, end: null };
            
            // attributes ( 3 types )
            grammar.attributes = (grammar.attributes) ? getMatchersFor(grammar.attributes, RegExpID, RegExpGroups['attributes']) : null;
            grammar.attributes2 = (grammar.attributes2) ? getMatchersFor(grammar.attributes2, RegExpID, RegExpGroups['attributes2']) : null;
            grammar.attributes3 = (grammar.attributes3) ? getMatchersFor(grammar.attributes3, RegExpID, RegExpGroups['attributes3']) : null;
            
            // doctype
            grammar.doctype = null;
            
            // strings ( 3 string types )
            grammar.strings = (grammar.strings) ? getStartEndMatchersFor(grammar.strings, RegExpID) : { start: null, end: null };
            grammar.strings2 = (grammar.strings2) ? getStartEndMatchersFor(grammar.strings2, RegExpID) : { start: null, end: null };
            grammar.strings3 = (grammar.strings3) ? getStartEndMatchersFor(grammar.strings3, RegExpID) : { start: null, end: null };
            
            // general identifiers ( 5 identifier types ), eg. variables, etc..
            grammar.identifiers = (grammar.identifiers) ? getMatchersFor(grammar.identifiers, RegExpID, RegExpGroups['identifiers']) : null;
            grammar.identifiers2 = (grammar.identifiers2) ? getMatchersFor(grammar.identifiers2, RegExpID, RegExpGroups['identifiers2']) : null;
            grammar.identifiers3 = (grammar.identifiers3) ? getMatchersFor(grammar.identifiers3, RegExpID, RegExpGroups['identifiers3']) : null;
            grammar.identifiers4 = (grammar.identifiers4) ? getMatchersFor(grammar.identifiers4, RegExpID, RegExpGroups['identifiers4']) : null;
            grammar.identifiers5 = (grammar.identifiers5) ? getMatchersFor(grammar.identifiers5, RegExpID, RegExpGroups['identifiers5']) : null;
            
            // numbers ( 3 number types )
            grammar.numbers = (grammar.numbers) ? getMatchersFor(grammar.numbers, RegExpID, RegExpGroups['numbers']) : null;
            grammar.numbers2 = (grammar.numbers2) ? getMatchersFor(grammar.numbers2, RegExpID, RegExpGroups['numbers2']) : null;
            grammar.numbers3 = (grammar.numbers3) ? getMatchersFor(grammar.numbers3, RegExpID, RegExpGroups['numbers3']) : null;
            
            // atoms
            grammar.atoms = (grammar.atoms) ? getMatchersFor(grammar.atoms, RegExpID, RegExpGroups['atoms']) : null;
            
            // meta
            grammar.meta = (grammar.meta) ? getMatchersFor(grammar.meta, RegExpID, RegExpGroups['meta']) : null;
            
            // defs
            grammar.defines = (grammar.defines) ? getMatchersFor(grammar.defines, RegExpID, RegExpGroups['defines']) : null;
            
            // keywords
            grammar.keywords = (grammar.keywords) ? getMatchersFor(grammar.keywords, RegExpID, RegExpGroups['keywords']) : null;
            
            // builtins
            grammar.builtins = (grammar.builtins) ? getMatchersFor(grammar.builtins, RegExpID, RegExpGroups['builtins']) : null;
            
            // assignments, eg for attributes
            grammar.assignments = (grammar.assignments) ? getMatchersFor(grammar.assignments, RegExpID, RegExpGroups['assignments']) : null;
            
            grammar.operators = { one: null, two: null, words: null };
            grammar.delimiters = { one: null, two: null, three: null };
            /*
            // operators
            if (!grammar.operators) grammar.operators = { one: null, two: null, words: null };
            grammar.operators.one = (grammar.operators.one) ? getMatchersFor(grammar.operators.one, RegExpID, RegExpGroups['operators'] && RegExpGroups['operators']['one']) : null;
            grammar.operators.two = (grammar.operators.two) ? getMatchersFor(grammar.operators.two, RegExpID, RegExpGroups['operators'] && RegExpGroups['operators']['two']) : null;
            grammar.operators.words = (grammar.operators.words) ? getMatchersFor(grammar.operators.words, RegExpID, RegExpGroups['operators'] && RegExpGroups['operators']['words']) : null;
            
            // delimiters
            if (!grammar.delimiters) grammar.delimiters = { one: null, two: null, three: null };
            grammar.delimiters.one = (grammar.delimiters.one) ? getMatchersFor(grammar.delimiters.one, RegExpID, RegExpGroups['delimiters'] && RegExpGroups['delimiters']['one']) : null;
            grammar.delimiters.two = (grammar.delimiters.two) ? getMatchersFor(grammar.delimiters.two, RegExpID, RegExpGroups['delimiters'] && RegExpGroups['delimiters']['two']) : null;
            grammar.delimiters.three = (grammar.delimiters.three) ? getMatchersFor(grammar.delimiters.three, RegExpID, RegExpGroups['delimiters'] && RegExpGroups['delimiters']['three']) : null;
            */
            
            grammar.indent = null;
            grammar.hasIndent = false;
            
            // this grammar is parsed
            grammar.__parsed = true;
            
            return grammar;
        },
        
        parseProgrammingLikeGrammar : function(grammar, base) {
            var t1, t2, i, l, RegExpID, RegExpGroups;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if (grammar.__parsed)  return grammar;
            
            grammar = extend(grammar, base);
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            RegExpGroups = grammar.RegExpGroups || {};
            grammar.RegExpGroups = null;
            delete grammar.RegExpGroups;
            
            grammar.type = null;
            delete grammar.type;
            grammar.isMarkup = false;
            
            // comments
            if (grammar.comments)
            {
                t1 = [];
                if (grammar.comments.line)  
                {
                    t2 = make_array(grammar.comments.line);
                    
                    for (i=0, l=t2.length; i<l; i++)
                        t1.push( [t2[i], null] );
                }
                if (grammar.comments.block)  
                {
                    t2 = make_array(grammar.comments.block);
                    t1.push( [t2[0], ((t2[1]) ? t2[1] : t2[0])] );
                }
                grammar.comments = (t1.length) ? getStartEndMatchersFor(t1, RegExpID) : { start: null, end: null };
            }
            else
            {
                grammar.comments = { start: null, end: null };
            }
                
            // general blocks ( 5 types ), eg. heredocs, cdata, etc..
            grammar.blocks = (grammar.blocks) ? getStartEndMatchersFor(grammar.blocks, RegExpID) : { start: null, end: null };
            grammar.blocks2 = (grammar.blocks2) ? getStartEndMatchersFor(grammar.blocks2, RegExpID) : { start: null, end: null };
            grammar.blocks3 = (grammar.blocks3) ? getStartEndMatchersFor(grammar.blocks3, RegExpID) : { start: null, end: null };
            grammar.blocks4 = (grammar.blocks4) ? getStartEndMatchersFor(grammar.blocks4, RegExpID) : { start: null, end: null };
            grammar.blocks5 = (grammar.blocks5) ? getStartEndMatchersFor(grammar.blocks5, RegExpID) : { start: null, end: null };
            
            // strings ( 3 string types )
            grammar.strings = (grammar.strings) ? getStartEndMatchersFor(grammar.strings, RegExpID) : { start: null, end: null };
            grammar.strings2 = (grammar.strings2) ? getStartEndMatchersFor(grammar.strings2, RegExpID) : { start: null, end: null };
            grammar.strings3 = (grammar.strings3) ? getStartEndMatchersFor(grammar.strings3, RegExpID) : { start: null, end: null };
            
            // general identifiers ( 5 identifier types ), eg. variables, etc..
            grammar.identifiers = (grammar.identifiers) ? getMatchersFor(grammar.identifiers, RegExpID, RegExpGroups['identifiers']) : null;
            grammar.identifiers2 = (grammar.identifiers2) ? getMatchersFor(grammar.identifiers2, RegExpID, RegExpGroups['identifiers2']) : null;
            grammar.identifiers3 = (grammar.identifiers3) ? getMatchersFor(grammar.identifiers3, RegExpID, RegExpGroups['identifiers3']) : null;
            grammar.identifiers4 = (grammar.identifiers4) ? getMatchersFor(grammar.identifiers4, RegExpID, RegExpGroups['identifiers4']) : null;
            grammar.identifiers5 = (grammar.identifiers5) ? getMatchersFor(grammar.identifiers5, RegExpID, RegExpGroups['identifiers5']) : null;
            
            // numbers ( 3 number types )
            grammar.numbers = (grammar.numbers) ? getMatchersFor(grammar.numbers, RegExpID, RegExpGroups['numbers']) : null;
            grammar.numbers2 = (grammar.numbers2) ? getMatchersFor(grammar.numbers2, RegExpID, RegExpGroups['numbers2']) : null;
            grammar.numbers3 = (grammar.numbers3) ? getMatchersFor(grammar.numbers3, RegExpID, RegExpGroups['numbers3']) : null;
            
            // atoms
            grammar.atoms = (grammar.atoms) ? getMatchersFor(grammar.atoms, RegExpID, RegExpGroups['atoms']) : null;
            
            // meta
            grammar.meta = (grammar.meta) ? getMatchersFor(grammar.meta, RegExpID, RegExpGroups['meta']) : null;
            
            // defs
            grammar.defines = (grammar.defines) ? getMatchersFor(grammar.defines, RegExpID, RegExpGroups['defines']) : null;
            
            // keywords
            grammar.keywords = (grammar.keywords) ? getMatchersFor(grammar.keywords, RegExpID, RegExpGroups['keywords']) : null;
            
            // builtins
            grammar.builtins = (grammar.builtins) ? getMatchersFor(grammar.builtins, RegExpID, RegExpGroups['builtins']) : null;
            
        
            // operators
            if (!grammar.operators) grammar.operators = { one: null, two: null, words: null };
            grammar.operators.one = (grammar.operators.one) ? getMatchersFor(grammar.operators.one, RegExpID, RegExpGroups['operators'] && RegExpGroups['operators']['one']) : null;
            grammar.operators.two = (grammar.operators.two) ? getMatchersFor(grammar.operators.two, RegExpID, RegExpGroups['operators'] && RegExpGroups['operators']['two']) : null;
            grammar.operators.words = (grammar.operators.words) ? getMatchersFor(grammar.operators.words, RegExpID, RegExpGroups['operators'] && RegExpGroups['operators']['words']) : null;
            
            // delimiters
            if (!grammar.delimiters) grammar.delimiters = { one: null, two: null, three: null };
            grammar.delimiters.one = (grammar.delimiters.one) ? getMatchersFor(grammar.delimiters.one, RegExpID, RegExpGroups['delimiters'] && RegExpGroups['delimiters']['one']) : null;
            grammar.delimiters.two = (grammar.delimiters.two) ? getMatchersFor(grammar.delimiters.two, RegExpID, RegExpGroups['delimiters'] && RegExpGroups['delimiters']['two']) : null;
            grammar.delimiters.three = (grammar.delimiters.three) ? getMatchersFor(grammar.delimiters.three, RegExpID, RegExpGroups['delimiters'] && RegExpGroups['delimiters']['three']) : null;
            
            // types of indent etc..
            /*var hasIndent = false;
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
            grammar.hasIndent = hasIndent;*/
            
            grammar.indent = null;
            grammar.hasIndent = false;
            
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
            
            // markup-like grammar
            if (grammar.isMarkup)
            {
                // generate parser with token factories (closures make grammar, LOCALS etc.. available locally)
                return function(conf, parserConf) {
                    
                    var tokenBase = tokenBaseMLFactory(grammar, LOCALS, conf, parserConf);
                    var token = tokenFactory(tokenBase, grammar, LOCALS, conf, parserConf);
                    var indentation = indentationFactory(LOCALS, conf, parserConf);
                    
                    // return the parser for the grammar
                    parser =  {
                        
                        startState: function(basecolumn) {
                              
                              LOCALS.basecolumn = basecolumn || 0;
                              
                              return {
                                  tokenize : null,
                                  lastToken : T_DEFAULT
                              };
                        },
                        
                        token: token,

                        indent: indentation
                        
                    };
                    
                    return parser;
                };
            }
            // programming-like grammar
            else
            {
                // generate parser with token factories (closures make grammar, LOCALS etc.. available locally)
                return function(conf, parserConf) {
                    
                    var tokenBase = tokenBaseFactory(grammar, LOCALS, conf, parserConf);
                    var token = tokenFactory(tokenBase, grammar, LOCALS, conf, parserConf);
                    var indentation = indentationFactory(LOCALS, conf, parserConf);
                    
                    // return the parser for the grammar
                    parser =  {
                        
                        startState: function(basecolumn) {
                              
                              LOCALS.basecolumn = basecolumn || 0;
                              
                              return {
                                  tokenize : null,
                                  lastToken : T_DEFAULT
                              };
                        },
                        
                        token: token,

                        indent: indentation
                        
                    };
                    
                    return parser;
                };
            }
        }
    };
    
    // export it
    if ('undefined' != typeof (module) && module.exports)  module.exports = self;
    
    else if ('undefined' != typeof (exports)) exports = self;
    
    else this.CodeMirrorGrammar = self;

    
}).call(this);