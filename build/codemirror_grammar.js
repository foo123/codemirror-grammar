/**
*
*   CodeMirrorGrammar
*   @version: 0.9.3
*
*   Transform a grammar specification in JSON format, into a syntax-highlight parser mode for CodeMirror
*   https://github.com/foo123/codemirror-grammar
*
**/!function ( root, name, deps, factory ) {
    "use strict";
    
    //
    // export the module umd-style (with deps bundled-in or external)
    
    // Get current filename/path
    function getPath( isNode, isWebWorker, isAMD, isBrowser, amdMod ) 
    {
        var f;
        if (isNode) return {file:__filename, path:__dirname};
        else if (isWebWorker) return {file:(f=self.location.href), path:f.split('/').slice(0, -1).join('/')};
        else if (isAMD&&amdMod&&amdMod.uri)  return {file:(f=amdMod.uri), path:f.split('/').slice(0, -1).join('/')};
        else if (isBrowser&&(f=document.getElementsByTagName('script'))&&f.length) return {file:(f=f[f.length - 1].src), path:f.split('/').slice(0, -1).join('/')};
        return {file:null,  path:null};
    }
    function getDeps( names, paths, deps, depsType, require/*offset*/ )
    {
        //offset = offset || 0;
        var i, dl = names.length, mods = new Array( dl );
        for (i=0; i<dl; i++) 
            mods[ i ] = (1 === depsType)
                    ? /* node */ (deps[ names[ i ] ] || require( paths[ i ] )) 
                    : (2 === depsType ? /* amd args */ /*(deps[ i + offset ])*/ (require( names[ i ] )) : /* globals */ (deps[ names[ i ] ]))
                ;
        return mods;
    }
    // load javascript(s) (a)sync using <script> tags if browser, or importScripts if worker
    function loadScripts( scope, base, names, paths, callback, imported )
    {
        var dl = names.length, i, rel, t, load, next, head, link;
        if ( imported )
        {
            for (i=0; i<dl; i++) if ( !(names[ i ] in scope) ) importScripts( base + paths[ i ] );
            return callback( );
        }
        head = document.getElementsByTagName("head")[ 0 ]; link = document.createElement( 'a' );
        rel = /^\./; t = 0; i = 0;
        load = function( url, cb ) {
            var done = 0, script = document.createElement('script');
            script.type = 'text/javascript'; script.language = 'javascript';
            script.onload = script.onreadystatechange = function( ) {
                if (!done && (!script.readyState || script.readyState == 'loaded' || script.readyState == 'complete'))
                {
                    done = 1; script.onload = script.onreadystatechange = null;
                    cb( );
                    head.removeChild( script ); script = null;
                }
            }
            if ( rel.test( url ) ) 
            {
                // http://stackoverflow.com/a/14781678/3591273
                // let the browser generate abs path
                link.href = base + url;
                url = link.protocol + "//" + link.host + link.pathname + link.search + link.hash;
            }
            // load it
            script.src = url; head.appendChild( script );
        };
        next = function( ) {
            if ( names[ i ] in scope )
            {
                if ( ++i >= dl ) callback( );
                else if ( names[ i ] in scope ) next( ); 
                else load( paths[ i ], next );
            }
            else if ( ++t < 30 ) { setTimeout( next, 30 ); }
            else { t = 0; i++; next( ); }
        };
        while ( i < dl && (names[ i ] in scope) ) i++;
        if ( i < dl ) load( paths[ i ], next );
        else callback( );
    }
    
    deps = deps || [[],[]];
    
    var isNode = ("undefined" !== typeof global) && ("[object global]" === {}.toString.call(global)),
        isBrowser = !isNode && ("undefined" !== typeof navigator), 
        isWebWorker = !isNode && ("function" === typeof importScripts) && (navigator instanceof WorkerNavigator),
        isAMD = ("function" === typeof define) && define.amd,
        isCommonJS = isNode && ("object" === typeof module) && module.exports,
        currentGlobal = isWebWorker ? self : root, currentPath = getPath( isNode, isWebWorker, isAMD, isBrowser ), m,
        names = [].concat(deps[0]), paths = [].concat(deps[1]), dl = names.length, i, requireJSPath, ext_js = /\.js$/i
    ;
    
    // commonjs, node, etc..
    if ( isCommonJS ) 
    {
        module.$deps = module.$deps || {};
        module.exports = module.$deps[ name ] = factory.apply( root, [{NODE:module}].concat(getDeps( names, paths, module.$deps, 1, require )) ) || 1;
    }
    
    // amd, requirejs, etc..
    else if ( isAMD && ("function" === typeof require) && ("function" === typeof require.specified) &&
        require.specified(name) ) 
    {
        if ( !require.defined(name) )
        {
            requireJSPath = { };
            for (i=0; i<dl; i++) 
                require.specified( names[ i ] ) || (requireJSPath[ names[ i ] ] = paths[ i ].replace(ext_js, ''));
            //requireJSPath[ name ] = currentPath.file.replace(ext_js, '');
            require.config({ paths: requireJSPath });
            // named modules, require the module by name given
            define( name, ["require", "exports", "module"].concat( names ), function( require, exports, module ) {
                return factory.apply( root, [{AMD:module}].concat(getDeps( names, paths, arguments, 2, require )) );
            });
        }
    }
    
    // browser, web worker, other loaders, etc.. + AMD optional
    else if ( !(name in currentGlobal) )
    {
        loadScripts( currentGlobal, currentPath.path + '/', names, paths, function( ){ 
            currentGlobal[ name ] = m = factory.apply( root, [{}].concat(getDeps( names, paths, currentGlobal )) ) || 1; 
            isAMD && define( name, ["require"], function( ){ return m; } );
        }, isWebWorker);
    }


}(  /* current root */          this, 
    /* module name */           "CodeMirrorGrammar",
    /* module dependencies */   [ ['Classy', 'RegExAnalyzer'],  ['./classy.js', './regexanalyzer.js'] ], 
    /* module factory */        function( exports, Classy, RegexAnalyzer, undef ) {
        
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
        T_NAN = 3,
        //T_INF = 3,
        T_BOOL = 4,
        T_STR = 8,
        T_CHAR = 9,
        T_CHARLIST = 10,
        T_ARRAY = 16,
        T_OBJ = 32,
        T_FUNC = 64,
        T_REGEX = 128,
        T_NULL = 256,
        T_UNDEF = 512,
        T_UNKNOWN = 1024,
        
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
        T_EMPTY = 20,
        T_BLOCK = 32,
        T_ESCBLOCK = 33,
        T_COMMENT = 34,
        T_EITHER = 64,
        T_ALL = 128,
        T_REPEATED = 256,
        T_ZEROORONE = 257,
        T_ZEROORMORE = 258,
        T_ONEORMORE = 259,
        T_GROUP = 512,
        T_NGRAM = 1024,
        T_INDENT = 2048,
        T_DEDENT = 4096,
        
        //
        // tokenizer types
        groupTypes = {
            EITHER: T_EITHER, ALL: T_ALL, 
            ZEROORONE: T_ZEROORONE, ZEROORMORE: T_ZEROORMORE, ONEORMORE: T_ONEORMORE, 
            REPEATED: T_REPEATED
        },
        
        tokenTypes = {
            INDENT: T_INDENT, DEDENT: T_DEDENT,
            BLOCK: T_BLOCK, COMMENT: T_COMMENT, ESCAPEDBLOCK: T_ESCBLOCK, 
            SIMPLE: T_SIMPLE, GROUP: T_GROUP, NGRAM: T_NGRAM
        }
    ;
    
    var Class = Classy.Class;
    
    var AP = Array.prototype, OP = Object.prototype, FP = Function.prototype,
        slice = FP.call.bind(AP.slice), concat = AP.concat,
        hasKey = FP.call.bind(OP.hasOwnProperty), toStr = FP.call.bind(OP.toString), 
        isEnum = FP.call.bind(OP.propertyIsEnumerable), Keys = Object.keys,
        
        get_type = Classy.Type,

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
                if ( hasKey(o, k) && isEnum(o, k) ) 
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
            var args = slice(arguments), argslen = args.length;
            
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
                    if ( hasKey(o2, k) && isEnum(o2, k) )
                    {
                        if ( hasKey(o1, k) && isEnum(o1, k) ) 
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
            return str.replace(/([.*+?^${}()|[\]\/\\\-])/g, '\\$1');
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
            
            var l = (rid) ? (rid.length||0) : 0, i;
            
            if ( l && rid == r.substr(0, l) ) 
            {
                var regexSource = r.substr(l), delim = regexSource[0], flags = '',
                    regexBody, regexID, regex, chars, analyzer, i, ch
                ;
                
                // allow regex to have delimiters and flags
                // delimiter is defined as the first character after the regexID
                i = regexSource.length;
                while ( i-- )
                {
                    ch = regexSource[i];
                    if (delim == ch) 
                        break;
                    else if ('i' == ch.toLowerCase() ) 
                        flags = 'i';
                }
                regexBody = regexSource.substring(1, i);
                regexID = "^(" + regexBody + ")";
                //console.log([regexBody, flags]);
                
                if ( !cachedRegexes[ regexID ] )
                {
                    regex = new RegExp( regexID, flags );
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
        
        _id_ = 0, getId = function() { return ++_id_; },
        
        isNode = (typeof global !== "undefined" && {}.toString.call(global) == '[object global]') ? 1 : 0,
        isBrowser = (!isNode && typeof navigator !== "undefined") ? 1 : 0, 
        isWorker = (typeof importScripts === "function" && navigator instanceof WorkerNavigator) ? 1 : 0,
        
        // Get current filename/path
        getCurrentPath = function() {
            var file = null, path, base, scripts;
            if ( isNode ) 
            {
                // http://nodejs.org/docs/latest/api/globals.html#globals_filename
                // this should hold the current file in node
                file = __filename;
                return { path: __dirname, file: __filename, base: __dirname };
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
                base = document.location.href.split('#')[0].split('?')[0].split('/').slice(0, -1).join('/');
                if ((scripts = document.getElementsByTagName('script')) && scripts.length) 
                    file = scripts[scripts.length - 1].src;
            }
            
            if ( file )
                return { path: file.split('/').slice(0, -1).join('/'), file: file, base: base };
            return { path: null, file: null, base: null };
        },
        thisPath = getCurrentPath()
    ;
    
    //
    // Stream Class
    var
        Max = Math.max, spcRegex = /^[\s\u00a0]+/, spc = /[^\s\u00a0]/,
        // Counts the column offset in a string, taking tabs into account.
        // Used mostly to find indentation.
        // adapted from CodeMirror
        countColumn = function(string, end, tabSize, startIndex, startValue) {
            var i, n;
            if ( null === end ) 
            {
                end = string.search(spc);
                if ( -1 == end ) end = string.length;
            }
            for (i = startIndex || 0, n = startValue || 0; i < end; ++i) 
                n += ( "\t" == string.charAt(i) ) ? (tabSize - (n % tabSize)) : 1;
            return n;
        },
        
        // a wrapper-class to manipulate a string as a stream, based on Codemirror's StringStream
        Stream = Class({
            
            constructor: function( line ) {
                var ayto = this;
                ayto._ = null;
                ayto.s = (line) ? ''+line : '';
                ayto.start = ayto.pos = 0;
                ayto.lCP = ayto.lCV = 0;
                ayto.lS = 0;
            },
            
            // abbreviations used for optimal minification
            _: null,
            s: '',
            start: 0,
            pos: 0,
            // last column pos
            lCP: 0,
            // last column value
            lCV: 0,
            // line start
            lS: 0,
            
            toString: function( ) { return this.s; },
            
            fromStream: function( _ ) {
                var ayto = this;
                ayto._ = _;
                ayto.s = ''+_.string;
                ayto.start = _.start;
                ayto.pos = _.pos;
                ayto.lCP = _.lastColumnPos;
                ayto.lCV = _.lastColumnValue;
                ayto.lS = _.lineStart;
                return ayto;
            },
            
            // string start-of-line?
            sol: function( ) { return 0 == this.pos; },
            
            // string end-of-line?
            eol: function( ) { return this.pos >= this.s.length; },
            
            // char match
            chr: function( pattern, eat ) {
                var ayto = this, ch = ayto.s.charAt(ayto.pos) || null;
                if (ch && pattern == ch) 
                {
                    if (false !== eat) 
                    {
                        ayto.pos += 1;
                        if ( ayto._ ) ayto._.pos = ayto.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // char list match
            chl: function( pattern, eat ) {
                var ayto = this, ch = ayto.s.charAt(ayto.pos) || null;
                if ( ch && (-1 < pattern.indexOf( ch )) ) 
                {
                    if (false !== eat) 
                    {
                        ayto.pos += 1;
                        if ( ayto._ ) ayto._.pos = ayto.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // string match
            str: function( pattern, startsWith, eat ) {
                var ayto = this, len, pos = ayto.pos, str = ayto.s, ch = str.charAt(pos) || null;
                if ( ch && startsWith[ ch ] )
                {
                    len = pattern.length; 
                    if (pattern == str.substr(pos, len)) 
                    {
                        if (false !== eat) 
                        {
                            ayto.pos += len;
                            if ( ayto._ ) ayto._.pos = ayto.pos;
                        }
                        return pattern;
                    }
                }
                return false;
            },
            
            // regex match
            rex: function( pattern, startsWith, notStartsWith, group, eat ) {
                var ayto = this, match, pos = ayto.pos, str = ayto.s, ch = str.charAt(pos) || null;
                if ( ch && ( startsWith && startsWith[ ch ] ) || ( notStartsWith && !notStartsWith[ ch ] ) )
                {
                    match = str.slice(pos).match(pattern);
                    if (!match || match.index > 0) return false;
                    if (false !== eat) 
                    {
                        ayto.pos += match[group||0].length;
                        if ( ayto._ ) ayto._.pos = ayto.pos;
                    }
                    return match;
                }
                return false;
            },

            // eat space
            spc: function( eat ) {
                var ayto = this, m, start = ayto.pos, s = ayto.s.slice(start);
                if ( m = s.match( spcRegex ) ) 
                {
                    if ( false !== eat )
                    {
                        ayto.pos += m[0].length;
                        if ( ayto._ ) ayto._.pos = ayto.pos;
                    }
                    return 1;
                }
                return 0;
            },
            
            // skip to end
            end: function( ) {
                var ayto = this;
                ayto.pos = ayto.s.length;
                if ( ayto._ ) ayto._.pos = ayto.pos;
                return ayto;
            },

            // get next char
            nxt: function( ) {
                var ayto = this, ch, s = ayto.s;
                if (ayto.pos < s.length)
                {
                    ch = s.charAt(ayto.pos++) || null;
                    if ( ayto._ ) ayto._.pos = ayto.pos;
                    return ch;
                }
            },
            
            // back-up n steps
            bck: function( n ) {
                var ayto = this;
                ayto.pos = Max(0, ayto.pos - n);
                if ( ayto._ ) ayto._.pos = ayto.pos;
                return ayto;
            },
            
            // back-track to pos
            bck2: function( pos ) {
                var ayto = this;
                ayto.pos = Max(0, pos);
                if ( ayto._ ) ayto._.pos = ayto.pos;
                return ayto;
            },
            
            // get current column including tabs
            col: function( tabSize ) {
                var ayto = this;
                tabSize = tabSize || 1;
                if (ayto.lCP < ayto.start) 
                {
                    ayto.lCV = countColumn(ayto.s, ayto.start, tabSize, ayto.lCP, ayto.lCV);
                    ayto.lCP = ayto.start;
                    if ( ayto._ )
                    {
                        ayto._.start = ayto.start;
                        ayto._.lastColumnPos = ayto.lCP;
                        ayto._.lastColumnValue = ayto.lCV;
                        ayto._.lineStart = ayto.lS;
                    }
                }
                return ayto.lCV - (ayto.lS ? countColumn(ayto.s, ayto.lS, tabSize) : 0);
            },
            
            // get current indentation including tabs
            ind: function( tabSize ) {
                var ayto = this;
                tabSize = tabSize || 1;
                return countColumn(ayto.s, null, tabSize) - (ayto.lS ? countColumn(ayto.s, ayto.lS, tabSize) : 0);
            },
            
            // current stream selection
            cur: function( andShiftStream ) {
                var ayto = this, ret = ayto.s.slice(ayto.start, ayto.pos);
                if ( andShiftStream ) ayto.start = ayto.pos;
                return ret;
            },
            
            // move/shift stream
            sft: function( ) {
                this.start = this.pos;
                return this;
            }
        })
    ;
        
    //
    // Stack Class
    var
        Stack = Class({
            
            constructor: function( array ) {
                this._ = array || [];
            },
            
            // abbreviations used for optimal minification
            _: null,
            
            toString: function( ) { 
                var a = this._.slice(); 
                return a.reverse().join("\n"); 
            },
            
            clone: function( ) {
                return new this.$class( this._.slice() );
            },
            
            isEmpty: function( ) {
                return 0 >= this._.length;
            },
            
            pos: function( ) {
                return this._.length;
            },
            
            peek: function( index ) {
                var stack = this._;
                index = ('undefined' == typeof(index)) ? -1 : index;
                if ( stack.length )
                {
                    if ( (0 > index) && (0 <= stack.length+index) )
                        return stack[ stack.length + index ];
                    else if ( 0 <= index && index < stack.length )
                        return stack[ index ];
                }
                return null;
            },
            
            pop: function( ) {
                return this._.pop();
            },
            
            shift: function( ) {
                return this._.shift();
            },
            
            push: function( i ) {
                this._.push(i);
                return this;
            },
            
            unshift: function( i ) {
                this._.unshift(i);
                return this;
            },
            
            pushAt: function( pos, token, idProp, id ) {
                var stack = this._;
                if ( idProp && id ) token[idProp] = id;
                if ( pos < stack.length ) stack.splice( pos, 0, token );
                else stack.push( token );
                return this;
            },
            
            empty: function(idProp, id) {
                var stack = this._, l = stack.length;
                if ( idProp && id )
                {
                    //while (l && stack[l-1] && stack[l-1][idProp] == id) 
                    while (stack.length && stack[stack.length-1] && stack[stack.length-1][idProp] == id) 
                    {
                        //console.log([id, stack[l-1][idProp]]);
                        //--l;
                        stack.pop();
                    }
                    //stack.length = l;
                }
                else stack.length = 0;
                return this;
            }
        })
    ;
        
    //
    // State Class
    var
        State = Class({
            
            constructor: function( line, unique ) {
                var ayto = this;
                // this enables unique state "names"
                // thus forces highlight to update
                // however updates also occur when no update necessary ??
                ayto.id = unique ? new Date().getTime() : 0;
                ayto.l = line || 0;
                ayto.stack = new Stack();
                ayto.data = new Stack();
                ayto.col = 0;
                ayto.indent = 0;
                ayto.t = null;
                ayto.inBlock = null;
                ayto.endBlock = null;
            },
            
            // state id
            id: 0,
            // state current line
            l: 0,
            col: 0,
            indent: 0,
            // state token stack
            stack: null,
            // state token push/pop match data
            data: null,
            // state current token
            t: null,
            // state current block name
            inBlock: null,
            // state endBlock for current block
            endBlock: null,
            
            clone: function( unique ) {
                var ayto = this, c = new ayto.$class( ayto.l, unique );
                c.t = ayto.t;
                c.col = ayto.col;
                c.indent = ayto.indent;
                c.stack = ayto.stack.clone();
                c.data = ayto.data.clone();
                c.inBlock = ayto.inBlock;
                c.endBlock = ayto.endBlock;
                return c;
            },
            
            // used mostly for ACE which treats states as strings, 
            // make sure to generate a string which will cover most cases where state needs to be updated by the editor
            toString: function() {
                var ayto = this;
                //return ['', ayto.id, ayto.inBlock||'0'].join('_');
                //return ['', ayto.id, ayto.t, ayto.r||'0', ayto.stack.length, ayto.inBlock||'0'].join('_');
                //return ['', ayto.id, ayto.t, ayto.stack.length, ayto.inBlock||'0'].join('_');
                //return ['', ayto.id, ayto.t, ayto.r||'0', ayto.inBlock||'0'].join('_');
                //return ['', ayto.l, ayto.t, ayto.r, ayto.inBlock||'0', ayto.stack.length].join('_');
                return ['', ayto.id, ayto.l, ayto.t, ayto.inBlock||'0'].join('_');
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
                    var endMatcher = endMatchers[ token[0] ], m, 
                        T = get_type( endMatcher ), T0 = startMatcher.ms[ token[0] ].tt;
                    
                    if ( T_REGEX == T0 )
                    {
                        // regex group number given, get the matched group pattern for the ending of this block
                        if ( T_NUM == T )
                        {
                            // the regex is wrapped in an additional group, 
                            // add 1 to the requested regex group transparently
                            m = token[1][ endMatcher+1 ];
                            endMatcher = new SimpleMatcher( (m.length > 1) ? T_STR : T_CHAR, ayto.tn + '_End', m );
                        }
                        // string replacement pattern given, get the proper pattern for the ending of this block
                        else if ( T_STR == T )
                        {
                            // the regex is wrapped in an additional group, 
                            // add 1 to the requested regex group transparently
                            m = groupReplace(endMatcher, token[1]);
                            endMatcher = new SimpleMatcher( (m.length > 1) ? T_STR : T_CHAR, ayto.tn + '_End', m );
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
            
            constructor : function(type, name, token) {
                var ayto = this;
                ayto.tt = type || T_SIMPLE;
                ayto.id = name;
                ayto.tk = token;
                ayto.REQ = 0;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                ayto.CLONE = ['tk'];
            },
            
            sID: null,
            // tokenizer/token name/id
            id: null,
            // tokenizer type
            tt: null,
            // tokenizer token matcher
            tk: null,
            // tokenizer match action (optional)
            tm: null,
            REQ: 0,
            ERR: 0,
            MTCH: 0,
            CLONE: null,
            
            // tokenizer match action (optional)
            m : function(token, state) {
                var matchAction = this.tm || null, t, T, data = state.data;
                
                if ( matchAction )
                {
                    t = matchAction[1];
                    
                    if ( "push" == matchAction[0] && t )
                    {
                        if ( token )
                        {
                            T = get_type( t );
                            if ( T_NUM == T )  t = token[1][t];
                            else t = groupReplace(t, token[1]);
                        }
                        data.push( t );
                    }
                    
                    else if ( "pop" ==  matchAction[0] )
                    {
                        if ( t )
                        {
                            if ( token )
                            {
                                T = get_type( t );
                                if ( T_NUM == T )  t = token[1][t];
                                else t = groupReplace(t, token[1]);
                            }
                            
                            if ( data.isEmpty() || t != data.peek() ) return t;
                            data.pop();
                        }
                        else if ( data.length ) data.pop();
                    }
                }
                return 0;
            },
            
            get : function( stream, state ) {
                var ayto = this, matchAction = ayto.tm, token = ayto.tk, 
                    type = ayto.tt, tokenID = ayto.id, t = null;
                
                ayto.MTCH = 0;
                // match EMPTY token
                if ( T_EMPTY == type ) 
                { 
                    ayto.ERR = 0;
                    ayto.REQ = 0;
                    return true;
                }
                // match EOL ( with possible leading spaces )
                else if ( T_EOL == type ) 
                { 
                    stream.spc();
                    if ( stream.eol() )
                    {
                        return tokenID; 
                    }
                }
                // match non-space
                else if ( T_NONSPACE == type ) 
                { 
                    ayto.ERR = ( ayto.REQ && stream.spc() && !stream.eol() ) ? 1 : 0;
                    ayto.REQ = 0;
                }
                // else match a simple token
                else if ( t = token.get(stream) ) 
                { 
                    if ( matchAction ) ayto.MTCH = ayto.m(t, state);
                    return tokenID; 
                }
                return false;
            },
            
            req : function(bool) { 
                this.REQ = (bool) ? 1 : 0;
                return this;
            },
            
            err : function() {
                var t = this;
                if ( t.REQ ) return ('Token "'+t.id+'" Expected');
                else if ( t.MTCH ) return ('Token "'+t.MTCH+'" No Match')
                return ('Syntax Error: "'+t.id+'"');
            },
        
            clone : function() {
                var ayto = this, t, i, toClone = ayto.CLONE, toClonelen;
                
                t = new ayto.$class();
                t.tt = ayto.tt;
                t.id = ayto.id;
                t.tm = (ayto.tm) ? ayto.tm.slice() : ayto.tm;
                
                if (toClone && toClone.length)
                {
                    for (i=0, toClonelen = toClone.length; i<toClonelen; i++)   
                        t[ toClone[i] ] = ayto[ toClone[i] ];
                }
                return t;
            },
            
            toString : function() {
                return ['[', 'Tokenizer: ', this.id, ', Matcher: ', ((this.tk) ? this.tk.toString() : null), ']'].join('');
            }
        }),
        
        BlockToken = Class(SimpleToken, {
            
            constructor : function(type, name, token, allowMultiline, escChar, hasInterior) {
                var ayto = this;
                ayto.$super('constructor', type, name, token);
                // a block is multiline by default
                ayto.mline = ( 'undefined' == typeof(allowMultiline) ) ? 1 : allowMultiline;
                ayto.esc = escChar || "\\";
                ayto.inter = hasInterior;
                ayto.CLONE = ['tk', 'mline', 'esc', 'inter'];
            },    
            
            inter: 0,
            mline : 0,
            esc : null,
            
            get : function( stream, state ) {
            
                var ayto = this, ended = 0, found = 0, endBlock, next = "", continueToNextLine, stackPos, 
                    allowMultiline = ayto.mline, startBlock = ayto.tk, thisBlock = ayto.id, type = ayto.tt,
                    hasInterior = ayto.inter, thisBlockInterior = (hasInterior) ? (thisBlock+'.inside') : thisBlock,
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
                if ( T_COMMENT == type ) ayto.REQ = 0;
                
                alreadyIn = 0;
                if ( state.inBlock == thisBlock )
                {
                    found = 1;
                    endBlock = state.endBlock;
                    alreadyIn = 1;
                    ret = thisBlockInterior;
                }    
                else if ( !state.inBlock && (endBlock = startBlock.get(stream)) )
                {
                    found = 1;
                    state.inBlock = thisBlock;
                    state.endBlock = endBlock;
                    ret = thisBlock;
                }    
                
                if ( found )
                {
                    stackPos = state.stack.pos();
                    
                    isEOLBlock = (T_NULL == endBlock.tt);
                    
                    if ( hasInterior )
                    {
                        if ( alreadyIn && isEOLBlock && stream.sol() )
                        {
                            ayto.REQ = 0;
                            state.inBlock = null;
                            state.endBlock = null;
                            return false;
                        }
                        
                        if ( !alreadyIn )
                        {
                            state.stack.pushAt( stackPos, ayto.clone(), 'sID', thisBlock );
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
                                if ( hasInterior )
                                {
                                    if ( stream.pos > streamPos && streamPos > streamPos0 )
                                    {
                                        ret = thisBlockInterior;
                                        stream.bck2(streamPos);
                                        continueBlock = 1;
                                    }
                                    else
                                    {
                                        ret = thisBlock;
                                        ended = 1;
                                    }
                                }
                                else
                                {
                                    ret = thisBlock;
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
                        ret = (isEOLBlock) ? thisBlockInterior : thisBlock;
                    }
                    continueToNextLine = allowMultiline || (isEscapedBlock && charIsEscaped);
                    
                    if ( ended || (!continueToNextLine && !continueBlock) )
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    else
                    {
                        state.stack.pushAt( stackPos, ayto.clone(), 'sID', thisBlock );
                    }
                    
                    return ret;
                }
                
                //state.inBlock = null;
                //state.endBlock = null;
                return false;
            }
        }),
                
        RepeatedTokens = Class(SimpleToken, {
                
            constructor : function( type, name, tokens, min, max ) {
                var ayto = this;
                ayto.tt = type || T_REPEATED;
                ayto.id = name || null;
                ayto.tk = null;
                ayto.ts = null;
                ayto.min = min || 0;
                ayto.max = max || INF;
                ayto.found = 0;
                ayto.CLONE = ['ts', 'min', 'max', 'found'];
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
                    tokensRequired = 0, streamPos, stackPos, stackId;
                
                ayto.ERR = 0;
                ayto.REQ = 0;
                ayto.MTCH = 0;
                streamPos = stream.pos;
                stackPos = state.stack.pos();
                stackId = ayto.id+'_'+getId();
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone().req( 1 );
                    style = token.get(stream, state);
                    
                    if ( false !== style )
                    {
                        ++found;
                        if ( found <= max )
                        {
                            // push it to the stack for more
                            ayto.found = found;
                            state.stack.pushAt( stackPos, ayto.clone(), 'sID', stackId );
                            ayto.found = 0;
                            ayto.MTCH = token.MTCH;
                            return style;
                        }
                        break;
                    }
                    else if ( token.REQ )
                    {
                        tokensRequired++;
                    }
                    if ( token.ERR ) stream.bck2( streamPos );
                }
                
                ayto.REQ = found < min;
                ayto.ERR = found > max || (found < min && 0 < tokensRequired);
                return false;
            }
        }),
        
        EitherTokens = Class(RepeatedTokens, {
                
            constructor : function( type, name, tokens ) {
                this.$super('constructor', type, name, tokens, 1, 1);
            },
            
            get : function( stream, state ) {
            
                var ayto = this, style, token, i, tokens = ayto.ts, n = tokens.length, 
                    tokensRequired = 0, tokensErr = 0, streamPos;
                
                ayto.REQ = 1;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone().req( 1 );
                    style = token.get(stream, state);
                    
                    tokensRequired += (token.REQ) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        ayto.MTCH = token.MTCH;
                        return style;
                    }
                    else if ( token.ERR )
                    {
                        tokensErr++;
                        stream.bck2( streamPos );
                    }
                }
                
                ayto.REQ = (tokensRequired > 0);
                ayto.ERR = (n == tokensErr && tokensRequired > 0);
                return false;
            }
        }),

        AllTokens = Class(RepeatedTokens, {
                
            constructor : function( type, name, tokens ) {
                this.$super('constructor', type, name, tokens, 1, 1);
            },
            
            get : function( stream, state ) {
                
                var ayto = this, token, style, tokens = ayto.ts, n = tokens.length,
                    streamPos, stackPos, stackId;
                
                ayto.REQ = 1;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                streamPos = stream.pos;
                stackPos = state.stack.pos();
                token = tokens[ 0 ].clone().req( 1 );
                style = token.get(stream, state);
                stackId = ayto.id+'_'+getId();
                
                if ( false !== style )
                {
                    // not empty token
                    if ( true !== style )
                    {
                        for (var i=n-1; i>0; i--)
                            state.stack.pushAt( stackPos+n-i-1, tokens[ i ].clone().req( 1 ), 'sID', stackId );
                    }
                        
                    ayto.MTCH = token.MTCH;
                    return style;
                }
                else if ( token.ERR /*&& token.REQ*/ )
                {
                    ayto.ERR = 1;
                    stream.bck2( streamPos );
                }
                else if ( token.REQ )
                {
                    ayto.ERR = 1;
                }
                
                return false;
            }
        }),
                
        NGramToken = Class(RepeatedTokens, {
                
            constructor : function( type, name, tokens ) {
                this.$super('constructor', type, name, tokens, 1, 1);
            },
            
            get : function( stream, state ) {
                
                var ayto = this, token, style, tokens = ayto.ts, n = tokens.length, 
                    streamPos, stackPos, stackId, i;
                
                ayto.REQ = 0;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                streamPos = stream.pos;
                stackPos = state.stack.pos();
                token = tokens[ 0 ].clone().req( 0 );
                style = token.get(stream, state);
                stackId = ayto.id+'_'+getId();
                
                if ( false !== style )
                {
                    // not empty token
                    if ( true !== style )
                    {
                        for (i=n-1; i>0; i--)
                            state.stack.pushAt( stackPos+n-i-1, tokens[ i ].clone().req( 1 ), 'sID', stackId );
                    }
                    
                    ayto.MTCH = token.MTCH;
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
            
            var tok, token = null, type, combine, matchAction, matchType, tokens, subTokenizers,
                ngrams, ngram, i, l, j, l2;
            
            if ( null === tokenID )
            {
                // EOL Tokenizer
                return new SimpleToken( T_EOL, 'EOL', tokenID );
            }
            
            else if ( "" === tokenID )
            {
                // NONSPACE Tokenizer
                return new SimpleToken( T_NONSPACE, 'NONSPACE', tokenID );
            }
            
            else if ( false === tokenID || 0 === tokenID )
            {
                // EMPTY Tokenizer
                return new SimpleToken( T_EMPTY, 'EMPTY', tokenID );
            }
            
            else
            {
                tokenID = '' + tokenID;
                
                if ( !cachedTokens[ tokenID ] )
                {
                    // allow token to be literal and wrap to simple token with default style
                    tok = Lex[ tokenID ] || Syntax[ tokenID ] || { type: "simple", tokens: tokenID };
                    
                    if ( tok )
                    {
                        // tokens given directly, no token configuration object, wrap it
                        if ( (T_STR | T_ARRAY) & get_type( tok ) )
                        {
                            tok = { type: "simple", tokens: tok };
                        }
                        
                        // allow tokens to extend / reference other tokens
                        while ( tok['extend'] )
                        {
                            var xtends = tok['extend'], xtendedTok = Lex[xtends] || Syntax[xtends];
                            delete tok['extend'];
                            if ( xtendedTok ) 
                            {
                                // tokens given directly, no token configuration object, wrap it
                                if ( (T_STR | T_ARRAY) & get_type( xtendedTok ) )
                                {
                                    xtendedTok = { type: "simple", tokens: xtendedTok };
                                }
                                tok = extend(xtendedTok, tok);
                            }
                            // xtendedTok may in itself extebnd another tok and so on,
                            // loop and get all references
                        }
                        
                        // provide some defaults
                        type = (tok.type) ? tokenTypes[ tok.type.toUpperCase().replace('-', '').replace('_', '') ] : T_SIMPLE;
                        
                        if ( T_SIMPLE & type )
                        {
                            if ( "" === tok.tokens )
                            {
                                // NONSPACE Tokenizer
                                token = new SimpleToken( T_NONSPACE, tokenID, tokenID );
                                // pre-cache tokenizer to handle recursive calls to same tokenizer
                                cachedTokens[ tokenID ] = token;
                                return token;
                            }
                            else if ( null === tok.tokens )
                            {
                                // EOL Tokenizer
                                token = new SimpleToken( T_EOL, tokenID, tokenID );
                                // pre-cache tokenizer to handle recursive calls to same tokenizer
                                cachedTokens[ tokenID ] = token;
                                return token;
                            }
                            else if ( false === tok.tokens || 0 === tok.tokens )
                            {
                                // EMPTY Tokenizer
                                token = new SimpleToken( T_EMPTY, tokenID, tokenID );
                                // pre-cache tokenizer to handle recursive calls to same tokenizer
                                cachedTokens[ tokenID ] = token;
                                return token;
                            }
                        }
            
                        tok.tokens = make_array( tok.tokens );
                        
                        if ( T_SIMPLE & type )
                        {
                            if ( tok.autocomplete ) getAutoComplete(tok, tokenID, keywords);
                            
                            matchAction = null;
                            if ( tok.push )
                            {
                                matchAction = [ "push", tok.push ];
                            }
                            else if  ( 'undefined' != typeof(tok.pop) )
                            {
                                matchAction = [ "pop", tok.pop ];
                            }
                            
                            // combine by default if possible using word-boundary delimiter
                            combine = ( 'undefined' ==  typeof(tok.combine) ) ? "\\b" : tok.combine;
                            token = new SimpleToken( T_SIMPLE, tokenID,
                                        getCompositeMatcher( tokenID, tok.tokens.slice(), RegExpID, combine, cachedRegexes, cachedMatchers )
                                    );
                            
                            token.tm = matchAction;
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                        }
                        
                        else if ( T_BLOCK & type )
                        {
                            if ( T_COMMENT & type ) getComments(tok, comments);

                            token = new BlockToken( type, tokenID,
                                        getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
                                        tok.multiline,
                                        tok.escape,
                                        // allow block delims / block interior to have different styles
                                        Style[ tokenID + '.inside' ] ? 1 : 0
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
                                token = new RepeatedTokens(T_REPEATED, tokenID, null, tok.match[0], tok.match[1]);
                            }
                            else
                            {
                                matchType = groupTypes[ tok.match.toUpperCase() ]; 
                                
                                if (T_ZEROORONE == matchType) 
                                    token = new RepeatedTokens(T_ZEROORONE, tokenID, null, 0, 1);
                                
                                else if (T_ZEROORMORE == matchType) 
                                    token = new RepeatedTokens(T_ZEROORMORE, tokenID, null, 0, INF);
                                
                                else if (T_ONEORMORE == matchType) 
                                    token = new RepeatedTokens(T_ONEORMORE, tokenID, null, 1, INF);
                                
                                else if (T_EITHER & matchType) 
                                    token = new EitherTokens(T_EITHER, tokenID, null);
                                
                                else //if (T_ALL == matchType)
                                    token = new AllTokens(T_ALL, tokenID, null);
                            }
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            subTokenizers = [];
                            for (i=0, l=tokens.length; i<l; i++)
                                subTokenizers = subTokenizers.concat( getTokenizer( tokens[i], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) );
                            
                            token.set( subTokenizers );
                            
                        }
                        
                        else if ( T_NGRAM & type )
                        {
                            // get n-gram tokenizer
                            token = make_array_2( tok.tokens.slice() ).slice(); // array of arrays
                            ngrams = [];
                            
                            for (i=0, l=token.length; i<l; i++)
                            {
                                // get tokenizers for each ngram part
                                ngrams[i] = token[i].slice();
                                // get tokenizer for whole ngram
                                token[i] = new NGramToken( T_NGRAM, tokenID + '_NGRAM_' + i, null );
                            }
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            for (i=0, l=token.length; i<l; i++)
                            {
                                ngram = ngrams[i];
                                
                                subTokenizers = [];
                                for (j=0, l2=ngram.length; j<l2; j++)
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
            grammar.Extra = grammar.Extra || {};
            
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
        Parser = Class({
            
            constructor: function(grammar, LOC) {
                var ayto = this;
                
                // support extra functionality
                ayto.Extra = grammar.Extra || {};
                
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
                ayto.Style = grammar.Style;
            },
            
            Extra: null,
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
            Style: null,
            
            parse: function(code) {
                code = code || "";
                var lines = code.split(/\r\n|\r|\n/g), l = lines.length, i,
                    linetokens = [], tokens, state, stream;
                state = new State( );
                state.parseAll = 1;
                for (i=0; i<l; i++)
                {
                    stream = new Stream( lines[i] );
                    tokens = [];
                    while ( !stream.eol() )
                    {
                        tokens.push( this.getToken(stream, state) );
                        //stream.sft();
                    }
                    linetokens.push( tokens );
                }
                return linetokens;
            },
            
            // Codemirror Tokenizer compatible
            getToken: function(stream_, state) {
                
                var i, ci, ayto = this, tokenizer, type, 
                    interleavedCommentTokens = ayto.cTokens, tokens = ayto.Tokens, numTokens = tokens.length, 
                    parseAll = state.parseAll, stream, stack,
                    Style = ayto.Style, DEFAULT = ayto.DEF, ERROR = ayto.ERR, ret
                ;
                
                stream = (parseAll) ? stream_ : new Stream().fromStream( stream_ );
                stack = state.stack;
                /*
                var scopeOffset, lineOffset;
                //if ( stream.sol() ) 
                {
                    scopeOffset = state.col;
                    lineOffset = stream.ind();
                    if ( lineOffset > scopeOffset ) 
                    {
                        state.col = lineOffset;
                        state.indent = T_INDENT;
                    } 
                    else if ( lineOffset < scopeOffset ) 
                    {
                        state.col = lineOffset;
                        state.indent = T_DEDENT;
                    }
                    console.log([state.indent, state.col, stream.toString()]);
                }
                */
                
                // if EOL tokenizer is left on stack, pop it now
                if ( !stack.isEmpty() && T_EOL == stack.peek().tt && stream.sol() ) 
                {
                    stack.pop();
                }
                
                // check for non-space tokenizer before parsing space
                if ( (stack.isEmpty() || (T_NONSPACE != stack.peek().tt)) && stream.spc() )
                {
                    return (parseAll) ? { value: stream.cur(1), type: DEFAULT, error: null } : state.t = DEFAULT;
                }
                
                while ( !stack.isEmpty() && !stream.eol() )
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
                                type = Style[type] || DEFAULT;
                                return (parseAll) ? { value: stream.cur(1), type: type, error: null } : state.t = type;
                            }
                        }
                    }
                    
                    tokenizer = stack.pop();
                    type = tokenizer.get(stream, state);
                    
                    // match failed
                    if ( false === type )
                    {
                        // error
                        if ( tokenizer.ERR || tokenizer.REQ )
                        {
                            // empty the stack
                            stack.empty('sID', tokenizer.sID);
                            // skip this character
                            stream.nxt();
                            // generate error
                            state.t = type = ERROR;
                            return (parseAll) ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.t = ERROR;
                        }
                        // optional
                        else
                        {
                            continue;
                        }
                    }
                    // found token (not empty)
                    else if ( true !== type )
                    {
                        type = Style[type] || DEFAULT;
                        // match action error
                        if ( tokenizer.MTCH )
                        {
                            // empty the stack
                            stack.empty('sID', tokenizer.sID);
                            // generate error
                            state.t = type = ERROR;
                            return (parseAll) ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.t = ERROR;
                        }
                        else
                        {
                            return (parseAll) ? { value: stream.cur(1), type: type, error: null } : state.t = type;
                        }
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
                        if ( tokenizer.ERR || tokenizer.REQ )
                        {
                            // empty the stack
                            stack.empty('sID', tokenizer.sID);
                            // skip this character
                            stream.nxt();
                            // generate error
                            state.t = type = ERROR;
                            return (parseAll) ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.t = ERROR;
                        }
                        // optional
                        else
                        {
                            continue;
                        }
                    }
                    // found token (not empty)
                    else if ( true !== type )
                    {
                        type = Style[type] || DEFAULT;
                        // match action error
                        if ( tokenizer.MTCH )
                        {
                            // empty the stack
                            stack.empty('sID', tokenizer.sID);
                            // generate error
                            state.t = type = ERROR;
                            return (parseAll) ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.t = ERROR;
                        }
                        else
                        {
                            return (parseAll) ? { value: stream.cur(1), type: type, error: null } : state.t = type;
                        }
                    }
                }
                
                // unknown, bypass
                stream.nxt();
                state.t = DEFAULT;
                return (parseAll) ? { value: stream.cur(1), type: DEFAULT, error: null } : state.t = DEFAULT;
            },
            
            indent : function(state, textAfter, fullLine, conf, parserConf) {
                var indentUnit = conf.indentUnit || 4, Pass = _CodeMirror.Pass;
                
                return Pass;
            }
        }),
        
        getCodemirrorMode = function(parser) {
                
            // Codemirror-compatible Mode
            var modeF = function(conf, parserConf) {
                
                //var supportGrammarAnnotations = conf ? conf.supportGrammarAnnotations : false;
                
                // return the (codemirror) parser mode for the grammar
                var mode = {
                    /*
                    // maybe needed in later versions..
                    
                    blankLine: function( state ) { },
                    
                    innerMode: function( state ) { },
                    */
                    
                    startState: function( ) { return new State(); },
                    
                    copyState: function( state ) { return state.clone(); },
                    
                    token: function(stream, state) { return parser.getToken(stream, state); },
                    
                    indent: function(state, textAfter, fullLine) { return parser.indent(state, textAfter, fullLine, conf, parserConf); },
                    
                    // syntax, lint-like validator generated from grammar
                    // maybe use this as a worker (a-la ACE) ??
                    validator: function (text, options)  {
                        
                        if ( !modeF.supportGrammarAnnotations ) return [];
                        
                        var errorFound = 0, code = text, errors, linetokens, tokens, token, t, lines, line, row, column;
                        if ( !code || !code.length ) return [];
                        
                        errors = [];
                        linetokens = parser.parse( code );
                        lines = linetokens.length;
                        
                        for (line=0; line<lines; line++) 
                        {
                            tokens = linetokens[ line ];
                            if ( !tokens || !tokens.length ) continue;
                            
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
                        if ( errorFound ) return errors;
                        else  return [];
                    }
                };
                
                // support comments toggle functionality
                mode.lineComment = parser.LC,
                mode.blockCommentStart = parser.BCS,
                mode.blockCommentEnd = parser.BCE,
                mode.blockCommentContinue = parser.BCC,
                mode.blockCommentLead = parser.BCL
                // support extra functionality defined in grammar
                // eg. code folding, electriChars etc..
                mode.electricChars = parser.Extra.electricChars || false;
                mode.fold = parser.Extra.fold || false;
                
                return mode;
                
            };
            return modeF;
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
            
            return getCodemirrorMode( new Parser(grammar, LOCALS) );
        }
    ;
  /**
*
*   CodeMirrorGrammar
*   @version: 0.9.3
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
    var CodeMirrorGrammar = exports['CodeMirrorGrammar'] = {
        
        VERSION : "0.9.3",
        
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
    /* export the module */
    return exports["CodeMirrorGrammar"];
});