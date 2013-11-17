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
    
    var slice = Array.prototype.slice, 
        
        hasKey = Object.prototype.hasOwnProperty,
        
        Str = Object.prototype.toString,

        is_ = function(v, t) {
            return (t === v);
        },
        
        is_number = function(n) {
            return ('number'==typeof(n) || n instanceof Number);
        },
        
        is_bool = function(b) {
            return (true === b || false === b);
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
            
            // order of tokens parsing
            "TokenOrder" : [
                "comments",
                "blocks",
                "blocks2",
                "blocks3",
                "blocks4",
                "blocks5",
                "numbers",
                "numbers2",
                "numbers3",
                "strings",
                "strings2",
                "strings3",
                "strings4",
                "strings5",
                "keywords",
                "builtins",
                "operators",
                "delimiters",
                "atoms",
                "meta",
                "defines",
                "identifiers",
                "identifiers2",
                "identifiers3",
                "identifiers4",
                "identifiers5"
            ],
            
            //
            // style model
            
            // lang token type  -> CodeMirror (style) tag
            "Style" : {
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
                "string4":     "string",
                "string5":     "string",
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
            
            // general identifiers
            "identifiers" : null,
            "identifiers2" : null,
            "identifiers3" : null,
            "identifiers4" : null,
            "identifiers5" : null,
            
            // numbers
            "numbers" : null,
            "numbers2" : null,
            "numbers3" : null,

            // general strings
            "strings" : null,
            "strings2" : null,
            "strings3" : null,
            "strings4" : null,
            "strings5" : null,
            
            // general attributes, in order of matching
            //"attributes" : null,
            //"attributes2" : null,
            //"attributes3" : null,
            //"properties" : null,
            
            // operators
            "operators" : null,
            
            // delimiters
            "delimiters" : null,
            
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
            
            // order of token parsing
            "TokenOrder" : [
                "comments",
                "blocks",
                "blocks2",
                "blocks3",
                "blocks4",
                "blocks5",
                "doctype",
                "atoms",
                "numbers",
                "numbers2",
                "numbers3",
                "strings",
                "strings2",
                "strings3",
                "strings4",
                "strings5",
                "meta",
                "attributes",
                "attributes2",
                "attributes3",
                "assignments",
                "tags",
                "tags2",
                "tags3",
                "defines",
                "keywords",
                "builtins",
                "identifiers",
                "identifiers2",
                "identifiers3",
                "identifiers4",
                "identifiers5"
            ],
            
            //
            // style model
            
            // lang token type  -> CodeMirror (style) tag
            "Style" : {
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
                "string4":     "string",
                "string5":     "string",
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
            
            // general tags
            "tags" : null,
            "tags2" : null,
            "tags3" : null,
            
            "autoclose" : null,
            
            // general attributes
            "attributes" : null,
            "attributes2" : null,
            "attributes3" : null,
            //"properties" : null,
            
            // general identifiers
            "identifiers" : null,
            "identifiers2" : null,
            "identifiers3" : null,
            "identifiers4" : null,
            "identifiers5" : null,
            
            // numbers
            "numbers" : null,
            "numbers2" : null,
            "numbers3" : null,

            // general strings
            "strings" : null,
            "strings2" : null,
            "strings3" : null,
            "strings4" : null,
            "strings5" : null,
            
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
            
            // assignments (eg for attributes)
            "assignments" : null,
            
            // operators
            "operators" : null,
            
            // delimiters
            "delimiters" : null,
            
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
        // grammar types
        T_PROGRAMMING_LIKE = 1,
        T_MARKUP_LIKE = 2,
        
        //
        // matcher types
        T_SIMPLEMATCHER = 32,
        T_CHARMATCHER = 33,
        T_STRMATCHER = 34,
        T_REGEXMATCHER = 36,
        T_NULLMATCHER = T_ENDOFLINEMATCHER = 40,
        T_DUMMYMATCHER = 48,
        T_COMPOSITEMATCHER = 64,
        T_BLOCKMATCHER = 128,
        T_TAGMATCHER = 256,
        
        //
        // tokenizer types
        T_TOKENBASE = 200,
        T_TOKENBASEML = 210,
        T_TOKEN = 220,
        
        //
        // indentation types
        T_TOP_LEVEL = 100,
        T_STATEMENT_LEVEL = 110,
        T_DELIM_LEVEL = 120,
        T_BLOCK_LEVEL = 130,
        T_DO_INDENT = 140,
        T_DO_DEDENT = 150
    ;
    
    //
    // matcher factories
    var ESC = /([\-\.\*\+\?\^\$\{\}\(\)\|\[\]\/\\])/g,
    
        byLength = function(a, b) { return b.length - a.length },
        
        isRegexp = function(s, id) {
            return (
                is_string(id) && is_string(s) && id.length &&
                id.length <= s.length && id == s.substr(0, id.length)
            );
        },
        
        getRegexp = function(r, rid)  {
            if ( !r || is_number(r) ) return r;
            
            var l = (rid) ? (rid.length||0) : 0;
            
            if ( l && rid == r.substr(0, l) /*isRegexp(r, rid)*/ )
                return new RegExp("^(" + r.substr(l) + ")");
            
            else
                return r;
        },
        
        getCombinedRegexp = function(tokens)  {
            for (var i=0, l=tokens.length; i<l; i++) tokens[i] = tokens[i].replace(ESC, '\\$1');
            return new RegExp("^((" + tokens.sort( byLength ).join( ")|(" ) + "))\\b");
        },
        
        SimpleMatcher = function(type, r, key) {
            
            // get a fast customized matcher for < r >
            
            // manipulate the codemirror stream directly for speed,
            // if codemirror code for stream matching changes,
            // only this part of the code needs to be adapted
            var strlen;
            key = key || 0;
            
            //this.r = r;
            //this.key = key || 0;
            this.type = type || T_STRMATCHER;
            
            if (T_CHARMATCHER == this.type)
            {
                this.match = function(stream, eat) {
                    
                    // manipulate the codemirror stream directly for speed
                    eat = (false !== eat);
                    var casedr = r; //(ignoreCase) ? r.toLowerCase() : r;
                    var casedch = ch = stream.string.charAt(stream.pos) || '';
                    //var casedch = ch; //(ignoreCase) ? sch.toLowerCase() : ch;
                    if (casedr == casedch) 
                    {
                        if (eat) stream.pos += 1;
                        return { key: key, val: ch };
                    }
                    return false;
                };
            }
            else if (T_STRMATCHER == this.type)
            {
                strlen = r.length;
                this.match = function(stream, eat) {
                    
                    // manipulate the codemirror stream directly for speed
                    eat = (false !== eat);
                    var casedr = r; //(ignoreCase) ? r.toLowerCase() : r;
                    var casedstr = str = stream.string.substr(stream.pos, strlen);
                    //var casedstr = str; //(ignoreCase) ? str.toLowerCase() : str;
                    if (casedr == casedstr) 
                    {
                        if (eat) stream.pos += strlen;
                        return { key: key, val: str };
                    }
                    return false;
                };
            }
            else if (T_REGEXMATCHER == this.type)
            {
                this.match = function(stream, eat) {
                    
                    // manipulate the codemirror stream directly for speed
                    eat = (false !== eat);
                    var match = stream.string.slice(stream.pos).match(r);
                    if (!match || match.index > 0) return false;
                    if (eat) stream.pos += match[0].length;
                    return { key: key, val: match };
                };
            }
            else if (T_ENDOFLINEMATCHER == this.type)
            {
                this.match = function(stream, eat) { 
                    // manipulate the codemirror stream directly for speed
                    if (false !== eat) stream.pos = stream.string.length; // skipToEnd
                    return { key: key, val: "" };
                };
            }
            else if (T_DUMMYMATCHER == this.type)
            {
                this.match = function(stream, eat) { 
                    return { key: key, val: r };
                };
            }
            else
            {
                // unknown type
                this.match = function(stream, eat) { return false; };
            }
        },
        
        CompositeMatcher = function(matchers, useOwnKey) {
            
            var l = matchers.length;
            
            useOwnKey = (false!==useOwnKey);
            
            //this.matchers = matchers;
            this.type = T_COMPOSITEMATCHER;
            
            if (0 >= l)
            {
                // no matchers
                this.match = function(stream, eat) { return false; };
            }
            else if (1 == l)
            {
                // if only one matcher, use it directly
                this.match = matchers[0].match;
            }
            else
            {
                // else check all the matchers one-by-one
                if (useOwnKey)
                {
                    this.match = function(stream, eat) {
                        var i, m;
                        for (i=0; i<l; i++)
                        {
                            // each one is a custom matcher in its own
                            m = matchers[i].match(stream, eat);
                            if (m) return { key: i, val: m.val };
                        }
                        return false;
                    };
                }
                else
                {
                    this.match = function(stream, eat) {
                        var i, m;
                        for (i=0; i<l; i++)
                        {
                            // each one is a custom matcher in its own
                            m = matchers[i].match(stream, eat);
                            if (m) return m;
                        }
                        return false;
                    };
                }
            }
        },
        
        BlockMatcher = function(start, end) {
            
            var token,
                startMatcher = new CompositeMatcher(start, false),
                endMatcher
            ;
            
            this.type = T_BLOCKMATCHER;
            
            this.match = function(stream, eat) {
                
                token = startMatcher.match(stream, eat);
                
                if (token)
                {
                    endMatcher = end[ token.key ];
                    
                    // regex given, get the matched group for the ending of this block
                    if ( is_number(endMatcher) )
                    {
                        // the regex is wrapped in an additional group, 
                        // add 1 to the requested regex group transparently
                        endMatcher = getSimpleMatcher( token.val[ endMatcher+1 ] );
                    }
                    
                    return endMatcher;
                }
                
                return false;
            };
        },
        
        TagMatcher = function(start, name, end) {
            
            var token,
                startMatcher = new CompositeMatcher(start, false),
                tagName = "", nameMatcher, endMatcher
            ;
            
            this.type = T_BLOCKMATCHER;
            
            this.match = function(stream, eat) {
                
                token = startMatcher.match(stream, eat);
                
                if (token)
                {
                    nameMatcher = name[ token.key ];
                    // regex given, get the matched group for the ending of this block
                    if ( is_number(nameMatcher) )
                    {
                        // the regex is wrapped in an additional group, 
                        // add 1 to the requested regex group transparently
                        //nameMatcher = getSimpleMatcher( token.val[ nameMatcher+1 ] );
                        tagName = token.val[ nameMatcher+1 ];
                    }
                    else
                    {
                        tagName = nameMatcher.match( token.val );
                        tagName = (tagName) ? tagName.val : "";
                    }
                    
                    endMatcher = end[ token.key ];
                    // regex given, get the matched group for the ending of this block
                    if ( is_number(endMatcher) )
                    {
                        // the regex is wrapped in an additional group, 
                        // add 1 to the requested regex group transparently
                        endMatcher = getSimpleMatcher( token.val[ endMatcher+1 ] );
                    }
                    
                    return [endMatcher, tagName];
                }
                
                return false;
            };
        },
        
        getSimpleMatcher = function(r, key) {
            // get a fast customized matcher for < r >
            
            // manipulate the codemirror stream directly for speed,
            // if codemirror code for stream matching changes,
            // only this part of the code needs to be adapted
            
            key = key || 0;
            
            if ( is_number( r ) )  return r;
            
            else if ( is_bool( r ) ) return new SimpleMatcher(T_DUMMYMATCHER, r, key);
            
            else if ( is_(null, r) )  return new SimpleMatcher(T_ENDOFLINEMATCHER, r, key);
            
            else if ( is_char( r ) )  return new SimpleMatcher(T_CHARMATCHER, r, key);
            
            else if ( is_string( r ) ) return new SimpleMatcher(T_STRMATCHER, r, key);
            
            else if ( is_regex( r ) )  return new SimpleMatcher(T_REGEXMATCHER, r, key);
            
            // unknown
            return r;
        },
        
        getCompositeMatcher = function(tokens, RegExpID, isRegExpGroup) {
            
            var tmp, i, l, l2, array_of_arrays = false, has_regexs = false;
            
            tmp = make_array(tokens);
            l = tmp.length;
            
            if ( isRegExpGroup )
            {   
                l2 = (l>>1) + 1;
                // check if tokens can be combined in one regular expression
                // if they do not contain sub-arrays or regular expressions
                for (i=0; i<=l2; i++)
                {
                    if ( is_array( tmp[i] ) || is_array( tmp[l-1-i] ) ) 
                    {
                        array_of_arrays = true;
                        break;
                    }
                    else if ( isRegexp( tmp[i], RegExpID ) || isRegexp( tmp[l-1-i], RegExpID ) )
                    {
                        has_regexs = true;
                        break;
                    }
                }
            }
            
            if ( isRegExpGroup && !(array_of_arrays || has_regexs) )
            {   
                //return new CompositeMatcher( [ getSimpleMatcher( getCombinedRegexp( tmp ) ) ] );
                return getSimpleMatcher( getCombinedRegexp( tmp ) );
            }
            else
            {
                for (i=0; i<l; i++)
                {
                    if ( is_array( tmp[i] ) )
                        tmp[i] = getCompositeMatcher( tmp[i], RegExpID, isRegExpGroup );
                    else
                        tmp[i] = getSimpleMatcher( getRegexp( tmp[i], RegExpID ), i );
                }
                
                return (tmp.length > 1) ? new CompositeMatcher( tmp ) : tmp[0];
            }
        },
        
        getBlockMatcher = function(tokens, RegExpID) {
            var tmp, i, l, start, end, t1, t2;
            
            // build start/end mappings
            start=[]; end=[];
            tmp = make_array(tokens);
            if ( !is_array(tmp[0]) ) tmp = [ tmp ]; // array of arrays
            for (i=0, l=tmp.length; i<l; i++)
            {
                t1 = getSimpleMatcher( getRegexp( tmp[i][0], RegExpID ), i );
                t2 = (tmp[i].length>1) ? getSimpleMatcher( getRegexp( tmp[i][1], RegExpID ), i ) : t1;
                start.push( t1 );  end.push( t2 );
            }
            return new BlockMatcher(start, end);
        },
        
        getTagMatcher = function(tokens, RegExpID, isRegExpGroup) {
            var tmp, i, l, start, name, end, t1, t2, t3;
            
            // build start/end mappings
            start=[]; name=[]; end=[];
            tmp = make_array(tokens);
            if ( !is_array(tmp[0]) ) tmp = [ tmp ]; // array of arrays
            for (i=0, l=tmp.length; i<l; i++)
            {
                t1 = getSimpleMatcher( getRegexp( tmp[i][0], RegExpID ), i );
                t2 = (tmp[i].length>2) ? getSimpleMatcher( getRegexp( tmp[i][2], RegExpID ), i ) : t1;
                t3 = (tmp[i].length>1) ? getCompositeMatcher( getRegexp( tmp[i][1], RegExpID, isRegExpGroup ), i ) : t1;
                start.push( t1 );  name.push(t3); end.push( t2 );
            }
            return new TagMatcher(start, name, end);
        }
    ;
    
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
        
        getTagTokenizer = function(tagMatcher, style, stack, nextTokenizer) {
            
            var endTag = tagMatcher[0], tagName = tagMatcher[1];
            
            var tokenTag = function(stream, state) {
                
                var top;
                
                //console.log(stack);
                
                top = stack[0] || null;
                if ( top && (endTag === top[0]) )
                {
                    stack.shift();
                    state.lastToken = T_ENDTAG;
                }
                else
                {
                    stack.unshift( [ endTag, tokenTag, tagName ] );
                    state.lastToken = T_TAG;
                }
                
                //console.log(stack);
                
                state.tokenize = nextTokenizer || null;
                return style;
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
                indent = grammar.indent,
                
                stack = []
            ;
            
            var tokenBase = function(stream, state) {
                
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
                
                attributes = grammar.attributes || null,
                attributes2 = grammar.attributes2 || null,
                attributes3 = grammar.attributes3 || null,
                
                assignments = grammar.assignments || null,
                
                hasIndent = grammar.hasIndent,
                indent = grammar.indent,
                
                stack = []
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
                            state.tokenize = getTagTokenizer(endMatcher, tokenStyle, stack);
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
      
    //
    //  CodeMirror Grammar main class
    
    var self = {
        
        VERSION : VERSION,
        
        parseGrammar : function(grammar, base) {
            
            if (grammar.type && "markup-like" == grammar.type)
                return self.parseMarkupLikeGrammar(grammar, base || markupLikeGrammar);
            
            else
                return self.parseProgrammingLikeGrammar(grammar, base || programmingLikeGrammar);
        },
        
        parseMarkupLikeGrammar : function(grammar, base) {
            var t1, t2, i, l, RegExpID, RegExpGroups, 
                tokens, numTokens, Style, _tokens = [], 
                tokid, ll, tok, toktype, tokstyle;
            
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
            
            grammar.type = T_MARKUP_LIKE;
            
            tokens = grammar.TokenOrder || [];
            numTokens = tokens.length;
            
            Style = grammar.Style || {};
            
            for (t=0; t<numTokens; t++)
            {
                tokid = tokens[t];
                
                if ( !grammar[tokid] ) continue;
                
                tok = null;
                
                // comments
                if ("comments"==tokid)
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
                    tok = (t1.length) ? getBlockMatcher(t1, RegExpID) : null;
                    toktype = T_COMMENT;
                    tokstyle = Style.comment;
                }
                
                // general blocks ( 5 types ), eg. heredocs, cdata, etc..
                else if ("blocks"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block;
                }
                else if ("blocks2"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks2, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block2;
                }
                else if ("blocks3"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks3, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block3;
                }
                else if ("blocks4"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks4, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block4;
                }
                else if ("blocks5"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks5, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block5;
                }
                
                // tags ( 3 types )
                else if ("tags"==tokid)
                {
                    tok = getTagMatcher(grammar.tags, RegExpID, RegExpGroups['tags']) || null;
                    toktype = T_TAG;
                    tokstyle = Style.tag;
                }
                else if ("tags2"==tokid)
                {
                    tok = getTagMatcher(grammar.tags2, RegExpID, RegExpGroups['tags2']) || null;
                    toktype = T_TAG;
                    tokstyle = Style.tag2;
                }
                else if ("tags3"==tokid)
                {
                    tok = getTagMatcher(grammar.tags3, RegExpID, RegExpGroups['tags3']) || null;
                    toktype = T_TAG;
                    tokstyle = Style.tag3;
                }
                // attributes ( 3 types )
                else if ("attributes"==tokid)
                {
                    tok = getCompositeMatcher(grammar.attributes, RegExpID, RegExpGroups['attributes']) || null;
                    toktype = T_ATTRIBUTE;
                    tokstyle = Style.attribute;
                }
                else if ("attributes2"==tokid)
                {
                    tok = getCompositeMatcher(grammar.attributes2, RegExpID, RegExpGroups['attributes2']) || null;
                    toktype = T_ATTRIBUTE;
                    tokstyle = Style.attribute2;
                }
                else if ("attributes3"==tokid)
                {
                    tok = getCompositeMatcher(grammar.attributes3, RegExpID, RegExpGroups['attributes3']) || null;
                    toktype = T_ATTRIBUTE;
                    tokstyle = Style.attribute3;
                }
                // assignments, eg for attributes
                else if ("assignments"==tokid)
                {
                    tok = getCompositeMatcher(grammar.assignments, RegExpID, RegExpGroups['assignments']) || null;
                    toktype = T_ASSIGNMENT;
                    tokstyle = Style.assignment;
                }
                
                // doctype
                else if ("doctype"==tokid)
                {
                    continue;
                }
                
                // general strings ( 5 types )
                else if ("strings"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string;
                }
                else if ("strings2"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings2, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string2;
                }
                else if ("strings3"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings3, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string3;
                }
                else if ("strings4"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings4, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string4;
                }
                else if ("strings5"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings5, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string5;
                }
                
                // numbers ( 3 types )
                else if ("numbers"==tokid)
                {
                    tok = getCompositeMatcher(grammar.numbers, RegExpID, RegExpGroups['numbers']) || null;
                    toktype = T_NUMBER;
                    tokstyle = Style.number;
                }
                else if ("numbers2"==tokid)
                {
                    tok = getCompositeMatcher(grammar.numbers2, RegExpID, RegExpGroups['numbers2']) || null;
                    toktype = T_NUMBER;
                    tokstyle = Style.number2;
                }
                else if ("numbers3"==tokid)
                {
                    tok = getCompositeMatcher(grammar.numbers3, RegExpID, RegExpGroups['numbers3']) || null;
                    toktype = T_NUMBER;
                    tokstyle = Style.number3;
                }
                
                // general identifiers ( 5 types ), eg. variables, etc..
                else if ("identifiers"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers, RegExpID, RegExpGroups['identifiers']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier;
                }
                else if ("identifiers2"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers2, RegExpID, RegExpGroups['identifiers2']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier2;
                }
                else if ("identifiers3"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers3, RegExpID, RegExpGroups['identifiers3']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier3;
                }
                else if ("identifiers4"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers4, RegExpID, RegExpGroups['identifiers4']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier4;
                }
                else if ("identifiers5"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers5, RegExpID, RegExpGroups['identifiers5']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier5;
                }
                
                // atoms
                else if ("atoms"==tokid)
                {
                    tok = getCompositeMatcher(grammar.atoms, RegExpID, RegExpGroups['atoms']) || null;
                    toktype = T_ATOM;
                    tokstyle = Style.atom;
                }
                
                // meta
                else if ("meta"==tokid)
                {
                    tok = getCompositeMatcher(grammar.meta, RegExpID, RegExpGroups['meta']) || null;
                    toktype = T_META;
                    tokstyle = Style.meta;
                }
                
                // defs
                else if ("defines"==tokid)
                {
                    tok = getCompositeMatcher(grammar.defines, RegExpID, RegExpGroups['defines']) || null;
                    toktype = T_DEF;
                    tokstyle = Style.defines;
                }
                
                // keywords
                else if ("keywords"==tokid)
                {
                    tok = getCompositeMatcher(grammar.keywords, RegExpID, RegExpGroups['keywords']) || null;
                    toktype = T_KEYWORD;
                    tokstyle = Style.keyword;
                }
                
                // builtins
                else if ("builtins"==tokid)
                {
                    tok = getCompositeMatcher(grammar.builtins, RegExpID, RegExpGroups['builtins']) || null;
                    toktype = T_BUILTIN;
                    tokstyle = Style.builtin;
                }
                
                // operators
                else if ("operators"==tokid)
                {
                    continue;
                }
                // delimiters
                else if ("delimiters"==tokid)
                {
                    continue;
                }
                
                if (tok)
                {
                    grammar[tokid] = tok;
                    _tokens.push( [ tok, toktype, tokstyle ] );
                }
                else
                {
                    grammar[tokid] = null;
                }
            }
            
            grammar.TokenOrder = _tokens;
            
            grammar.indent = null;
            grammar.hasIndent = false;
            
            // this grammar is parsed
            grammar.__parsed = true;
            
            return grammar;
        },
        
        parseProgrammingLikeGrammar : function(grammar, base) {
            var t1, t2, i, l, RegExpID, RegExpGroups, 
                tokens, numTokens, Style, _tokens = [], 
                tokid, ll, tok, toktype, tokstyle;
            
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
            
            grammar.type = T_PROGRAMMING_LIKE;
            
            tokens = grammar.TokenOrder || [];
            numTokens = tokens.length;
            
            Style = grammar.Style || {};
            
            for (t=0; t<numTokens; t++)
            {
                tokid = tokens[t];
                
                if ( !grammar[tokid] ) continue;
                
                tok = null;
                
                // comments
                if ("comments"==tokid)
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
                    tok = (t1.length) ? getBlockMatcher(t1, RegExpID) : null;
                    toktype = T_COMMENT;
                    tokstyle = Style.comment;
                }
                
                // general blocks ( 5 types ), eg. heredocs, cdata, etc..
                else if ("blocks"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block;
                }
                else if ("blocks2"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks2, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block2;
                }
                else if ("blocks3"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks3, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block3;
                }
                else if ("blocks4"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks4, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block4;
                }
                else if ("blocks5"==tokid)
                {
                    tok = getBlockMatcher(grammar.blocks5, RegExpID) || null;
                    toktype = T_BLOCK;
                    tokstyle = Style.block5;
                }
                
                // general strings ( 5 types )
                else if ("strings"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string;
                }
                else if ("strings2"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings2, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string2;
                }
                else if ("strings3"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings3, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string3;
                }
                else if ("strings4"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings4, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string4;
                }
                else if ("strings5"==tokid)
                {
                    tok = getBlockMatcher(grammar.strings5, RegExpID) || null;
                    toktype = T_STRING;
                    tokstyle = Style.string5;
                }
                
                // numbers ( 3 types )
                else if ("numbers"==tokid)
                {
                    tok = getCompositeMatcher(grammar.numbers, RegExpID, RegExpGroups['numbers']) || null;
                    toktype = T_NUMBER;
                    tokstyle = Style.number;
                }
                else if ("numbers2"==tokid)
                {
                    tok = getCompositeMatcher(grammar.numbers2, RegExpID, RegExpGroups['numbers2']) || null;
                    toktype = T_NUMBER;
                    tokstyle = Style.number2;
                }
                else if ("numbers3"==tokid)
                {
                    tok = getCompositeMatcher(grammar.numbers3, RegExpID, RegExpGroups['numbers3']) || null;
                    toktype = T_NUMBER;
                    tokstyle = Style.number3;
                }
                
                // general identifiers ( 5 types ), eg. variables, etc..
                else if ("identifiers"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers, RegExpID, RegExpGroups['identifiers']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier;
                }
                else if ("identifiers2"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers2, RegExpID, RegExpGroups['identifiers2']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier2;
                }
                else if ("identifiers3"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers3, RegExpID, RegExpGroups['identifiers3']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier3;
                }
                else if ("identifiers4"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers4, RegExpID, RegExpGroups['identifiers4']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier4;
                }
                else if ("identifiers5"==tokid)
                {
                    tok = getCompositeMatcher(grammar.identifiers5, RegExpID, RegExpGroups['identifiers5']) || null;
                    toktype = T_IDENTIFIER;
                    tokstyle = Style.identifier5;
                }
                
                // atoms
                else if ("atoms"==tokid)
                {
                    tok = getCompositeMatcher(grammar.atoms, RegExpID, RegExpGroups['atoms']) || null;
                    toktype = T_ATOM;
                    tokstyle = Style.atom;
                }
                
                // meta
                else if ("meta"==tokid)
                {
                    tok = getCompositeMatcher(grammar.meta, RegExpID, RegExpGroups['meta']) || null;
                    toktype = T_META;
                    tokstyle = Style.meta;
                }
                
                // defs
                else if ("defines"==tokid)
                {
                    tok = getCompositeMatcher(grammar.defines, RegExpID, RegExpGroups['defines']) || null;
                    toktype = T_DEF;
                    tokstyle = Style.defines;
                }
                
                // keywords
                else if ("keywords"==tokid)
                {
                    tok = getCompositeMatcher(grammar.keywords, RegExpID, RegExpGroups['keywords']) || null;
                    toktype = T_KEYWORD;
                    tokstyle = Style.keyword;
                }
                
                // builtins
                else if ("builtins"==tokid)
                {
                    tok = getCompositeMatcher(grammar.builtins, RegExpID, RegExpGroups['builtins']) || null;
                    toktype = T_BUILTIN;
                    tokstyle = Style.builtin;
                }
                
                // operators
                else if ("operators"==tokid)
                {
                    tok = getCompositeMatcher(grammar.operators, RegExpID, RegExpGroups['operators']) || null;
                    toktype = T_OP;
                    tokstyle = Style.operator;
                }
                
                // delimiters
                else if ("delimiters"==tokid)
                {
                    tok = getCompositeMatcher(grammar.delimiters, RegExpID, RegExpGroups['delimiters']) || null;
                    toktype = T_DELIM;
                    tokstyle = Style.delimiter;
                }
                
                if (tok)
                {
                    grammar[tokid] = tok;
                    _tokens.push( [tok, toktype, tokstyle] );
                }
                else
                {
                    grammar[tokid] = null;
                }
            }
            
            grammar.TokenOrder = _tokens;
            
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
            
            var 
                LOCALS = { 
                    // default return code, when no match found
                    // 'null' should be used in most cases
                    DEFAULT: DEFAULT || null 
                },
                tokenBase,  token, indentation
            ;
            
            // markup-like grammar
            if (T_MARKUP_LIKE == grammar.type)
            {
                tokenBase = tokenBaseMLFactory(grammar, LOCALS);
            }
            // programming-like grammar
            else
            {
                tokenBase = tokenBaseFactory(grammar, LOCALS);
            }
            token = tokenFactory(tokenBase, grammar, LOCALS);
            indentation = indentationFactory(LOCALS);
            
            // generate parser with token factories (grammar, LOCALS are available locally by closures)
            return function(conf, parserConf) {
                
                LOCALS.conf = conf;
                LOCALS.parserConf = parserConf;
                
                // return the (codemirror) parser mode for the grammar
                return  {
                    startState: function( basecolumn ) {
                        
                        LOCALS.basecolumn = basecolumn || 0;
                        
                        return {
                            tokenize : null,
                            lastToken : T_DEFAULT
                        };
                    },
                    
                    token: token,
                    
                    indent: indentation
                };
            };
        }
    };
    
    // export it
    if ('undefined' != typeof (module) && module.exports)  module.exports = self;
    
    else if ('undefined' != typeof (exports)) exports = self;
    
    else this.CodeMirrorGrammar = self;

    
}).call(this);