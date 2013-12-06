/**
*
*   CodeMirrorGrammar
*   @version: 0.3
*   Transform a grammar specification in JSON format,
*   into a CodeMirror syntax-highlight parser mode
*
*   https://github.com/foo123/codemirror-grammar
*
**/
(function(root, undef){
    
    var VERSION = "0.3";
        
    //
    // parser types
    var    
        //
        // javascript variable types
        T_NUM = 2,
        T_BOOL = 4,
        T_STR = 8,
        T_CHAR= 9,
        T_REGEX = 16,
        T_ARRAY = 32,
        T_OBJ = 64,
        T_NULL = 128,
        T_UNDEF = 256,
        T_UNKNOWN = 512,
        
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
        
        //
        // token types
        T_OPTIONAL = 1,
        T_REQUIRED = 2,
        T_ERROR = 4,
        T_DEFAULT = 8,
        T_SIMPLE = 16,
        T_ESCBLOCK = 32,
        T_BLOCK = 64,
        T_EITHER = 128,
        T_ALL = 256,
        T_ZEROORONE = 512,
        T_ZEROORMORE = 1024,
        T_ONEORMORE = 2048,
        T_GROUP = 4096,
        T_NGRAM = 8192,
        
        //
        // tokenizer types
        groupTypes = {
            "ONEOF" : T_EITHER, "EITHER" : T_EITHER, "ALL" : T_ALL, "ALLOF" : T_ALL, "ZEROORONE" : T_ZEROORONE, "ZEROORMORE" : T_ZEROORMORE, "ONEORMORE" : T_ONEORMORE
        },
        
        tokenTypes = {
            "BLOCK" : T_BLOCK, "ESCAPED-BLOCK" : T_ESCBLOCK, "SIMPLE" : T_SIMPLE, "GROUP" : T_GROUP, "NGRAM" : T_NGRAM, "N-GRAM" : T_NGRAM
        }
    ;
    
    var slice = Array.prototype.slice, splice = Array.prototype.splice, concat = Array.prototype.concat, 
        hasKey = Object.prototype.hasOwnProperty, Str = Object.prototype.toString,
        
        RegexAnalyzer,
        
        Merge = function(o1, o2) { 
            o1 = o1 || {}; 
            for (var p in o2) 
                if ( hasKey.call(o2, p) )  o1[p] = o2[p];  
            
            return o1; 
        },
        
        Extends = function(Parent, ChildProto) {
            var O = function(){}; 
            var C = ChildProto.constructor;
            O.prototype = Parent.prototype;
            C.prototype = new O();
            C.prototype.constructor = C;
            C.prototype = Merge( C.prototype, ChildProto );
            return C;
        },
        
        get_type = function(v) {
            var type_of = typeof(v), to_string = Str.call(v);
            
            if ('number' == type_of || v instanceof Number)  return T_NUM;
            
            else if (true === v || false === v)  return T_BOOL;
            
            else if (v && ('string' == type_of || v instanceof String))  return (1 == v.length) ? T_CHAR : T_STR;
            
            else if (v && ("[object RegExp]" == to_string || v instanceof RegExp))  return T_REGEX;
            
            else if (v && ("[object Array]" == to_string || v instanceof Array))  return T_ARRAY;
            
            else if (v && "[object Object]" == to_string)  return T_OBJ;
            
            else if (null === v)  return T_NULL;
            
            else if (undef === v)  return T_UNDEF;
            
            // unkown type
            return T_UNKNOWN;
        },
        
        make_array = function(a, force) {
            return ( force || T_ARRAY != get_type( a ) ) ? [ a ] : a;
        },
        
        make_array_2 = function(a, force) {
            a = make_array( a, force );
            if ( force || T_ARRAY != get_type( a[0] ) ) a = [ a ]; // array of arrays
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
            
            //
            // Style model
            "Style" : {
                
                // lang token type  -> CodeMirror (style) tag
                "error":                "error"
            },

            //
            // Lexical model
            "Lex" : null,
            
            //
            // Syntax model and context-specific rules
            "Syntax" : null,
            
            // what to parse and in what order
            "Parser" : null
        }
    ;
    
    //
    // matcher factories
    var ESC = /([\-\.\*\+\?\^\$\{\}\(\)\|\[\]\/\\])/g,
        
        byLength = function(a, b) { return b.length - a.length },
        
        hasPrefix = function(s, id) {
            return (
                (T_STR & get_type(id)) && (T_STR & get_type(s)) && id.length &&
                id.length <= s.length && id == s.substr(0, id.length)
            );
        },
        
        getRegexp = function(r, rid, parsedRegexes)  {
            if ( !r || (T_NUM == get_type(r)) ) return r;
            
            var l = (rid) ? (rid.length||0) : 0;
            
            if ( l && rid == r.substr(0, l) ) 
            {
                var regexID = "^(" + r.substr(l) + ")", regex, peek, analyzer;
                
                if ( !parsedRegexes[ regexID ] )
                {
                    regex = new RegExp( regexID );
                    analyzer = new RegexAnalyzer( regex ).analyze();
                    peek = analyzer.getPeekChars();
                    //console.log(analyzer.regex);
                    //console.log(peek);
                    if ( !Object.keys(peek.peek).length )  peek.peek = null;
                    if ( !Object.keys(peek.negativepeek).length )  peek.negativepeek = null;
                    
                    // shared, light-weight
                    parsedRegexes[ regexID ] = [ regex, peek ];
                }
                
                return parsedRegexes[ regexID ];
            }
            else
            {
                return r;
            }
        },
        
        getCombinedRegexp = function(tokens)  {
            var peek = { }, i, l;
            for (i=0, l=tokens.length; i<l; i++) 
            {
                peek[ tokens[i].charAt(0) ] = 1;
                tokens[i] = tokens[i].replace(ESC, '\\$1');
            }
            return [ new RegExp("^((" + tokens.sort( byLength ).join( ")|(" ) + "))\\b"), { peek: peek, negativepeek: null } ];
        },
        
        DummyMatcher = Extends( Object, {
            
            constructor : function(name, pattern, key, type) {
                this.name = name;
                this.pattern = pattern;
                this.key = key || 0;
                this.type = type || T_DUMMYMATCHER;
            },
            
            name : null,
            pattern : null,
            peek : null,
            type : null,
            key : 0,
            
            toString : function() {
                var s = '[';
                s += 'Matcher: ' + this.name;
                s += ', Type: ' + this.type;
                s += ', Pattern: ' + ((this.pattern) ? this.pattern.toString() : null);
                s += ']';
                return s;
            },
            
            match : function(stream, eat) { 
                return [ this.key, this.pattern ];
            }
        }),
        
        // get a fast customized matcher for < pattern >
        
        // manipulate the codemirror stream directly for speed,
        // if codemirror code for stream matching changes,
        // only this part of the code needs to be adapted
        
        CharMatcher = Extends( DummyMatcher, {
            
            constructor : function(name, pattern, key) {
                this.name = name;
                this.pattern = pattern;
                this.type = T_CHARMATCHER;
                this.key = key || 0;
            },
            
            match : function(stream, eat) {
                    
                // manipulate the codemirror stream directly for speed
                eat = (false !== eat);
                var ch = stream.string.charAt(stream.pos) || '';
                if (this.pattern == ch) 
                {
                    if (eat) stream.pos += 1;
                    return [ this.key, ch ];
                }
                return false;
            }
        }),
        
        StrMatcher = Extends( DummyMatcher, {
            
            constructor : function(name, pattern, key) {
                this.name = name;
                this.pattern = pattern;
                this.peek = { peek: {}, negativepeek: null };
                this.peek.peek[ '' + pattern.charAt(0) ] = 1;
                this.type = T_STRMATCHER;
                this.key = key || 0;
            },
            
            match : function(stream, eat) {
                
                // manipulate the codemirror stream directly for speed
                eat = (false !== eat);
                var pos = stream.pos, ch = stream.string.charAt(pos);
                if ( this.peek.peek[ ch ] )
                {
                    var len = this.pattern.length, str = stream.string.substr(pos, len);
                    if (this.pattern == str) 
                    {
                        if (eat) stream.pos += len;
                        return [ this.key, str ];
                    }
                }
                return false;
            }
        }),
        
        RegexMatcher = Extends( DummyMatcher, {
            
            constructor : function(name, pattern, key) {
                this.name = name;
                this.pattern = pattern[ 0 ];
                this.peek = pattern[ 1 ];
                this.type = T_REGEXMATCHER;
                this.key = key || 0;
            },
            
            match : function(stream, eat) {
                
                // manipulate the codemirror stream directly for speed
                eat = (false !== eat);
                var pos = stream.pos, ch = stream.string.charAt(pos);
                if ( ( this.peek.peek && this.peek.peek[ ch ] ) || ( this.peek.negativepeek && !this.peek.negativepeek[ ch ] ) )
                {
                    var match = stream.string.slice(pos).match(this.pattern);
                    if (!match || match.index > 0) return false;
                    if (eat) stream.pos += match[0].length;
                    return [ this.key, match ];
                }
                return false;
            }
        }),
        
        EolMatcher = Extends( DummyMatcher, {
            
            constructor : function(name, pattern, key) {
                this.name = name;
                this.type = T_EOLMATCHER;
                this.key = key || 0;
            },
            
            match : function(stream, eat) { 
                // manipulate the codemirror stream directly for speed
                if (false !== eat) stream.pos = stream.string.length; // skipToEnd
                return [ this.key, "" ];
            }
        }),
        
        getSimpleMatcher = function(tokenID, pattern, key, parsedMatchers) {
            // get a fast customized matcher for < pattern >
            
            // manipulate the codemirror stream directly for speed,
            // if codemirror code for stream matching changes,
            // only this part of the code needs to be adapted
            
            key = key || 0;
            
            var name = tokenID + '_SimpleMatcher', matcher;
            
            var T = get_type( pattern );
            
            if ( T_NUM == T ) return pattern;
            
            if ( !parsedMatchers[ name ] )
            {
                if ( T_BOOL == T ) matcher = new DummyMatcher(name, pattern, key);
                
                else if ( T_NULL == T ) matcher = new EolMatcher(name, pattern, key);
                
                else if ( T_CHAR == T ) matcher = new CharMatcher(name, pattern, key);
                
                else if ( T_STR == T ) matcher = new StrMatcher(name, pattern, key);
                
                else if ( /*T_REGEX*/T_ARRAY == T ) matcher = new RegexMatcher(name, pattern, key);
                
                // unknown
                else matcher = pattern;
                
                parsedMatchers[ name ] = matcher;
            }
            
            return parsedMatchers[ name ];
        },
        
        CompositeMatcher = Extends( DummyMatcher, {
            
            constructor : function(name, matchers, useOwnKey) {
                this.name = name;
                this.matchers = matchers;
                this.type = T_COMPOSITEMATCHER;
                this.useOwnKey = (false!==useOwnKey);
            },
            
            matchers : null,
            useOwnKey : true,
            
            match : function(stream, eat) {
                var i, m, matchers = this.matchers, l = matchers.length;
                for (i=0; i<l; i++)
                {
                    // each one is a custom matcher in its own
                    m = matchers[i].match(stream, eat);
                    if ( m ) return ( this.useOwnKey ) ? [ i, m[1] ] : m;
                }
                return false;
            }
        }),
        
        getCompositeMatcher = function(tokenID, tokens, RegExpID, isRegExpGroup, parsedRegexes, parsedMatchers) {
            
            var tmp, i, l, l2, array_of_arrays = false, has_regexs = false;
            
            var name = tokenID + '_CompoMatcher', matcher;
            
            if ( !parsedMatchers[ name ] )
            {
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
                        else if ( hasPrefix( tmp[i], RegExpID ) || hasPrefix( tmp[l-1-i], RegExpID ) )
                        {
                            has_regexs = true;
                            break;
                        }
                    }
                }
                
                if ( isRegExpGroup && !(array_of_arrays || has_regexs) )
                {   
                    matcher = getSimpleMatcher( name, getCombinedRegexp( tmp ), 0, parsedMatchers );
                }
                else
                {
                    for (i=0; i<l; i++)
                    {
                        if ( T_ARRAY == get_type( tmp[i] ) )
                            tmp[i] = getCompositeMatcher( name + '_' + i, tmp[i], RegExpID, isRegExpGroup, parsedRegexes, parsedMatchers );
                        else
                            tmp[i] = getSimpleMatcher( name + '_' + i, getRegexp( tmp[i], RegExpID, parsedRegexes ), i, parsedMatchers );
                    }
                    
                    matcher = (tmp.length > 1) ? new CompositeMatcher( name, tmp ) : tmp[0];
                }
                
                parsedMatchers[ name ] = matcher;
            }
            
            return parsedMatchers[ name ];
        },
        
        BlockMatcher = Extends( DummyMatcher, {
            
            constructor : function(name, start, end) {
                this.name = name;
                this.type = T_BLOCKMATCHER;
                this.start = new CompositeMatcher(this.name + '_StartMatcher', start, false);
                this.pattern = this.start.pattern || null;
                this.end = end;
            },
            
            start : null,
            end : null,
            
            match : function(stream, eat) {
                    
                var token = this.start.match(stream, eat);
                
                if ( token )
                {
                    var endMatcher = this.end[ token[0] ];
                    
                    // regex given, get the matched group for the ending of this block
                    if ( T_NUM == get_type( endMatcher ) )
                    {
                        // the regex is wrapped in an additional group, 
                        // add 1 to the requested regex group transparently
                        endMatcher = new StrMatcher( this.name + '_EndMatcher', token[1][ endMatcher+1 ] );
                    }
                    
                    return endMatcher;
                }
                
                return false;
            }
        }),
        
        getBlockMatcher = function(tokenID, tokens, RegExpID, parsedRegexes, parsedMatchers) {
            var tmp, i, l, start, end, t1, t2;
            
            var name = tokenID + '_BlockMatcher';
            
            if ( !parsedMatchers[ name ] )
            {
                // build start/end mappings
                start=[]; end=[];
                tmp = make_array_2(tokens); // array of arrays
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getSimpleMatcher( name + '_0_' + i, getRegexp( tmp[i][0], RegExpID, parsedRegexes ), i, parsedMatchers );
                    t2 = (tmp[i].length>1) ? getSimpleMatcher( name + '_1_' + i, getRegexp( tmp[i][1], RegExpID, parsedRegexes ), i, parsedMatchers ) : t1;
                    start.push( t1 );  end.push( t2 );
                }
                
                parsedMatchers[ name ] = new BlockMatcher(name, start, end);
            }
            
            return parsedMatchers[ name ];
        }
    ;
    
    //
    // tokenizer factories
    var
        SimpleTokenizer = Extends( Object, {
            
            constructor : function(name, token, type, style) {
                if (name) this.name = name;
                if (token) this.token = token;
                if (type) this.type = type;
                if (style) this.style = style;
            },
            
            name : null,
            token : null,
            type : null,
            style : null,
            isRequired : false,
            ERROR : false,
            streamPos : null,
            stackPos : null,
            
            toString : function() {
                var s = '[';
                s += 'Tokenizer: ' + this.name;
                s += ', Type: ' + this.type;
                s += ', Token: ' + ((this.token) ? this.token.toString() : null);
                s += ']';
                return s;
            },
            
            required : function(bool) { 
                this.isRequired = (bool) ? true : false;
                return this;
            },
            
            backTrack : function(stream) {
                stream.pos -= (stream.pos - this.streamPos);
                return this;
            },
            
            pushToken : function(stack, token, i) {
                if ( this.stackPos )
                    stack.splice( this.stackPos+(i||0), 0, token );
                else
                    stack.push( token );
                return this;
            },
            
            clone : function(/* variable args here.. */) {
                
                var args = slice.call(arguments);
                
                if (args.length)
                {
                    var thisClass = args.shift();
                    
                    var argslen = args.length;
                    
                    var t = new thisClass();
                    
                    t.name = this.name;
                    t.type = this.type;
                    t.isRequired = this.isRequired;
                    t.ERROR = this.ERROR;
                    
                    for (var i=0; i<argslen; i++)   
                    {
                        t[ args[i] ] = this[ args[i] ];
                    }
                    
                    return t;
                }
                
                return null;
            },
            
            tokenize : function( stream, state ) {
                
                if ( this.token.match(stream) )
                {
                    state.currentToken = this.type;
                    return this.style;
                }
                
                return false;
            }
        }),
        
        BlockTokenizer = Extends( SimpleTokenizer, {
            
            constructor : function(name, token, type, style) {
                if (name) this.name = name;
                if (token) this.token = token;
                if (type) this.type = type;
                if (style) this.style = style;
                this.endBlock = null;
            },    
            
            endBlock : null,
            
            tokenize : function( stream, state ) {
            
                var ended = false, found = false;
                
                if ( state.inBlock == this.name )
                {
                    found = true;
                    this.endBlock = state.endBlock;
                }    
                else if ( !state.inBlock && (this.endBlock = this.token.match(stream)) )
                {
                    found = true;
                    state.inBlock = this.name;
                    state.endBlock = this.endBlock;
                }    
                
                if ( found )
                {
                    this.stackPos = state.stack.length;
                    ended = this.endBlock.match(stream);
                    
                    while ( !ended && !stream.eol() ) 
                    {
                        //stream.next();
                        if ( this.endBlock.match(stream) ) 
                        {
                            ended = true;
                            break;
                        }
                        else  
                        {
                            stream.next();
                        }
                    }
                    
                    if ( !ended )
                    {
                        this.pushToken( state.stack, this );
                    }
                    else
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    
                    state.currentToken = this.type;
                    return this.style;
                }
                
                state.inBlock = null;
                state.endBlock = null;
                return false;
            }
        }),
                
        EscBlockTokenizer = Extends( BlockTokenizer, {
            
            constructor : function(name, token, type, style, escape, multiline) {
                if (name) this.name = name;
                if (token) this.token = token;
                if (type) this.type = type;
                if (style) this.style = style;
                if (escape) this.escape = escape || "\\";
                if (multiline) this.multiline = multiline || false;
                this.endBlock = null;
                this.isEscaped = false;
            },    
            
            escape : "\\",
            multiline : false,
            
            tokenize : function( stream, state ) {
            
                var next = "", ended = false, found = false, isEscaped = false;
                
                if ( state.inBlock == this.name )
                {
                    found = true;
                    this.endBlock = state.endBlock;
                }    
                else if ( !state.inBlock && (this.endBlock = this.token.match(stream)) )
                {
                    found = true;
                    state.inBlock = this.name;
                    state.endBlock = this.endBlock;
                }    
                
                if ( found )
                {
                    state.inBlock = this.name;
                    this.stackPos = state.stack.length;
                    ended = this.endBlock.match(stream);
                    
                    while ( !ended && !stream.eol() ) 
                    {
                        //stream.next();
                        if ( !isEscaped && this.endBlock.match(stream) ) 
                        {
                            ended = true; 
                            break;
                        }
                        else  
                        {
                            next = stream.next();
                        }
                        isEscaped = !isEscaped && next == this.escape;
                    }
                    
                    ended = ended || !(isEscaped && this.multiline);
                    
                    if ( !ended )
                    {
                        this.pushToken( state.stack, this );
                    }
                    else
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    
                    state.currentToken = this.type;
                    return this.style;
                }
                
                state.inBlock = null;
                state.endBlock = null;
                return false;
            }
        }),
                
        CompositeTokenizer = Extends( SimpleTokenizer, {
            
            constructor : function(name, type) {
                if (name) this.name = name;
                if (type) this.type = type;
            },
            
            tokens : null,
            
            buildTokens : function( tokens ) {
                if ( tokens )
                {
                    this.tokens = make_array( tokens );
                    this.token = this.tokens[0];
                }
                return this;
            }
        }),
        
        ZeroOrOneTokens = Extends( CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_ZEROORONE;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
            },
            
            tokenize : function( stream, state ) {
                // this is optional
                this.isRequired = false;
                this.ERROR = false;
                this.streamPos = stream.pos;
                var style = this.token.tokenize(stream, state);
                if ( token.ERROR ) this.backTrack( stream );
                return style;
            }
        }),
        
        ZeroOrMoreTokens = Extends( CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_ZEROORMORE;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
            },
            
            tokenize : function( stream, state ) {
            
                var i, token, style, n = this.tokens.length, tokensErr = 0;
                
                // this is optional
                this.isRequired = false;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                for (i=0; i<n; i++)
                {
                    token = this.tokens[i];
                    style = token.tokenize(stream, state);
                    
                    if ( false !== style )
                    {
                        // push it to the stack for more
                        this.pushToken( state.stack, this );
                        return style;
                    }
                    else if ( token.ERROR )
                    {
                        tokensErr++;
                        this.backTrack( stream );
                    }
                }
                
                //this.ERROR = (n == tokensErr) ? true : false;
                return false;
            }
        }),
        
        OneOrMoreTokens = Extends( CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_ONEORMORE;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
                this.foundOne = false;
            },
            
            foundOne : false,
            
            tokenize : function( stream, state ) {
        
                var style, token, i, n = this.tokens.length, tokensRequired = 0, tokensErr = 0;
                
                this.isRequired = !this.foundOne;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                for (i=0; i<n; i++)
                {
                    token = this.tokens[i];
                    style = token.tokenize(stream, state);
                    
                    tokensRequired += (token.isRequired) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        this.foundOne = true;
                        this.isRequired = false;
                        this.ERROR = false;
                        // push it to the stack for more
                        this.pushToken( state.stack, this.clone(OneOrMoreTokens, "tokens", "foundOne") );
                        this.foundOne = false;
                        
                        return style;
                    }
                    else if ( token.ERROR )
                    {
                        tokensErr++;
                        this.backTrack( stream );
                    }
                }
                
                this.ERROR = (!this.foundOne /*|| n == tokensErr*/) ? true : false;
                return false;
            }
        }),
        
        EitherTokens = Extends( CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_EITHER;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
            },
            
            tokenize : function( stream, state ) {
            
                var style, token, i, n = this.tokens.length, tokensRequired = 0, tokensErr = 0;
                
                this.isRequired = true;
                this.ERROR = false;
                this.streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = this.tokens[i];
                    style = token.tokenize(stream, state);
                    
                    tokensRequired += (token.isRequired) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        return style;
                    }
                    else if ( token.ERROR )
                    {
                        tokensErr++;
                        this.backTrack( stream );
                    }
                }
                
                this.isRequired = (tokensRequired > 0) ? true : false;
                this.ERROR = (n == tokensErr && tokensRequired > 0) ? true : false;
                return false;
            }
        }),
                
        AllTokens = Extends( CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_ALL;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
                this.inSequence = 0;
            },
            
            inSequence : 0,
            
            tokenize : function( stream, state ) {
                
                var token, style, n = this.tokens.length, ret = false;
                
                this.isRequired = true;
                this.ERROR = false;
                this.inSequence = 0;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                
                token = this.tokens[ 0 ];
                style = token.required(true).tokenize(stream, state);
                
                if ( false !== style )
                {
                    this.stackPos = state.stack.length;
                    for (var i=n-1; i>0; i--)
                    {
                        this.pushToken( state.stack, this.tokens[i].required(true), n-i );
                    }
                    ret = style;
                }
                else if ( token.ERROR )
                {
                    this.ERROR = true;
                    this.backTrack( stream );
                }
                else if ( token.isRequired )
                {
                    this.ERROR = true;
                }
                
                return ret;
            }
        }),
                
        NGramTokenizer = Extends( CompositeTokenizer, {
                
            constructor : function( name, tokens ) {
                this.type = T_NGRAM;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
                this.inSequence = 0;
            },
            
            inSequence : 0,
            
            tokenize : function( stream, state ) {
                
                var token, style, n = this.tokens.length, ret = false;
                
                this.isRequired = false;
                this.ERROR = false;
                this.inSequence = 0;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                
                token = this.tokens[ 0 ];
                style = token.required(false).tokenize(stream, state);
                
                if ( false !== style )
                {
                    this.stackPos = state.stack.length;
                    for (var i=n-1; i>0; i--)
                    {
                        this.pushToken( state.stack, this.tokens[i].required(true), n-i );
                    }
                    ret = style;
                }
                else if ( token.ERROR )
                {
                    //this.ERROR = true;
                    this.backTrack( stream );
                }
                
                return ret;
            }
        }),
                
        getTokenizer = function(tokenID, RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens) {
            
            var tok, token = null, type, matchType, tokens;
            
            if ( !parsedTokens[ tokenID ] )
            {
                tok = Lex[ tokenID ] || Syntax[ tokenID ] || null;
                
                if ( tok )
                {
                    type = tok.type;
                    type = tokenTypes[ type.toUpperCase() ];
                    
                    if ( T_BLOCK == type )
                    {
                        token = new BlockTokenizer( 
                                    tokenID,
                                    getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, parsedRegexes, parsedMatchers ), 
                                    type, 
                                    Style[ tokenID ] || null
                                );
                    }
                    
                    else if ( T_ESCBLOCK == type )
                    {
                        token = new EscBlockTokenizer( 
                                    tokenID,
                                    getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, parsedRegexes, parsedMatchers ), 
                                    type, 
                                    Style[ tokenID ] || null,
                                    tok.escape || "\\",
                                    tok.multiline || false
                                );
                    }
                    
                    else if ( T_SIMPLE == type )
                    {
                        token = new SimpleTokenizer( 
                                    tokenID,
                                    getCompositeMatcher( tokenID, tok.tokens.slice(), RegExpID, RegExpGroups[ tokenID ], parsedRegexes, parsedMatchers ), 
                                    type, 
                                    Style[ tokenID ] || null
                                );
                    }
                    
                    else if ( T_GROUP == type )
                    {
                        matchType = groupTypes[ tok.match.toUpperCase() ]; 
                        tokens = make_array( tok.tokens ).slice();
                        
                        for (var i=0, l=tokens.length; i<l; i++)
                            tokens[i] = getTokenizer(tokens[i], RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens);
                        
                        if (T_ZEROORONE == matchType) 
                            token = new ZeroOrOneTokens(tokenID, tokens);
                        
                        else if (T_ZEROORMORE == matchType) 
                            token = new ZeroOrMoreTokens(tokenID, tokens);
                        
                        else if (T_ONEORMORE == matchType) 
                            token = new OneOrMoreTokens(tokenID, tokens);
                        
                        else if (T_EITHER == matchType) 
                            token = new EitherTokens(tokenID, tokens);
                        
                        else //if (T_ALL == matchType)
                            token = new AllTokens(tokenID, tokens);
                    }
                    
                    else if ( T_NGRAM == type )
                    {
                        // get n-gram tokenizer
                        token = make_array_2( make_array( tok.tokens ).slice() ).slice(); // array of arrays
                        
                        for (var i=0, l=token.length; i<l; i++)
                        {
                            // get tokenizers for each ngram part
                            var ngram = token[i];
                            
                            for (var j=0, l2=ngram.length; j<l2; j++)
                                ngram[j] = getTokenizer( ngram[j], RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens );
                            
                            // get a tokenizer for whole ngram
                            token[i] = new NGramTokenizer( tokenID + '_NGRAM_' + i, ngram );
                        }
                    }
                }
                
                parsedTokens[ tokenID ] = token;
            }
            
            return parsedTokens[ tokenID ];
        }
    ;
      
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
                
                if ( stream.eatSpace() ) 
                {
                    state.currentToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                //stackTrace( stack );
                
                while ( stack.length )
                {
                    token = stack.pop();
                    style = token.tokenize(stream, state);
                    
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
                            state.currentToken = T_ERROR;
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
                        return style;
                    }
                }
                
                for (i=0; i<numTokens; i++)
                {
                    token = tokens[i];
                    style = token.tokenize(stream, state);
                    
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
                            state.currentToken = T_ERROR;
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
                        return style;
                    }
                }
                
                // unknown, bypass
                stream.next();
                state.currentToken = T_DEFAULT;
                return DEFAULT;
            };
            
            return parser;
        },
        
        indentationFactory = function(LOCALS) {
            
            return function(state, textAfter) {
                
                // TODO
                return CodeMirror.Pass;
            };
        }
    ;
      
    var 
        parse = function(grammar) {
            var RegExpID, RegExpGroups, tokens, numTokens, _tokens, 
                Style, Lex, Syntax, t, tokenID, token, tok,
                parsedRegexes = {}, parsedMatchers = {}, parsedTokens = {};
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if ( grammar.__parsed )  return grammar;
            
            grammar = extend(grammar, defaultGrammar);
            
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            
            RegExpGroups = grammar.RegExpGroups || {};
            grammar.RegExpGroups = null;
            delete grammar.RegExpGroups;
            
            Lex = grammar.Lex || {};
            grammar.Lex = null;
            delete grammar.Lex;
            
            Syntax = grammar.Syntax || {};
            grammar.Syntax = null;
            delete grammar.Syntax;
            
            Style = grammar.Style || {};
            
            _tokens = grammar.Parser || [];
            numTokens = _tokens.length;
            tokens = [];
            
            
            // build tokens
            for (t=0; t<numTokens; t++)
            {
                tokenID = _tokens[ t ];
                
                token = getTokenizer( tokenID, RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens ) || null;
                
                if ( token )
                {
                    if ( T_ARRAY == get_type( token ) )
                        tokens = tokens.concat( token );
                    
                    else
                        tokens.push( token );
                }
            }
            
            grammar.Parser = tokens;
            grammar.Style = Style;
            
            // this grammar is parsed
            grammar.__parsed = true;
            
            return grammar;
        }
    ;
    
    //
    //  CodeMirror Grammar main class
    
    var self = {
        
        VERSION : VERSION,
        
        init : function(RegExAnalyzer) {
            RegexAnalyzer = RegExAnalyzer;
        },
        
        // extend a grammar using another base grammar
        extend : extend,
        
        // parse a grammar
        parse : parse,
        
        // get a codemirror syntax-highlight mode from a grammar
        getMode : function(grammar, DEFAULT) {
            
            // build the grammar
            grammar = parse( grammar );
            
            //console.log(grammar);
            
            var 
                LOCALS = { 
                    // default return code, when no match or empty found
                    // 'null' should be used in most cases
                    DEFAULT: DEFAULT || null
                },
                parser, indentation
            ;
            
            parser = parserFactory( grammar, LOCALS );
            indentation = indentationFactory( LOCALS );
            
            // generate parser with token factories (grammar, LOCALS are available locally by closures)
            return function(conf, parserConf) {
                
                LOCALS.conf = conf;
                LOCALS.parserConf = parserConf;
                
                // return the (codemirror) parser mode for the grammar
                return  {
                    startState: function( basecolumn ) {
                        
                        LOCALS.basecolumn = basecolumn || 0;
                        
                        return {
                            stack : null,
                            currentToken : T_DEFAULT
                        };
                    },
                    
                    token: parser,
                    
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