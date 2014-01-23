    
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
