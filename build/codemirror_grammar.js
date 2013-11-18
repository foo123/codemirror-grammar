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
    
    var VERSION = "0.2";
        
    //
    // parser types
    var    
        //
        // javascript variable types
        T_NUM = 2;
        T_BOOL = 4;
        T_STR = 8;
        T_CHAR= 9;
        T_REGEX = 16;
        T_ARRAY = 32;
        T_OBJ = 64;
        T_NULL = 128;
        T_UNDEF = 256;
        T_UNKNOWN = 512;
        
        //
        // grammar types
        T_PROGRAMMING_LIKE = 1,
        T_MARKUP_LIKE = 2,
        
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
        // matcher types
        T_SIMPLEMATCHER = 32,
        T_CHARMATCHER = 33,
        T_STRMATCHER = 34,
        T_REGEXMATCHER = 36,
        T_EOLMATCHER = 40,
        T_DUMMYMATCHER = 48,
        T_COMPOSITEMATCHER = 64,
        T_BLOCKMATCHER = 128,
        T_TAGMATCHER = 256,
        
        //
        // tokenizer types
        T_TOKENBASE = 200,
        T_TOKENBASEML = 210,
        T_TOKEN = 220//,
        
        //
        // indentation types
        /*T_TOP_LEVEL = 100,
        T_STATEMENT_LEVEL = 110,
        T_DELIM_LEVEL = 120,
        T_BLOCK_LEVEL = 130,
        T_DO_INDENT = 140,
        T_DO_DEDENT = 150*/
    ;
    
    var slice = Array.prototype.slice, 
        
        hasKey = Object.prototype.hasOwnProperty,  Str = Object.prototype.toString,

        get_type = function(v) {
            var type_of = typeof(v), to_string = Str.call(v);
            
            if ('number' == type_of || v instanceof Number)  return T_NUM;
            
            else if (true === v || false === v)  return T_BOOL;
            
            else if (v && ('string' == type_of || v instanceof String) && 1 == v.length)  return T_CHAR;
            
            else if (v && ('string' == type_of || v instanceof String))  return T_STR;
            
            else if (v && ("[object RegExp]" == to_string || v instanceof RegExp))  return T_REGEX;
            
            else if (v && ("[object Array]" == to_string || v instanceof Array))  return T_ARRAY;
            
            else if (v && "[object Object]" == to_string)  return T_OBJ;
            
            else if (null === v)  return T_NULL;
            
            else if (undef === v)  return T_UNDEF;
            
            // unkown type
            return T_UNKNOWN;
        },
        
        make_array = function(a) {
            return ( T_ARRAY == get_type( a ) ) ? a : [a];
        },
        
        make_array_2 = function(a) {
            a = make_array( a );
            if ( T_ARRAY != get_type( a[0] ) ) a = [ a ]; // array of arrays
            return a;
        },
        
        clone = function(o) {
            var T = get_type( o ), T2;
            
            if (T_OBJ != T && T_ARRAY != T) return o;
            
            var co = {}, k;
            for (k in o) 
            {
                if ( hasKey.call(o, k) ) 
                { 
                    T2 = get_type( o[k] );
                    
                    if (T_OBJ == T2)  co[k] = clone(o[k]);
                    
                    else if (T_ARRAY == T2)  co[k] = o[k].slice();
                    
                    else  co[k] = o[k]; 
                }
            }
            return co;
        },
        
        extend = function() {
            var args = slice.call(arguments), argslen = args.length;
            
            if ( argslen<1 ) return null;
            else if ( argslen<2 ) return clone( args[0] );
            
            var o1 = args.shift(), o2, o = clone(o1), i, k, T; 
            argslen--;            
            
            for (i=0; i<argslen; i++)
            {
                o2 = args.shift();
                if ( !o2 ) continue;
                
                for (k in o2) 
                { 
                    if ( hasKey.call(o2, k) )
                    {
                        if ( hasKey.call(o1, k) ) 
                        { 
                            T = get_type( o1[k] );
                            
                            if ( (T_OBJ & ~T_STR) & T)  o[k] = extend( o1[k], o2[k] );
                            
                            //else if (T_ARRAY == T)  o[k] = o1[k].slice();
                            
                            //else  o[k] = o1[k];
                        }
                        else
                        {
                            o[k] = clone( o2[k] );
                        }
                    }
                }
            }
            return o;
        }
    ;
    
    var
        //
        // default grammar settings
        defaultGrammar = {
            
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
                "attributes",
                "attributes2",
                "attributes3",
                "assignments",
                "tags",
                "tags2",
                "tags3",
                "keywords",
                "builtins",
                "operators",
                "delimiters",
                "meta",
                "defines",
                "identifiers",
                "identifiers2",
                "identifiers3",
                "identifiers4",
                "identifiers5"
            ],
            
            //
            // Style model
            "Style" : {
                
                // lang token type  -> CodeMirror (style) tag
                "error":        "error",
                "comments":     "comment",
                "meta":         "meta",
                "defines":      "def",
                "atoms":        "atom",
                "keywords":     "keyword",
                "builtins":     "builtin",
                "identifiers":  "variable",
                "identifiers2": "variable",
                "identifiers3": "variable",
                "identifiers4": "variable",
                "identifiers5": "variable",
                "tags":         "tag",
                "tags2":        "tag",
                "tags3":        "tag",
                "attributes":   "attribute",
                "attributes2":  "attribute",
                "attributes3":  "attribute",
                "numbers":      "number",
                "numbers2":     "number",
                "numbers3":     "number",
                "strings":      "string",
                "strings2":     "string",
                "strings3":     "string",
                "strings4":     "string",
                "strings5":     "string",
                "blocks":       "string",
                "blocks2":      "string",
                "blocks3":      "string",
                "blocks4":      "string",
                "blocks5":      "string",
                "operators":    "operator",
                "delimiters":   null,
                "assignments":  null
            },

            
            //
            // Lexical model
            "Lex" : {
                
                // comments
                "comments" : null,
                
                // general blocks ( 5 types ), eg heredocs, cdata, etc..
                "blocks" : null,
                "blocks2" : null,
                "blocks3" : null,
                "blocks4" : null,
                "blocks5" : null,
                
                // general (markup-like) tags ( 3 types )
                "tags" : null,
                "tags2" : null,
                "tags3" : null,
                "autoclose" : null,
            
                // general identifiers ( 5 types ), variables, function names etc..
                "identifiers" : null,
                "identifiers2" : null,
                "identifiers3" : null,
                "identifiers4" : null,
                "identifiers5" : null,
                
                // general numbers ( 3 types )
                "numbers" : null,
                "numbers2" : null,
                "numbers3" : null,

                // general strings ( 5 types )
                "strings" : null,
                "strings2" : null,
                "strings3" : null,
                "strings4" : null,
                "strings5" : null,
                
                // general attributes ( 3 types )
                "attributes" : null,
                "attributes2" : null,
                "attributes3" : null,
                
                // general assignments (for markup-like attributes)
                "assignments" : null,
            
                // general operators
                "operators" : null,
                
                // general delimiters
                "delimiters" : null,
                
                // general atoms
                "atoms" : null,
                
                // general meta
                "meta" : null,
                
                // general defines
                "defines" : null,
                
                // general keywords, reserved words
                "keywords" : null,
                
                // general builtins,  functions, constructs, etc..
                "builtins" : null,
            },
            
            // TODO
            // Syntax model and context-specific rules
            "Syntax" : null,
            
            // TODO
            // how are scoped blocks defined (possible values are : indent startchars, dedent endchars, etc.. )
            "Indentation" : null
        }
    ;
    
    //
    // matcher factories
    var ESC = /([\-\.\*\+\?\^\$\{\}\(\)\|\[\]\/\\])/g,
    
        byLength = function(a, b) { return b.length - a.length },
        
        isRegexp = function(s, id) {
            return (
                (T_STR & get_type(id)) && (T_STR & get_type(s)) && id.length &&
                id.length <= s.length && id == s.substr(0, id.length)
            );
        },
        
        getRegexp = function(r, rid)  {
            if ( !r || (T_NUM == get_type(r)) ) return r;
            
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
                strlen = r.length;
                this.match = function(stream, eat) {
                    
                    // manipulate the codemirror stream directly for speed
                    eat = (false !== eat);
                    var casedr = r; //(ignoreCase) ? r.toLowerCase() : r;
                    var casedch = ch = stream.string.charAt(stream.pos) || '';
                    //var casedch = ch; //(ignoreCase) ? sch.toLowerCase() : ch;
                    if (casedr == casedch) 
                    {
                        if (eat) stream.pos += strlen;
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
            else if (T_EOLMATCHER == this.type)
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
                    if ( T_NUM == get_type( endMatcher ) )
                    {
                        // the regex is wrapped in an additional group, 
                        // add 1 to the requested regex group transparently
                        endMatcher = new SimpleMatcher( T_STRMATCHER, token.val[ endMatcher+1 ] );
                    }
                    
                    return endMatcher;
                }
                
                return false;
            };
        },
        
        TagMatcher = function(start, name, end) {
            
            var token,
                startMatcher = new CompositeMatcher(start, false),
                tagName = "", /*nameMatcher,*/ endMatcher
            ;
            
            this.type = T_TAGMATCHER;
            
            this.match = function(stream, eat) {
                
                token = startMatcher.match(stream, eat);
                
                if (token)
                {
                    nameMatcher = name[ token.key ];
                    // regex given, get the matched group for the ending of this block
                    if ( T_NUM == get_type( nameMatcher ) )
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
                    if ( T_NUM == get_type( endMatcher ) )
                    {
                        // the regex is wrapped in an additional group, 
                        // add 1 to the requested regex group transparently
                        endMatcher = new SimpleMatcher( T_STRMATCHER, token.val[ endMatcher+1 ] );
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
            
            var T = get_type( r );
            
            if ( T_NUM == T )  return r;
            
            else if ( T_BOOL == T ) return new SimpleMatcher(T_DUMMYMATCHER, r, key);
            
            else if ( T_NULL == T )  return new SimpleMatcher(T_EOLMATCHER, r, key);
            
            else if ( T_CHAR == T )  return new SimpleMatcher(T_CHARMATCHER, r, key);
            
            else if ( T_STR == T ) return new SimpleMatcher(T_STRMATCHER, r, key);
            
            else if ( T_REGEX == T )  return new SimpleMatcher(T_REGEXMATCHER, r, key);
            
            // unknown
            return r;
        },
        
        getCompositeMatcher = function(tokens, RegExpID, isRegExpGroup) {
            
            var tmp, i, l, l2, array_of_arrays = false, has_regexs = false;
            
            tmp = make_array( tokens );
            l = tmp.length;
            
            if ( isRegExpGroup )
            {   
                l2 = (l>>1) + 1;
                // check if tokens can be combined in one regular expression
                // if they do not contain sub-arrays or regular expressions
                for (i=0; i<=l2; i++)
                {
                    if ( (T_ARRAY == get_type( tmp[i] )) || (T_ARRAY == get_type( tmp[l-1-i] )) ) 
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
                    if ( T_ARRAY == get_type( tmp[i] ) )
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
            tmp = make_array_2(tokens); // array of arrays
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
            tmp = make_array_2(tokens); // array of arrays
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
      
    //
    //  CodeMirror Grammar main class
    
    var self = {
        
        VERSION : VERSION,
        
        // extend a grammar using another base grammar
        extendGrammar : extend,
        
        // parse the grammar into a form suitable for generating parser
        parseGrammar : function(grammar, base) {
            var RegExpID, RegExpGroups, tokens, numTokens, _tokens, 
                Style, Lex, 
                t, tokID, tok, tokType, tokStyle, tokTypes;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if (grammar.__parsed)  return grammar;
            
            grammar = extend(grammar, base, defaultGrammar);
            
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            
            RegExpGroups = grammar.RegExpGroups || {};
            grammar.RegExpGroups = null;
            delete grammar.RegExpGroups;
            
            grammar.type = (grammar.type && "markup-like"==grammar.type) ? T_MARKUP_LIKE : T_PROGRAMMING_LIKE;
            
            tokens = grammar.TokenOrder || [];
            numTokens = tokens.length;
            _tokens = [];
            
            Style = grammar.Style || {};
            Lex = grammar.Lex || {};
            
            tokTypes = {
                TAG : {
                    // general tags ( 3 types )
                    "tags" : T_TAG,
                    "tags2" : T_TAG,
                    "tags3" : T_TAG
                },
                
                DOCTYPE : {
                    // doctype, not used at present
                    "doctype" : T_DOCTYPE
                },
                
                BLOCK : {
                    // comments (both line-comments and block-comments)
                    "comments" : T_COMMENT,
                    
                    // general blocks ( 5 types ), eg. heredocs, cdata, etc..
                    "blocks" : T_BLOCK,
                    "blocks2" : T_BLOCK,
                    "blocks3" : T_BLOCK,
                    "blocks4" : T_BLOCK,
                    "blocks5" : T_BLOCK
                },
                
                STRING : {
                    // general strings ( 5 types )
                    "strings" : T_STRING,
                    "strings2" : T_STRING,
                    "strings3" : T_STRING,
                    "strings4" : T_STRING,
                    "strings5" : T_STRING
                },
                
                SIMPLE : {
                    // general identifiers ( 5 types ), eg. variables, function names, etc..
                    "identifiers" : T_IDENTIFIER,
                    "identifiers2" : T_IDENTIFIER,
                    "identifiers3" : T_IDENTIFIER,
                    "identifiers4" : T_IDENTIFIER,
                    "identifiers5" : T_IDENTIFIER,
                    
                    // general numbers ( 3 types )
                    "numbers" : T_NUMBER,
                    "numbers2" : T_NUMBER,
                    "numbers3" : T_NUMBER,
                    
                    // general attributes ( 3 types ), eg. for tags
                    "attributes" : T_ATTRIBUTE,
                    "attributes2" : T_ATTRIBUTE,
                    "attributes3" : T_ATTRIBUTE,
                    
                    // other special tokens
                    "keywords" : T_KEYWORD,
                    "builtins" : T_BUILTIN,
                    "atoms" : T_ATOM,
                    "meta" : T_META,
                    "defines" : T_DEF,
                    "operators" : T_OP,
                    "delimiters" : T_DELIM,
                    "assignments" : T_ASSIGNMENT
                }
            };
            
            for (t=0; t<numTokens; t++)
            {
                tokID = tokens[ t ];
                
                if ( !Lex[ tokID ] ) continue;
                
                tok = null;
                
                // block tokens, comments, general blocks etc..
                if ( tokID in tokTypes.BLOCK )
                {
                    tok = getBlockMatcher( Lex[ tokID ], RegExpID ) || null;
                    tokType = tokTypes.BLOCK[ tokID ];
                    tokStyle = Style[ tokID ] || null;
                }
                
                // general strings tokens
                else if ( tokID in tokTypes.STRING )
                {
                    tok = getBlockMatcher( Lex[ tokID ], RegExpID ) || null;
                    tokType = tokTypes.STRING[ tokID ];
                    tokStyle = Style[ tokID ] || null;
                }
                
                // general tags tokens
                else if ( tokID in tokTypes.TAG )
                {
                    tok = getTagMatcher( Lex[ tokID ], RegExpID, RegExpGroups[tokID] ) || null;
                    tokType = tokTypes.TAG[ tokID ];
                    tokStyle = Style[ tokID ] || null;
                }
                
                // general doctype tokens
                else if ( tokID in tokTypes.DOCTYPE )
                {
                    // TODO
                    continue;
                }
                
                // general simple tokens, identifiers, numbers, keywords, etc..
                else if ( tokID in tokTypes.SIMPLE )
                {
                    tok = getCompositeMatcher( Lex[ tokID ], RegExpID, RegExpGroups[ tokID ] ) || null;
                    tokType = tokTypes.SIMPLE[ tokID ];
                    tokStyle = Style[ tokID ] || null;
                }
                
                if (tok)
                {
                    Lex[ tokID ] = tok;
                    _tokens.push( [ tok, tokType, tokStyle ] );
                }
                else
                {
                    Lex[ tokID ] = null;
                }
            }
            
            // types of indent etc..
            /*var hasIndent = false;
            if (grammar.Indentation) 
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
            
            grammar.TokenOrder = _tokens;
            grammar.Style = Style;
            grammar.Lex = Lex;
            grammar.Syntax = null;
            grammar.Indentation = null;
            grammar.hasIndent = false;
            
            // this grammar is parsed
            grammar.__parsed = true;
            
            return grammar;
        },
        
        // get a codemirror syntax-highlight mode from a grammar
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