/**
*
*   CodeMirrorGrammar
*   @version: 0.7.1
*
*   Transform a grammar specification in JSON format, into a syntax-highlight parser mode for CodeMirror
*   https://github.com/foo123/codemirror-grammar
*
**/!function ( root, name, deps, factory, undef ) {

    var isNode = (typeof global !== "undefined" && {}.toString.call(global) == '[object global]') ? 1 : 0,
        isBrowser = (!isNode && typeof navigator !== "undefined") ? 1 : 0, 
        isWorker = (typeof importScripts === "function" && navigator instanceof WorkerNavigator) ? 1 : 0,
        A = Array, AP = A.prototype
    ;
    // Get current filename/path
    var getCurrentPath = function() {
            var file = null;
            if ( isNode ) 
            {
                // http://nodejs.org/docs/latest/api/globals.html#globals_filename
                // this should hold the current file in node
                file = __filename;
                return { path: __dirname, file: __filename };
            }
            else if ( isWorker )
            {
                // https://developer.mozilla.org/en-US/docs/Web/API/WorkerLocation
                // this should hold the current url in a web worker
                file = self.location.href;
            }
            else if ( isBrowser )
            {
                // get last script (should be the current one) in browser
                var scripts;
                if ((scripts = document.getElementsByTagName('script')) && scripts.length) 
                    file  = scripts[scripts.length - 1].src;
            }
            
            if ( file )
                return { path: file.split('/').slice(0, -1).join('/'), file: file };
            return { path: null, file: null };
        },
        thisPath = getCurrentPath(),
        makePath = function(base, dep) {
            if ( isNode )
            {
                //return require('path').join(base, dep);
                return dep;
            }
            if ( "." == dep.charAt(0) ) 
            {
                base = base.split('/');
                dep = dep.split('/'); 
                var index = 0, index2 = 0, i, l = dep.length, l2 = base.length;
                
                for (i=0; i<l; i++)
                {
                    if ( /^\.\./.test( dep[i] ) )
                    {
                        index++;
                        index2++;
                    }
                    else if ( /^\./.test( dep[i] ) )
                    {
                        index2++;
                    }
                    else
                    {
                        break;
                    }
                }
                index = ( index >= l2 ) ? 0 : l2-index;
                dep = base.slice(0, index).concat( dep.slice( index2 ) ).join('/');
            }
            return dep;
        }
    ;
    
    //
    // export the module in a umd-style generic way
    deps = ( deps ) ? [].concat(deps) : [];
    var i, dl = deps.length, ids = new A( dl ), paths = new A( dl ), fpaths = new A( dl ), mods = new A( dl ), _module_, head;
        
    for (i=0; i<dl; i++) { ids[i] = deps[i][0]; paths[i] = deps[i][1]; fpaths[i] = /\.js$/i.test(paths[i]) ? makePath(thisPath.path, paths[i]) : makePath(thisPath.path, paths[i]+'.js'); }
    
    // node, commonjs, etc..
    if ( 'object' == typeof( module ) && module.exports ) 
    {
        if ( undef === module.exports[name] )
        {
            for (i=0; i<dl; i++)  mods[i] = module.exports[ ids[i] ] || require( fpaths[i] )[ ids[i] ];
            _module_ = factory.apply(root, mods );
            // allow factory just to add to existing modules without returning a new module
            module.exports[ name ] = _module_ || 1;
        }
    }
    
    // amd, etc..
    else if ( 'function' == typeof( define ) && define.amd ) 
    {
        define( ['exports'].concat( paths ), function( exports ) {
            if ( undef === exports[name] )
            {
                var args = AP.slice.call( arguments, 1 ), dl = args.length;
                for (var i=0; i<dl; i++)   mods[i] = exports[ ids[i] ] || args[ i ];
                _module_ = factory.apply(root, mods );
                // allow factory just to add to existing modules without returning a new module
                exports[ name ] = _module_ || 1;
            }
        });
    }
    
    // web worker
    else if ( isWorker ) 
    {
        for (i=0; i<dl; i++)  
        {
            if ( !self[ ids[i] ] ) importScripts( fpaths[i] );
            mods[i] = self[ ids[i] ];
        }
        _module_ = factory.apply(root, mods );
        // allow factory just to add to existing modules without returning a new module
        self[ name ] = _module_ || 1;
    }
    
    // browsers, other loaders, etc..
    else
    {
        if ( undef === root[name] )
        {
            /*
            for (i=0; i<dl; i++)  mods[i] = root[ ids[i] ];
            _module_ = factory.apply(root, mods );
            // allow factory just to add to existing modules without returning a new module
            root[name] = _module_ || 1;
            */
            
            // load javascript async using <script> tags in browser
            var loadJs = function(url, callback) {
                head = head || document.getElementsByTagName("head")[0];
                var done = 0, script = document.createElement('script');
                
                script.type = 'text/javascript';
                script.language = 'javascript';
                script.src = url;
                script.onload = script.onreadystatechange = function() {
                    if (!done && (!script.readyState || script.readyState == 'loaded' || script.readyState == 'complete'))
                    {
                        done = 1;
                        script.onload = script.onreadystatechange = null;
                        head.removeChild( script );
                        script = null;
                        if ( callback )  callback();
                    }
                }
                // load it
                head.appendChild( script );
            };

            var loadNext = function(id, url, callback) { 
                    if ( !root[ id ] ) 
                        loadJs( url, callback ); 
                    else
                        callback();
                },
                continueLoad = function( i ) {
                    return function() {
                        if ( i < dl )  mods[ i ] = root[ ids[ i ] ];
                        if ( ++i < dl )
                        {
                            loadNext( ids[ i ], fpaths[ i ], continueLoad( i ) );
                        }
                        else
                        {
                            _module_ = factory.apply(root, mods );
                            // allow factory just to add to existing modules without returning a new module
                            root[ name ] = _module_ || 1;
                        }
                    };
                }
            ;
            if ( dl ) 
            {
                loadNext( ids[ 0 ], fpaths[ 0 ], continueLoad( 0 ) );
            }
            else
            {
                _module_ = factory.apply(root, mods );
                // allow factory just to add to existing modules without returning a new module
                root[ name ] = _module_ || 1;
            }
        }
    }


}(  /* current root */          this, 
    /* module name */           "CodeMirrorGrammar",
    /* module dependencies */   [ ['Classy', './classy'],  ['RegExAnalyzer', './regexanalyzer'] ], 
    /* module factory */        function( Classy, RegexAnalyzer, undef ) {
        
        /* main code starts here */

        
    //
    // parser types
    var    
        DEFAULTSTYLE,
        DEFAULTERROR,
        
        //
        // javascript variable types
        INF = Infinity,
        T_NUM = 2,
        T_BOOL = 4,
        T_STR = 8,
        T_CHAR = 9,
        T_CHARLIST = 10,
        T_REGEX = 16,
        T_ARRAY = 32,
        T_OBJ = 64,
        T_NULL = 128,
        T_UNDEF = 256,
        T_UNKNOWN = 512,
        
        //
        // matcher types
        T_SIMPLEMATCHER = 2,
        T_COMPOSITEMATCHER = 4,
        T_BLOCKMATCHER = 8,
        
        //
        // token types
        T_ERROR = 4,
        T_DEFAULT = 8,
        T_SIMPLE = 16,
        T_EOL = 17,
        T_NONSPACE = 18,
        T_BLOCK = 32,
        T_ESCBLOCK = 33,
        T_COMMENT = 34,
        T_EITHER = 64,
        //T_NONE = 2048,
        T_ALL = 128,
        T_REPEATED = 256,
        T_ZEROORONE = 257,
        T_ZEROORMORE = 258,
        T_ONEORMORE = 259,
        T_GROUP = 512,
        T_NGRAM = 1024,
        
        //
        // tokenizer types
        groupTypes = {
            ONEOF: T_EITHER, EITHER: T_EITHER, ALL: T_ALL, ZEROORONE: T_ZEROORONE, ZEROORMORE: T_ZEROORMORE, ONEORMORE: T_ONEORMORE, REPEATED: T_REPEATED
        },
        
        tokenTypes = {
            BLOCK: T_BLOCK, COMMENT: T_COMMENT, ESCAPEDBLOCK: T_ESCBLOCK, SIMPLE: T_SIMPLE, GROUP: T_GROUP, NGRAM: T_NGRAM
        }
    ;
    
    var Class = Classy.Class;
    
    var AP = Array.prototype, OP = Object.prototype,
        slice = AP.slice, splice = AP.splice, concat = AP.concat, 
        hasKey = OP.hasOwnProperty, toStr = OP.toString, isEnum = OP.propertyIsEnumerable,
        
        Keys = Object.keys,
        
        get_type = function(v) {
            var type_of = typeof(v), to_string = toStr.call(v);
            
            if ('undefined' == type_of)  return T_UNDEF;
            
            else if ('number' == type_of || v instanceof Number)  return T_NUM;
            
            else if (null === v)  return T_NULL;
            
            else if (true === v || false === v)  return T_BOOL;
            
            else if (v && ('string' == type_of || v instanceof String))  return (1 == v.length) ? T_CHAR : T_STR;
            
            else if (v && ("[object RegExp]" == to_string || v instanceof RegExp))  return T_REGEX;
            
            else if (v && ("[object Array]" == to_string || v instanceof Array))  return T_ARRAY;
            
            else if (v && "[object Object]" == to_string)  return T_OBJ;
            
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
            
            if ( !((T_OBJ | T_ARRAY) & T) ) return o;
            
            var co = {}, k;
            for (k in o) 
            {
                if ( hasKey.call(o, k) && isEnum.call(o, k) ) 
                { 
                    T2 = get_type( o[k] );
                    
                    if (T_OBJ & T2)  co[k] = clone(o[k]);
                    
                    else if (T_ARRAY & T2)  co[k] = o[k].slice();
                    
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
                    if ( hasKey.call(o2, k) && isEnum.call(o2, k) )
                    {
                        if ( hasKey.call(o1, k) && isEnum.call(o1, k) ) 
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
        },
        
        escRegexp = function(str) {
            return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
        },
        
        groupReplace = function(pattern, token) {
            var parts, i, l, replacer;
            replacer = function(m, d){
                // the regex is wrapped in an additional group, 
                // add 1 to the requested regex group transparently
                return token[ 1 + parseInt(d, 10) ];
            };
            parts = pattern.split('$$');
            l = parts.length;
            for (i=0; i<l; i++) parts[i] = parts[i].replace(/\$(\d{1,2})/g, replacer);
            return parts.join('$');
        },
        
        byLength = function(a, b) { return b.length - a.length },
        
        hasPrefix = function(s, id) {
            return (
                (T_STR & get_type(id)) && (T_STR & get_type(s)) && id.length &&
                id.length <= s.length && id == s.substr(0, id.length)
            );
        },
        
        getRegexp = function(r, rid, cachedRegexes)  {
            if ( !r || (T_NUM == get_type(r)) ) return r;
            
            var l = (rid) ? (rid.length||0) : 0;
            
            if ( l && rid == r.substr(0, l) ) 
            {
                var regexID = "^(" + r.substr(l) + ")", regex, chars, analyzer;
                
                if ( !cachedRegexes[ regexID ] )
                {
                    regex = new RegExp( regexID );
                    analyzer = new RegexAnalyzer( regex ).analyze();
                    chars = analyzer.getPeekChars();
                    if ( !Keys(chars.peek).length )  chars.peek = null;
                    if ( !Keys(chars.negativepeek).length )  chars.negativepeek = null;
                    
                    // shared, light-weight
                    cachedRegexes[ regexID ] = [ regex, chars ];
                }
                
                return cachedRegexes[ regexID ];
            }
            else
            {
                return r;
            }
        },
        
        getCombinedRegexp = function(tokens, boundary)  {
            var peek = { }, i, l, b = "", bT = get_type(boundary);
            if ( T_STR == bT || T_CHAR == bT ) b = boundary;
            var combined = tokens
                        .sort( byLength )
                        .map( function(t) {
                            peek[ t.charAt(0) ] = 1;
                            return escRegexp( t );
                        })
                        .join( "|" )
                    ;
            return [ new RegExp("^(" + combined + ")"+b), { peek: peek, negativepeek: null }, 1 ];
        },
        
        isNode = (typeof global !== "undefined" && {}.toString.call(global) == '[object global]') ? 1 : 0,
        isBrowser = (!isNode && typeof navigator !== "undefined") ? 1 : 0, 
        isWorker = (typeof importScripts === "function" && navigator instanceof WorkerNavigator) ? 1 : 0,
        
        // Get current filename/path
        getCurrentPath = function() {
            var file = null;
            if ( isNode ) 
            {
                // http://nodejs.org/docs/latest/api/globals.html#globals_filename
                // this should hold the current file in node
                file = __filename;
                return { path: __dirname, file: __filename };
            }
            else if ( isWorker )
            {
                // https://developer.mozilla.org/en-US/docs/Web/API/WorkerLocation
                // this should hold the current url in a web worker
                file = self.location.href;
            }
            else if ( isBrowser )
            {
                // get last script (should be the current one) in browser
                var scripts;
                if ((scripts = document.getElementsByTagName('script')) && scripts.length) 
                    file = scripts[scripts.length - 1].src;
            }
            
            if ( file )
                return { path: file.split('/').slice(0, -1).join('/'), file: file };
            return { path: null, file: null };
        },
        thisPath = getCurrentPath()
    ;
    
    //
    // Stream Class
    var
        // a wrapper-class to manipulate a string as a stream, based on Codemirror's StringStream
        ParserStream = Class({
            
            constructor: function( line ) {
                this.string = (line) ? ''+line : '';
                this.start = this.pos = 0;
                this._ = null;
            },
            
            // abbreviations used for optimal minification
            
            _: null,
            string: '',
            start: 0,
            pos: 0,
            
            fromStream: function( _ ) {
                this._ = _;
                this.string = ''+_.string;
                this.start = _.start;
                this.pos = _.pos;
                return this;
            },
            
            toString: function() { return this.string; },
            
            // string start-of-line?
            sol: function( ) { return 0 == this.pos; },
            
            // string end-of-line?
            eol: function( ) { return this.pos >= this.string.length; },
            
            // char match
            chr : function(pattern, eat) {
                var ch = this.string.charAt(this.pos) || null;
                if (ch && pattern == ch) 
                {
                    if (false !== eat) 
                    {
                        this.pos += 1;
                        if ( this._ ) this._.pos = this.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // char list match
            chl : function(pattern, eat) {
                var ch = this.string.charAt(this.pos) || null;
                if ( ch && (-1 < pattern.indexOf( ch )) ) 
                {
                    if (false !== eat) 
                    {
                        this.pos += 1;
                        if ( this._ ) this._.pos = this.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // string match
            str : function(pattern, startsWith, eat) {
                var pos = this.pos, str = this.string, ch = str.charAt(pos) || null;
                if ( ch && startsWith[ ch ] )
                {
                    var len = pattern.length, s = str.substr(pos, len);
                    if (pattern == s) 
                    {
                        if (false !== eat) 
                        {
                            this.pos += len;
                            if ( this._ )  this._.pos = this.pos;
                        }
                        return s;
                    }
                }
                return false;
            },
            
            // regex match
            rex : function(pattern, startsWith, notStartsWith, group, eat) {
                var pos = this.pos, str = this.string, ch = str.charAt(pos) || null;
                if ( ch && ( startsWith && startsWith[ ch ] ) || ( notStartsWith && !notStartsWith[ ch ] ) )
                {
                    var match = str.slice(pos).match(pattern);
                    if (!match || match.index > 0) return false;
                    if (false !== eat) 
                    {
                        this.pos += match[group||0].length;
                        if ( this._ ) this._.pos = this.pos;
                    }
                    return match;
                }
                return false;
            },

            // skip to end
            end: function() {
                this.pos = this.string.length;
                if ( this._ ) this._.pos = this.pos;
                return this;
            },

            // get next char
            nxt: function( ) {
                if (this.pos < this.string.length)
                {
                    var ch = this.string.charAt(this.pos++) || null;
                    if ( this._ ) this._.pos = this.pos;
                    return ch;
                }
            },
            
            // back-up n steps
            bck: function( n ) {
                this.pos -= n;
                if ( 0 > this.pos ) this.pos = 0;
                if ( this._ )  this._.pos = this.pos;
                return this;
            },
            
            // back-track to pos
            bck2: function( pos ) {
                this.pos = pos;
                if ( 0 > this.pos ) this.pos = 0;
                if ( this._ ) this._.pos = this.pos;
                return this;
            },
            
            // eat space
            spc: function( ) {
                var start = this.pos, pos = this.pos, s = this.string;
                while (/[\s\u00a0]/.test(s.charAt(pos))) ++pos;
                this.pos = pos;
                if ( this._ ) this._.pos = this.pos;
                return this.pos > start;
            },
            
            // current stream selection
            cur: function( ) {
                return this.string.slice(this.start, this.pos);
            },
            
            // move/shift stream
            sft: function( ) {
                this.start = this.pos;
                return this;
            }
        })
    ;
        
    //
    // ParserState Class
    var
        ParserState = Class({
            
            constructor: function( line ) {
                //this.id = 0; //new Date().getTime();
                this.l = line || 0;
                this.stack = [];
                this.t = T_DEFAULT;
                this.r = '0';
                this.inBlock = null;
                this.endBlock = null;
            },
            
            // state id
            //id: 0,
            // state current line
            l: 0,
            // state token stack
            stack: null,
            // state current token id
            t: null,
            // state current token type
            r: null,
            // state current block name
            inBlock: null,
            // state endBlock for current block
            endBlock: null,
            
            clone: function() {
                var copy = new this.$class( this.l );
                copy.t = this.t;
                copy.r = this.r;
                copy.stack = this.stack.slice();
                copy.inBlock = this.inBlock;
                copy.endBlock = this.endBlock;
                return copy;
            },
            
            // used mostly for ACE which treats states as strings, 
            // make sure to generate a string which will cover most cases where state needs to be updated by the editor
            toString: function() {
                //return ['', this.id, this.inBlock||'0'].join('_');
                //return ['', this.id, this.t, this.r||'0', this.stack.length, this.inBlock||'0'].join('_');
                //return ['', this.id, this.t, this.stack.length, this.inBlock||'0'].join('_');
                //return ['', this.id, this.t, this.r||'0', this.inBlock||'0'].join('_');
                return ['', this.l, this.t, this.r, this.inBlock||'0', this.stack.length].join('_');
            }
        })
    ;
        
    //
    // matcher factories
    var 
        SimpleMatcher = Class({
            
            constructor : function(type, name, pattern, key) {
                var ayto = this;
                ayto.type = T_SIMPLEMATCHER;
                ayto.tt = type || T_CHAR;
                ayto.tn = name;
                ayto.tk = key || 0;
                ayto.tg = 0;
                ayto.tp = null;
                ayto.p = null;
                ayto.np = null;
                
                // get a fast customized matcher for < pattern >
                switch ( ayto.tt )
                {
                    case T_CHAR: case T_CHARLIST:
                        ayto.tp = pattern;
                        break;
                    case T_STR:
                        ayto.tp = pattern;
                        ayto.p = {};
                        ayto.p[ '' + pattern.charAt(0) ] = 1;
                        break;
                    case T_REGEX:
                        ayto.tp = pattern[ 0 ];
                        ayto.p = pattern[ 1 ].peek || null;
                        ayto.np = pattern[ 1 ].negativepeek || null;
                        ayto.tg = pattern[ 2 ] || 0;
                        break;
                    case T_NULL:
                        ayto.tp = null;
                        break;
                }
            },
            
            // matcher type
            type: null,
            // token type
            tt: null,
            // token name
            tn: null,
            // token pattern
            tp: null,
            // token pattern group
            tg: 0,
            // token key
            tk: 0,
            // pattern peek chars
            p: null,
            // pattern negative peek chars
            np: null,
            
            get : function(stream, eat) {
                var matchedResult, ayto = this,
                    tokenType = ayto.tt, tokenKey = ayto.tk, 
                    tokenPattern = ayto.tp, tokenPatternGroup = ayto.tg,
                    startsWith = ayto.p, notStartsWith = ayto.np
                ;    
                // get a fast customized matcher for < pattern >
                switch ( tokenType )
                {
                    case T_CHAR:
                        if ( matchedResult = stream.chr(tokenPattern, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_CHARLIST:
                        if ( matchedResult = stream.chl(tokenPattern, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_STR:
                        if ( matchedResult = stream.str(tokenPattern, startsWith, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_REGEX:
                        if ( matchedResult = stream.rex(tokenPattern, startsWith, notStartsWith, tokenPatternGroup, eat) ) return [ tokenKey, matchedResult ];
                        break;
                    case T_NULL:
                        // matches end-of-line
                        (false !== eat) && stream.end(); // skipToEnd
                        return [ tokenKey, "" ];
                        break;
                }
                return false;
            },
            
            toString : function() {
                return ['[', 'Matcher: ', this.tn, ', Pattern: ', ((this.tp) ? this.tp.toString() : null), ']'].join('');
            }
        }),
        
        CompositeMatcher = Class(SimpleMatcher, {
            
            constructor : function(name, matchers, useOwnKey) {
                var ayto = this;
                ayto.type = T_COMPOSITEMATCHER;
                ayto.tn = name;
                ayto.ms = matchers;
                ayto.ownKey = (false!==useOwnKey);
            },
            
            // group of matchers
            ms : null,
            ownKey : true,
            
            get : function(stream, eat) {
                var i, m, matchers = this.ms, l = matchers.length, useOwnKey = this.ownKey;
                for (i=0; i<l; i++)
                {
                    // each one is a matcher in its own
                    m = matchers[i].get(stream, eat);
                    if ( m ) return ( useOwnKey ) ? [ i, m[1] ] : m;
                }
                return false;
            }
        }),
        
        BlockMatcher = Class(SimpleMatcher, {
            
            constructor : function(name, start, end) {
                var ayto = this;
                ayto.type = T_BLOCKMATCHER;
                ayto.tn = name;
                ayto.s = new CompositeMatcher(ayto.tn + '_Start', start, false);
                ayto.e = end;
            },
            
            // start block matcher
            s : null,
            // end block matcher
            e : null,
            
            get : function(stream, eat) {
                    
                var ayto = this, startMatcher = ayto.s, endMatchers = ayto.e, token;
                
                // matches start of block using startMatcher
                // and returns the associated endBlock matcher
                if ( token = startMatcher.get(stream, eat) )
                {
                    // use the token key to get the associated endMatcher
                    var endMatcher = endMatchers[ token[0] ], T = get_type( endMatcher ), T0 = startMatcher.ms[ token[0] ].tt;
                    
                    if ( T_REGEX == T0 )
                    {
                        // regex group number given, get the matched group pattern for the ending of this block
                        if ( T_NUM == T )
                        {
                            // the regex is wrapped in an additional group, 
                            // add 1 to the requested regex group transparently
                            endMatcher = new SimpleMatcher( T_STR, ayto.tn + '_End', token[1][ endMatcher+1 ] );
                        }
                        // string replacement pattern given, get the proper pattern for the ending of this block
                        else if ( T_STR == T )
                        {
                            // the regex is wrapped in an additional group, 
                            // add 1 to the requested regex group transparently
                            endMatcher = new SimpleMatcher( T_STR, ayto.tn + '_End', groupReplace(endMatcher, token[1]) );
                        }
                    }
                    return endMatcher;
                }
                
                return false;
            }
        }),
        
        getSimpleMatcher = function(name, pattern, key, cachedMatchers) {
            var T = get_type( pattern );
            
            if ( T_NUM == T ) return pattern;
            
            if ( !cachedMatchers[ name ] )
            {
                key = key || 0;
                var matcher;
                var is_char_list = 0;
                
                if ( pattern && pattern.isCharList )
                {
                    is_char_list = 1;
                    delete pattern.isCharList;
                }
                
                // get a fast customized matcher for < pattern >
                if ( T_NULL & T ) matcher = new SimpleMatcher(T_NULL, name, pattern, key);
                
                else if ( T_CHAR == T ) matcher = new SimpleMatcher(T_CHAR, name, pattern, key);
                
                else if ( T_STR & T ) matcher = (is_char_list) ? new SimpleMatcher(T_CHARLIST, name, pattern, key) : new SimpleMatcher(T_STR, name, pattern, key);
                
                else if ( /*T_REGEX*/T_ARRAY & T ) matcher = new SimpleMatcher(T_REGEX, name, pattern, key);
                
                // unknown
                else matcher = pattern;
                
                cachedMatchers[ name ] = matcher;
            }
            
            return cachedMatchers[ name ];
        },
        
        getCompositeMatcher = function(name, tokens, RegExpID, combined, cachedRegexes, cachedMatchers) {
            
            if ( !cachedMatchers[ name ] )
            {
                var tmp, i, l, l2, array_of_arrays = 0, has_regexs = 0, is_char_list = 1, T1, T2;
                var matcher;
                
                tmp = make_array( tokens );
                l = tmp.length;
                
                if ( 1 == l )
                {
                    matcher = getSimpleMatcher( name, getRegexp( tmp[0], RegExpID, cachedRegexes ), 0, cachedMatchers );
                }
                else if ( 1 < l /*combined*/ )
                {   
                    l2 = (l>>1) + 1;
                    // check if tokens can be combined in one regular expression
                    // if they do not contain sub-arrays or regular expressions
                    for (i=0; i<=l2; i++)
                    {
                        T1 = get_type( tmp[i] );
                        T2 = get_type( tmp[l-1-i] );
                        
                        if ( (T_CHAR != T1) || (T_CHAR != T2) ) 
                        {
                            is_char_list = 0;
                        }
                        
                        if ( (T_ARRAY & T1) || (T_ARRAY & T2) ) 
                        {
                            array_of_arrays = 1;
                            //break;
                        }
                        else if ( hasPrefix( tmp[i], RegExpID ) || hasPrefix( tmp[l-1-i], RegExpID ) )
                        {
                            has_regexs = 1;
                            //break;
                        }
                    }
                    
                    if ( is_char_list && ( !combined || !( T_STR & get_type(combined) ) ) )
                    {
                        tmp = tmp.slice().join('');
                        tmp.isCharList = 1;
                        matcher = getSimpleMatcher( name, tmp, 0, cachedMatchers );
                    }
                    else if ( combined && !(array_of_arrays || has_regexs) )
                    {   
                        matcher = getSimpleMatcher( name, getCombinedRegexp( tmp, combined ), 0, cachedMatchers );
                    }
                    else
                    {
                        for (i=0; i<l; i++)
                        {
                            if ( T_ARRAY & get_type( tmp[i] ) )
                                tmp[i] = getCompositeMatcher( name + '_' + i, tmp[i], RegExpID, combined, cachedRegexes, cachedMatchers );
                            else
                                tmp[i] = getSimpleMatcher( name + '_' + i, getRegexp( tmp[i], RegExpID, cachedRegexes ), i, cachedMatchers );
                        }
                        
                        matcher = (l > 1) ? new CompositeMatcher( name, tmp ) : tmp[0];
                    }
                }
                
                cachedMatchers[ name ] = matcher;
            }
            
            return cachedMatchers[ name ];
        },
        
        getBlockMatcher = function(name, tokens, RegExpID, cachedRegexes, cachedMatchers) {
            
            if ( !cachedMatchers[ name ] )
            {
                var tmp, i, l, start, end, t1, t2;
                
                // build start/end mappings
                start = []; end = [];
                tmp = make_array_2( tokens ); // array of arrays
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getSimpleMatcher( name + '_0_' + i, getRegexp( tmp[i][0], RegExpID, cachedRegexes ), i, cachedMatchers );
                    if (tmp[i].length>1)
                    {
                        if ( T_REGEX == t1.tt && T_STR == get_type( tmp[i][1] ) && !hasPrefix( tmp[i][1], RegExpID ) )
                            t2 = tmp[i][1];
                        else
                            t2 = getSimpleMatcher( name + '_1_' + i, getRegexp( tmp[i][1], RegExpID, cachedRegexes ), i, cachedMatchers );
                    }
                    else
                    {
                        t2 = t1;
                    }
                    start.push( t1 );  end.push( t2 );
                }
                
                cachedMatchers[ name ] = new BlockMatcher(name, start, end);
            }
            
            return cachedMatchers[ name ];
        }
    ;
    
    //
    // tokenizer factories
    var
        SimpleToken = Class({
            
            constructor : function(name, token, style) {
                var ayto = this;
                ayto.tt = T_SIMPLE;
                ayto.tn = name;
                ayto.t = token;
                ayto.r = style;
                ayto.required = 0;
                ayto.ERR = 0;
                ayto.toClone = ['t', 'r'];
            },
            
            // tokenizer/token name
            tn : null,
            // tokenizer type
            tt : null,
            // tokenizer token matcher
            t : null,
            // tokenizer return val
            r : null,
            required : 0,
            ERR : 0,
            toClone: null,
            
            get : function( stream, state ) {
                var ayto = this, token = ayto.t, type = ayto.tt;
                // match EOL ( with possible leading spaces )
                if ( T_EOL == type ) 
                { 
                    stream.spc();
                    if ( stream.eol() )
                    {
                        state.t = T_DEFAULT; 
                        //state.r = ayto.r; 
                        return ayto.r; 
                    }
                }
                // match non-space
                else if ( T_NONSPACE == type ) 
                { 
                    ayto.ERR = ( ayto.required && stream.spc() && !stream.eol() ) ? 1 : 0;
                    ayto.required = 0;
                }
                // else match a simple token
                else if ( token.get(stream) ) 
                { 
                    state.t = ayto.tt; 
                    //state.r = ayto.r; 
                    return ayto.r; 
                }
                return false;
            },
            
            require : function(bool) { 
                this.required = (bool) ? 1 : 0;
                return this;
            },
            
            push : function(stack, pos, token) {
                if ( pos ) stack.splice( pos, 0, token );
                else stack.push( token );
                return this;
            },
            
            clone : function() {
                var ayto = this, t, i, toClone = ayto.toClone, toClonelen;
                
                t = new ayto.$class();
                t.tt = ayto.tt;
                t.tn = ayto.tn;
                
                if (toClone && toClone.length)
                {
                    toClonelen = toClone.length;
                    for (i=0; i<toClonelen; i++)   
                        t[ toClone[i] ] = ayto[ toClone[i] ];
                }
                return t;
            },
            
            toString : function() {
                return ['[', 'Tokenizer: ', this.tn, ', Matcher: ', ((this.t) ? this.t.toString() : null), ']'].join('');
            }
        }),
        
        BlockToken = Class(SimpleToken, {
            
            constructor : function(type, name, token, style, styleInterior, allowMultiline, escChar) {
                var ayto = this;
                ayto.$super('constructor', name, token, style);
                ayto.ri = ( 'undefined' == typeof(styleInterior) ) ? ayto.r : styleInterior;
                ayto.tt = type;
                // a block is multiline by default
                ayto.mline = ( 'undefined' == typeof(allowMultiline) ) ? 1 : allowMultiline;
                ayto.esc = escChar || "\\";
                ayto.toClone = ['t', 'r', 'ri', 'mline', 'esc'];
            },    
            
            // return val for interior
            ri : null,
            mline : 0,
            esc : null,
            
            get : function( stream, state ) {
            
                var ayto = this, ended = 0, found = 0, endBlock, next = "", continueToNextLine, stackPos, 
                    allowMultiline = ayto.mline, startBlock = ayto.t, thisBlock = ayto.tn, type = ayto.tt,
                    style = ayto.r, styleInterior = ayto.ri, differentInterior = (style != styleInterior),
                    charIsEscaped = 0, isEscapedBlock = (T_ESCBLOCK == type), escChar = ayto.esc,
                    isEOLBlock, alreadyIn, ret, streamPos, streamPos0, continueBlock
                ;
                
                /*
                    This tokenizer class handles many different block types ( BLOCK, COMMENT, ESC_BLOCK, SINGLE_LINE_BLOCK ),
                    having different styles ( DIFFERENT BLOCK DELIMS/INTERIOR ) etc..
                    So logic can become somewhat complex,
                    descriptive names and logic used here for clarity as far as possible
                */
                
                // comments in general are not required tokens
                if ( T_COMMENT == type ) ayto.required = 0;
                
                alreadyIn = 0;
                if ( state.inBlock == thisBlock )
                {
                    found = 1;
                    endBlock = state.endBlock;
                    alreadyIn = 1;
                    ret = styleInterior;
                }    
                else if ( !state.inBlock && (endBlock = startBlock.get(stream)) )
                {
                    found = 1;
                    state.inBlock = thisBlock;
                    state.endBlock = endBlock;
                    ret = style;
                }    
                
                if ( found )
                {
                    stackPos = state.stack.length;
                    
                    isEOLBlock = (T_NULL == endBlock.tt);
                    
                    if ( differentInterior )
                    {
                        if ( alreadyIn && isEOLBlock && stream.sol() )
                        {
                            ayto.required = 0;
                            state.inBlock = null;
                            state.endBlock = null;
                            return false;
                        }
                        
                        if ( !alreadyIn )
                        {
                            ayto.push( state.stack, stackPos, ayto.clone() );
                            state.t = type;
                            //state.r = ret; 
                            return ret;
                        }
                    }
                    
                    ended = endBlock.get(stream);
                    continueToNextLine = allowMultiline;
                    continueBlock = 0;
                    
                    if ( !ended )
                    {
                        streamPos0 = stream.pos;
                        while ( !stream.eol() ) 
                        {
                            streamPos = stream.pos;
                            if ( !(isEscapedBlock && charIsEscaped) && endBlock.get(stream) ) 
                            {
                                if ( differentInterior )
                                {
                                    if ( stream.pos > streamPos && streamPos > streamPos0)
                                    {
                                        ret = styleInterior;
                                        stream.bck2(streamPos);
                                        continueBlock = 1;
                                    }
                                    else
                                    {
                                        ret = style;
                                        ended = 1;
                                    }
                                }
                                else
                                {
                                    ret = style;
                                    ended = 1;
                                }
                                break;
                            }
                            else
                            {
                                next = stream.nxt();
                            }
                            charIsEscaped = !charIsEscaped && next == escChar;
                        }
                    }
                    else
                    {
                        ret = (isEOLBlock) ? styleInterior : style;
                    }
                    continueToNextLine = allowMultiline || (isEscapedBlock && charIsEscaped);
                    
                    if ( ended || (!continueToNextLine && !continueBlock) )
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    else
                    {
                        ayto.push( state.stack, stackPos, ayto.clone() );
                    }
                    
                    state.t = type;
                    //state.r = ret; 
                    return ret;
                }
                
                //state.inBlock = null;
                //state.endBlock = null;
                return false;
            }
        }),
                
        RepeatedTokens = Class(SimpleToken, {
                
            constructor : function( name, tokens, min, max ) {
                var ayto = this;
                ayto.tt = T_REPEATED;
                ayto.tn = name || null;
                ayto.t = null;
                ayto.ts = null;
                ayto.min = min || 0;
                ayto.max = max || INF;
                ayto.found = 0;
                ayto.toClone = ['ts', 'min', 'max', 'found'];
                if (tokens) ayto.set( tokens );
            },
            
            ts: null,
            min: 0,
            max: 1,
            found : 0,
            
            set : function( tokens ) {
                if ( tokens ) this.ts = make_array( tokens );
                return this;
            },
            
            get : function( stream, state ) {
            
                var ayto = this, i, token, style, tokens = ayto.ts, n = tokens.length, 
                    found = ayto.found, min = ayto.min, max = ayto.max,
                    tokensRequired = 0, streamPos, stackPos;
                
                ayto.ERR = 0;
                ayto.required = 0;
                streamPos = stream.pos;
                stackPos = state.stack.length;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone().require(1);
                    style = token.get(stream, state);
                    
                    if ( false !== style )
                    {
                        ++found;
                        if ( found <= max )
                        {
                            // push it to the stack for more
                            ayto.found = found;
                            ayto.push( state.stack, stackPos, ayto.clone() );
                            ayto.found = 0;
                            return style;
                        }
                        break;
                    }
                    else if ( token.required )
                    {
                        tokensRequired++;
                    }
                    if ( token.ERR ) stream.bck2( streamPos );
                }
                
                ayto.required = found < min;
                ayto.ERR = found > max || (found < min && 0 < tokensRequired);
                return false;
            }
        }),
        
        EitherTokens = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_EITHER;
            },
            
            get : function( stream, state ) {
            
                var ayto = this, style, token, i, tokens = ayto.ts, n = tokens.length, 
                    tokensRequired = 0, tokensErr = 0, streamPos;
                
                ayto.required = 1;
                ayto.ERR = 0;
                streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone();
                    style = token.get(stream, state);
                    
                    tokensRequired += (token.required) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        return style;
                    }
                    else if ( token.ERR )
                    {
                        tokensErr++;
                        stream.bck2( streamPos );
                    }
                }
                
                ayto.required = (tokensRequired > 0);
                ayto.ERR = (n == tokensErr && tokensRequired > 0);
                return false;
            }
        }),

        AllTokens = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_ALL;
            },
            
            get : function( stream, state ) {
                
                var ayto = this, token, style, tokens = ayto.ts, n = tokens.length,
                    streamPos, stackPos;
                
                ayto.required = 1;
                ayto.ERR = 0;
                streamPos = stream.pos;
                stackPos = state.stack.length;
                token = tokens[ 0 ].clone().require( 1 );
                style = token.get(stream, state);
                
                if ( false !== style )
                {
                    for (var i=n-1; i>0; i--)
                        ayto.push( state.stack, stackPos+n-i-1, tokens[ i ].clone().require( 1 ) );
                        
                    return style;
                }
                else if ( token.ERR /*&& token.required*/ )
                {
                    ayto.ERR = 1;
                    stream.bck2( streamPos );
                }
                else if ( token.required )
                {
                    ayto.ERR = 1;
                }
                
                return false;
            }
        }),
                
        NGramToken = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_NGRAM;
            },
            
            get : function( stream, state ) {
                
                var ayto = this, token, style, tokens = ayto.ts, n = tokens.length, 
                    streamPos, stackPos;
                
                ayto.required = 0;
                ayto.ERR = 0;
                streamPos = stream.pos;
                stackPos = state.stack.length;
                token = tokens[ 0 ].clone().require( 0 );
                style = token.get(stream, state);
                
                if ( false !== style )
                {
                    for (var i=n-1; i>0; i--)
                        ayto.push( state.stack, stackPos+n-i-1, tokens[ i ].clone().require( 1 ) );
                    
                    return style;
                }
                else if ( token.ERR )
                {
                    stream.bck2( streamPos );
                }
                
                return false;
            }
        }),
                
        getTokenizer = function(tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords) {
            
            if ( null === tokenID )
            {
                // EOL Tokenizer
                var token = new SimpleToken( tokenID, tokenID, DEFAULTSTYLE );
                token.tt = T_EOL;
                return token;
            }
            
            else if ( "" === tokenID )
            {
                // NONSPACE Tokenizer
                var token = new SimpleToken( tokenID, tokenID, DEFAULTSTYLE );
                token.tt = T_NONSPACE;
                return token;
            }
            
            else
            {
                tokenID = '' + tokenID;
                
                if ( !cachedTokens[ tokenID ] )
                {
                    var tok, token = null, type, combine, action, matchType, tokens, subTokenizers;
                
                    // allow token to be literal and wrap to simple token with default style
                    tok = Lex[ tokenID ] || Syntax[ tokenID ] || { type: "simple", tokens: tokenID };
                    
                    if ( tok )
                    {
                        // tokens given directly, no token configuration object, wrap it
                        if ( (T_STR | T_ARRAY) & get_type( tok ) )
                        {
                            tok = { type: "simple", tokens: tok };
                        }
                        
                        // provide some defaults
                        type = (tok.type) ? tokenTypes[ tok.type.toUpperCase().replace('-', '').replace('_', '') ] : T_SIMPLE;
                        
                        if ( (T_SIMPLE & type) && "" === tok.tokens )
                        {
                            // NONSPACE Tokenizer
                            token = new SimpleToken( tokenID, "", DEFAULTSTYLE );
                            token.tt = T_NONSPACE;
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            return token;
                        }
            
                        tok.tokens = make_array( tok.tokens );
                        action = tok.action || null;
                        
                        if ( T_SIMPLE & type )
                        {
                            if ( tok.autocomplete ) getAutoComplete(tok, tokenID, keywords);
                            
                            // combine by default if possible using word-boundary delimiter
                            combine = ( 'undefined' ==  typeof(tok.combine) ) ? "\\b" : tok.combine;
                            token = new SimpleToken( 
                                        tokenID,
                                        getCompositeMatcher( tokenID, tok.tokens.slice(), RegExpID, combine, cachedRegexes, cachedMatchers ), 
                                        Style[ tokenID ] || DEFAULTSTYLE
                                    );
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                        }
                        
                        else if ( T_BLOCK & type )
                        {
                            if ( T_COMMENT & type ) getComments(tok, comments);

                            token = new BlockToken( 
                                        type,
                                        tokenID,
                                        getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
                                        Style[ tokenID ] || DEFAULTSTYLE,
                                        // allow block delims / block interior to have different styles
                                        Style[ tokenID + '.inside' ],
                                        tok.multiline,
                                        tok.escape
                                    );
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            if ( tok.interleave ) commentTokens.push( token.clone() );
                        }
                        
                        else if ( T_GROUP & type )
                        {
                            tokens = tok.tokens.slice();
                            if ( T_ARRAY & get_type( tok.match ) )
                            {
                                token = new RepeatedTokens(tokenID, null, tok.match[0], tok.match[1]);
                            }
                            else
                            {
                                matchType = groupTypes[ tok.match.toUpperCase() ]; 
                                
                                if (T_ZEROORONE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 0, 1);
                                
                                else if (T_ZEROORMORE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 0, INF);
                                
                                else if (T_ONEORMORE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 1, INF);
                                
                                else if (T_EITHER & matchType) 
                                    token = new EitherTokens(tokenID, null);
                                
                                else //if (T_ALL == matchType)
                                    token = new AllTokens(tokenID, null);
                            }
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            subTokenizers = [];
                            for (var i=0, l=tokens.length; i<l; i++)
                                subTokenizers = subTokenizers.concat( getTokenizer( tokens[i], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) );
                            
                            token.set( subTokenizers );
                            
                        }
                        
                        else if ( T_NGRAM & type )
                        {
                            // get n-gram tokenizer
                            token = make_array_2( tok.tokens.slice() ).slice(); // array of arrays
                            var ngrams = [], ngram;
                            
                            for (var i=0, l=token.length; i<l; i++)
                            {
                                // get tokenizers for each ngram part
                                ngrams[i] = token[i].slice();
                                // get tokenizer for whole ngram
                                token[i] = new NGramToken( tokenID + '_NGRAM_' + i, null );
                            }
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            for (var i=0, l=token.length; i<l; i++)
                            {
                                ngram = ngrams[i];
                                
                                subTokenizers = [];
                                for (var j=0, l2=ngram.length; j<l2; j++)
                                    subTokenizers = subTokenizers.concat( getTokenizer( ngram[j], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens,  comments, keywords ) );
                                
                                // get tokenizer for whole ngram
                                token[i].set( subTokenizers );
                            }
                        }
                    }
                }
                return cachedTokens[ tokenID ];
            }
        },
        
        getComments = function(tok, comments) {
            // build start/end mappings
            var tmp = make_array_2(tok.tokens.slice()); // array of arrays
            var start, end, lead;
            for (i=0, l=tmp.length; i<l; i++)
            {
                start = tmp[i][0];
                end = (tmp[i].length>1) ? tmp[i][1] : tmp[i][0];
                lead = (tmp[i].length>2) ? tmp[i][2] : "";
                
                if ( null === end )
                {
                    // line comment
                    comments.line = comments.line || [];
                    comments.line.push( start );
                }
                else
                {
                    // block comment
                    comments.block = comments.block || [];
                    comments.block.push( [start, end, lead] );
                }
            }
        },
        
        getAutoComplete = function(tok, type, keywords) {
            var kws = [].concat(make_array(tok.tokens)).map(function(word) { return { word: word, meta: type }; });
            keywords.autocomplete = concat.apply( keywords.autocomplete || [], kws );
        },
        
        parseGrammar = function(grammar) {
            var RegExpID, tokens, numTokens, _tokens, 
                Style, Lex, Syntax, t, tokenID, token, tok,
                cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if ( grammar.__parsed ) return grammar;
            
            cachedRegexes = {}; cachedMatchers = {}; cachedTokens = {}; comments = {}; keywords = {};
            commentTokens = [];
            grammar = clone( grammar );
            
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            
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
                
                token = getTokenizer( tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) || null;
                
                if ( token )
                {
                    if ( T_ARRAY & get_type( token ) )  tokens = tokens.concat( token );
                    
                    else  tokens.push( token );
                }
            }
            
            grammar.Parser = tokens;
            grammar.cTokens = commentTokens;
            grammar.Style = Style;
            grammar.Comments = comments;
            grammar.Keywords = keywords;
            
            // this grammar is parsed
            grammar.__parsed = 1;
            
            return grammar;
        }
    ;
      
    // codemirror supposed to be available
    var _CodeMirror = CodeMirror || { Pass : { toString: function(){return "CodeMirror.Pass";} } };
    
    //
    // parser factories
    var
        CodemirrorParser = Class({
            
            constructor: function(grammar, LOC) {
                var ayto = this;
                ayto.electricChars = grammar.electricChars || false;
                
                // support comments toggle functionality
                ayto.LC = (grammar.Comments.line) ? grammar.Comments.line[0] : null,
                ayto.BCS = (grammar.Comments.block) ? grammar.Comments.block[0][0] : null,
                ayto.BCE = (grammar.Comments.block) ? grammar.Comments.block[0][1] : null,
                ayto.BCC = ayto.BCL = (grammar.Comments.block) ? grammar.Comments.block[0][2] : null,
                ayto.DEF = LOC.DEFAULT;
                ayto.ERR = grammar.Style.error || LOC.ERROR;
                
                // support keyword autocompletion
                ayto.Keywords = grammar.Keywords.autocomplete || null;
                
                ayto.Tokens = grammar.Parser || [];
                ayto.cTokens = (grammar.cTokens.length) ? grammar.cTokens : null;
            },
            
            conf: null,
            parserConf: null,
            electricChars: false,
            LC: null,
            BCS: null,
            BCE: null,
            BCL: null,
            BCC: null,
            ERR: null,
            DEF: null,
            Keywords: null,
            cTokens: null,
            Tokens: null,
            //innerModes: null,
            //currentMode: null,
            
            parse: function(code) {
                code = code || "";
                var lines = code.split(/\r\n|\r|\n/g), l = lines.length, i;
                var linetokens = [], tokens, state, stream;
                state = new ParserState( );;
                
                for (i=0; i<l; i++)
                {
                    stream = new ParserStream(lines[i]);
                    tokens = [];
                    while ( !stream.eol() )
                    {
                        tokens.push(this.getToken(stream, state, 1));
                        stream.sft();
                    }
                    linetokens.push(tokens);
                }
                return linetokens;
            },
            
            // Codemirror Tokenizer compatible
            getToken: function(stream_, state, asData) {
                
                var i, ci, ayto = this,
                    tokenizer, type, interleavedCommentTokens = ayto.cTokens, tokens = ayto.Tokens, numTokens = tokens.length, 
                    stream, stack, currentError = null, DEFAULT = ayto.DEF, ERROR = ayto.ERR, ret
                ;
                
                stack = state.stack;
                stream = new ParserStream().fromStream( stream_ );
                
                /*if ( ayto.currentMode )
                {
                    return ayto.handleInnerMode(stream_, state);
                }*/
                
                // if EOL tokenizer is left on stack, pop it now
                if ( stream.sol() && stack.length && T_EOL == stack[stack.length-1].tt ) stack.pop();
                
                // check for non-space tokenizer before parsing space
                if ( !stack.length || T_NONSPACE != stack[stack.length-1].tt )
                {
                    if ( stream.spc() ) 
                    {
                        state.t = T_DEFAULT;
                        return (asData) ? { value: stream.cur(), type: DEFAULT, error: null} : state.r = DEFAULT;
                    }
                }
                
                while ( stack.length )
                {
                    if (interleavedCommentTokens)
                    {
                        ci = 0;
                        while ( ci < interleavedCommentTokens.length )
                        {
                            tokenizer = interleavedCommentTokens[ci++];
                            type = tokenizer.get(stream, state);
                            if ( false !== type )
                            {
                                return (asData) ? { value: stream.cur(), type: type, error: null} : state.r = type;
                            }
                        }
                    }
                    
                    tokenizer = stack.pop();
                    type = tokenizer.get(stream, state);
                    
                    // match failed
                    if ( false === type )
                    {
                        // error
                        if ( tokenizer.ERR || tokenizer.required )
                        {
                            // empty the stack
                            stack.length = 0;
                            // skip this character
                            stream.nxt();
                            // generate error
                            state.t = T_ERROR;
                            currentError = tokenizer.tn + ((tokenizer.required) ? " is missing" : " syntax error");
                            return (asData) ? { value: stream.cur(), type: ERROR, error: currentError} : state.r = ERROR;
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
                        return (asData) ? { value: stream.cur(), type: type, error: null} : state.r = type;
                    }
                }
                
                for (i=0; i<numTokens; i++)
                {
                    tokenizer = tokens[i];
                    type = tokenizer.get(stream, state);
                    
                    // match failed
                    if ( false === type )
                    {
                        // error
                        if ( tokenizer.ERR || tokenizer.required )
                        {
                            // empty the stack
                            stack.length = 0;
                            // skip this character
                            stream.nxt();
                            // generate error
                            state.t = T_ERROR;
                            currentError = tokenizer.tn + ((tokenizer.required) ? " is missing" : " syntax error");
                            return (asData) ? { value: stream.cur(), type: ERROR, error: currentError} : state.r = ERROR;
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
                        return (asData) ? { value: stream.cur(), type: type, error: null} : state.r = type;
                    }
                }
                
                // unknown, bypass
                stream.nxt();
                state.t = T_DEFAULT;
                return (asData) ? { value: stream.cur(), type: DEFAULT, error: null} : state.r = DEFAULT;
            },
            
            indent : function(state, textAfter, fullLine) {
                // Default for now, TODO
                return _CodeMirror.Pass;
            }/*,
            
            handleInnerMode : function(stream, state) {
            },
            
            addInnerMode : function(startToken, endToken, mode) {
                this.innerModes = this.innerModes || [];
                this.innerModes.push([startToken, endToken, mode]);
                return this;
            },
            
            removeInnerMode : function(mode) {
                if (this.innerModes)
                {
                    var modes = this.innerModes;
                    for (var i=0, l=modes.length; i<l; i++)
                    {
                        if ( mode === modes[i][2])
                        {
                            modes.splice(i, 1);
                            break;
                        }
                    }
                }
                return this;
            }*/
        }),
        
        getParser = function(grammar, LOCALS) {
            return new CodemirrorParser(grammar, LOCALS);
        },
        
        getCodemirrorMode = function(parser) {
                
            // Codemirror-compatible Mode
            var mode = function(conf, parserConf) {
                
                parser.conf = conf;
                parser.parserConf = parserConf;
                
                // return the (codemirror) parser mode for the grammar
                return  {
                    /*
                    // maybe needed in later versions..
                    
                    blankLine: function( state ) { },
                    
                    innerMode: function( state ) { },
                    */
                    
                    startState: function( ) { return new ParserState(); },
                    
                    electricChars: parser.electricChars,
                    
                    // syntax, lint-like validator generated from grammar
                    validator: function (text, options)  {
                        var errorFound = 0, code, errors, linetokens, tokens, token, t, lines, line, row, column;
                        code = text;
                        if ( !code || !code.length ) 
                        {
                            return [];
                        }
                        
                        errors = [];
                        linetokens = parser.parse( code );
                        lines = linetokens.length;
                        
                        for (line=0; line<lines; line++) 
                        {
                            tokens = linetokens[ line ];
                            if ( !tokens || !tokens.length )  continue;
                            
                            column = 0;
                            for (t=0; t<tokens.length; t++)
                            {
                                token = tokens[t];
                                
                                if ( parser.ERR == token.type )
                                {
                                    errors.push({
                                        message: token.error || 'Syntax Error',
                                        severity: "error",
                                        from: CodeMirror.Pos(line, column),
                                        to: CodeMirror.Pos(line, column+1)
                                    });
                                    
                                    errorFound = 1;
                                }
                                column += token.value.length;
                            }
                        }
                        if (errorFound)
                        {
                            console.log(errors);
                            return errors;
                        }
                        else
                        {
                            return [];
                        }
                    },
                    
                    // support comments toggle functionality
                    lineComment: parser.LC,
                    blockCommentStart: parser.BCS,
                    blockCommentEnd: parser.BCE,
                    blockCommentContinue: parser.BCC,
                    blockCommentLead: parser.BCL,
                    
                    copyState: function( state ) { return state.clone(); },
                    
                    token: function(stream, state) { return parser.getToken(stream, state); },
                    
                    indent: function(state, textAfter, fullLine) { return parser.indent(state, textAfter, fullLine); }
                };
                
            };
            return mode;
        },
        
        getMode = function(grammar, DEFAULT) {
            
            var LOCALS = { 
                    // default return code for skipped or not-styled tokens
                    // 'null' should be used in most cases
                    DEFAULT: DEFAULT || DEFAULTSTYLE,
                    ERROR: DEFAULTERROR
                }
            ;
            
            // build the grammar
            grammar = parseGrammar( grammar );
            //console.log(grammar);
            
            return getCodemirrorMode( getParser( grammar, LOCALS ) );
        }
    ;
  /**
*
*   CodeMirrorGrammar
*   @version: 0.7.1
*
*   Transform a grammar specification in JSON format, into a syntax-highlight parser mode for CodeMirror
*   https://github.com/foo123/codemirror-grammar
*
**/
    
    //
    //  CodeMirror Grammar main class
    /**[DOC_MARKDOWN]
    *
    * ###CodeMirrorGrammar Methods
    *
    * __For node with dependencies:__
    *
    * ```javascript
    * CodeMirrorGrammar = require('build/codemirror_grammar.js').CodeMirrorGrammar;
    * // or
    * CodeMirrorGrammar = require('build/codemirror_grammar.bundle.js').CodeMirrorGrammar;
    * ```
    *
    * __For browser with dependencies:__
    *
    * ```html
    * <script src="../build/codemirror_grammar.bundle.js"></script>
    * <!-- or -->
    * <script src="../build/classy.js"></script>
    * <script src="../build/regexanalyzer.js"></script>
    * <script src="../build/codemirror_grammar.js"></script>
    * <script> // CodeMirrorGrammar.getMode(..) , etc.. </script>
    * ```
    *
    [/DOC_MARKDOWN]**/
    DEFAULTSTYLE = null;
    DEFAULTERROR = "error";
    var CodeMirrorGrammar = {
        
        VERSION : "0.7.1",
        
        // extend a grammar using another base grammar
        /**[DOC_MARKDOWN]
        * __Method__: *extend*
        *
        * ```javascript
        * extendedgrammar = CodeMirrorGrammar.extend(grammar, basegrammar1 [, basegrammar2, ..]);
        * ```
        *
        * Extend a grammar with basegrammar1, basegrammar2, etc..
        *
        * This way arbitrary dialects and variations can be handled more easily
        [/DOC_MARKDOWN]**/
        extend : extend,
        
        // parse a grammar
        /**[DOC_MARKDOWN]
        * __Method__: *parse*
        *
        * ```javascript
        * parsedgrammar = CodeMirrorGrammar.parse(grammar);
        * ```
        *
        * This is used internally by the CodeMirrorGrammar Class
        * In order to parse a JSON grammar to a form suitable to be used by the syntax-highlight parser.
        * However user can use this method to cache a parsedgrammar to be used later.
        * Already parsed grammars are NOT re-parsed when passed through the parse method again
        [/DOC_MARKDOWN]**/
        parse : parseGrammar,
        
        // get a codemirror syntax-highlight mode from a grammar
        /**[DOC_MARKDOWN]
        * __Method__: *getMode*
        *
        * ```javascript
        * mode = CodeMirrorGrammar.getMode(grammar [, DEFAULT]);
        * ```
        *
        * This is the main method which transforms a JSON grammar into a CodeMirror syntax-highlight parser.
        * DEFAULT is the default return value (null by default) for things that are skipped or not styled
        * In general there is no need to set this value, unless you need to return something else
        [/DOC_MARKDOWN]**/
        getMode : getMode
    };


    /* main code ends here */
    
    /* export the module "CodeMirrorGrammar" */
    return CodeMirrorGrammar;
});