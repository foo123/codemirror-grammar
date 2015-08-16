
var undef = undefined, 
    PROTO = 'prototype', HAS = 'hasOwnProperty', IS_ENUM = 'propertyIsEnumerable',
    Keys = Object.keys, AP = Array[PROTO], OP = Object[PROTO], FP = Function[PROTO],
    toString = OP.toString,
    
    // types
    T_NUM = 4, T_INF = 5, T_NAN = 6, T_BOOL = 8,
    T_STR = 16, T_CHAR = 17, T_CHARLIST = 18,
    T_ARRAY = 32, T_OBJ = 64, T_FUNC = 128,  T_REGEX = 256, T_DATE = 512,
    T_NULL = 1024, T_UNDEF = 2048, T_UNKNOWN = 4096,
    T_STR_OR_ARRAY = T_STR|T_ARRAY, T_OBJ_OR_ARRAY = T_OBJ|T_ARRAY,
    STRING_TYPE = {
        "[object Number]"   : T_NUM,
        "[object String]"   : T_STR,
        "[object Array]"    : T_ARRAY,
        "[object RegExp]"   : T_REGEX,
        "[object Date]"     : T_DATE,
        "[object Function]" : T_FUNC,
        "[object Object]"   : T_OBJ
    },
    get_type = function( v ) {
        if      ( null === v )                return T_NULL;
        else if ( true === v || false === v || 
                       v instanceof Boolean ) return T_BOOL;
        else if ( undef === v )               return T_UNDEF;
        var TYPE = STRING_TYPE[ toString.call( v ) ] || T_UNKNOWN;
        if      ( T_NUM === TYPE   || v instanceof Number )   return isNaN(v) ? T_NAN : (isFinite(v) ? T_NUM : T_INF);
        else if ( T_STR === TYPE   || v instanceof String )   return 1 === v.length ? T_CHAR : T_STR;
        else if ( T_ARRAY === TYPE || v instanceof Array )    return T_ARRAY;
        else if ( T_REGEX === TYPE || v instanceof RegExp )   return T_REGEX;
        else if ( T_DATE === TYPE  || v instanceof Date )     return T_DATE;
        else if ( T_FUNC === TYPE  || v instanceof Function ) return T_FUNC;
        else if ( T_OBJ === TYPE )                            return T_OBJ;
                                                              return T_UNKNOWN;
    },
    
    Merge = function(/* var args here.. */) { 
        var args = arguments, argslen = args.length, 
            o, o2, v, p, i, T;
        o = args[0] || {}; 
        for (i=1; i<argslen; i++)
        {
            o2 = args[ i ];
            if ( T_OBJ === get_type( o2 ) )
            {
                for (p in o2)
                {            
                    if ( !o2[HAS](p) || !o2[IS_ENUM](p) ) continue;
                    
                    v = o2[p]; T = get_type( v );
                    
                    // shallow copy for numbers, better ??
                    if ( T_NUM & T ) o[p] = 0 + v;  
                    
                    // shallow copy for arrays or strings, better ??
                    else if ( T_STR_OR_ARRAY & T ) o[p] = v.slice();  
                    
                    // just reference copy
                    else o[p] = v;  
                }
            }
        }
        return o;
    },
    
    Extend = Object.create,
    
    Class = function( O, C ) {
        var argslen = arguments.length, ctor, CTOR = 'constructor';
        if ( 0 === argslen ) 
        {
            O = Object;
            C = { };
        }
        else if ( 1 === argslen ) 
        {
            C = O || { };
            O = Object;
        }
        else
        {
            O = O || Object;
            C = C || { };
        }
        if ( !C[HAS](CTOR) ) C[CTOR] = function( ){ };
        ctor = C[CTOR]; delete C[CTOR];
        ctor[PROTO] = Merge( Extend(O[PROTO]), C );
        ctor[PROTO][CTOR] = ctor;
        return ctor;
    },
    
    make_array = function( a, force ) {
        return ( force || T_ARRAY !== get_type( a ) ) ? [ a ] : a;
    },
    
    make_array_2 = function( a, force ) {
        a = make_array( a );
        if ( force || T_ARRAY !== get_type( a[0] ) ) a = [ a ]; // array of arrays
        return a;
    },
    
    clone = function( o, deep ) {
        var T = get_type( o ), T2, co, k, l;
        deep = false !== deep;
        
        if ( T_OBJ === T )
        {
            co = { };
            for (k in o) 
            {
                if ( !o[HAS](k) || !o[IS_ENUM](k) ) continue;
                T2 = get_type( o[k] );
                
                if ( T_OBJ === T2 )         co[k] = deep ? clone( o[k], deep ) : o[k];
                else if ( T_ARRAY === T2 )  co[k] = deep ? clone( o[k], deep ) : o[k].slice();
                else if ( T_STR & T2 )      co[k] = o[k].slice();
                else if ( T_NUM & T2 )      co[k] = 0 + o[k];
                else                        co[k] = o[k]; 
            }
        }
        else if ( T_ARRAY === T )
        {
            l = o.length;
            co = new Array(l);
            for (k=0; k<l; k++)
            {
                T2 = get_type( o[k] );
                
                if ( T_OBJ === T2 )         co[k] = deep ? clone( o[k], deep ) : o[k];
                else if ( T_ARRAY === T2 )  co[k] = deep ? clone( o[k], deep ) : o[k].slice();
                else if ( T_STR & T2 )      co[k] = o[k].slice();
                else if ( T_NUM & T2 )      co[k] = 0 + o[k];
                else                        co[k] = o[k]; 
            }
        }
        else if ( T_STR & T )
        {
            co = o.slice();
        }
        else if ( T_NUM & T )
        {
            co = 0 + o;
        }
        else
        {
            co = o;
        }
        return co;
    },
    
    extend = function( ) {
        var args = arguments, argslen = args.length, 
            o2, o, i, k, j, l, a, a2, T, T2;
        
        if ( argslen < 1 ) return null;
        
        o = clone( args[0] ); 
        
        for (i=1; i<argslen; i++)
        {
            o2 = args[i];
            if ( !o2 ) continue;
            
            for (k in o2) 
            { 
                if ( !o2[HAS](k) || !o2[IS_ENUM](k) ) continue;
                if ( o[HAS](k) && o[IS_ENUM](k) ) 
                { 
                    T = get_type( o[k] ); T2 = get_type( o2[k] );
                    if ( T_OBJ === T && T_OBJ === T2 )
                    {
                        o[k] = extend( o[k], o2[k] );
                    }
                    else if ( T_ARRAY === T && T_ARRAY === T2 )
                    {
                        a = o[k]; a2 = o2[k]; l = a2.length;
                        if ( !l ) continue;
                        else if ( !a.length )
                        {
                            o[k] = a2.slice();
                        }
                        else
                        {
                            for (j=0; j<l; j++)
                            {
                                if ( 0 > a.indexOf( a2[j] ) ) 
                                    a.push( a2[j] );
                            }
                        }
                    }
                }
                else
                {
                    o[k] = clone( o2[k] );
                }
            }
        }
        return o;
    },
    
    escaped_re = /([.*+?^${}()|[\]\/\\\-])/g,
    esc_re = function( s ) {
        return s.replace(escaped_re, '\\$1');
    },
    
    replacement_re = /\$(\d{1,2})/g,
    group_replace = function( pattern, token ) {
        var parts, i, l, replacer;
        replacer = function(m, d){
            // the regex is wrapped in an additional group, 
            // add 1 to the requested regex group transparently
            return token[ 1 + parseInt(d, 10) ];
        };
        parts = pattern.split('$$');
        l = parts.length;
        for (i=0; i<l; i++) parts[i] = parts[i].replace(replacement_re, replacer);
        return parts.join('$');
    },
    
    trim_re = /^\s+|\s+$/g,
    trim = String[PROTO].trim
        ? function( s ){ return s.trim(); }
        : function( s ){ return s.replace(trim_re, ''); },
        
    by_length = function( a, b ) { 
        return b.length - a.length 
    },
    
    newline_re = /\r\n|\r|\n/g, dashes_re = /[\-_]/g, 
    peg_bnf_notation_re = /^([\[\]{}()*+?|'"]|\s)/,
    
    has_prefix = function(s, id) {
        return (
            (T_STR & get_type(id)) && (T_STR & get_type(s)) && id.length &&
            id.length <= s.length && id == s.substr(0, id.length)
        );
    },
    
    get_re = function(r, rid, cachedRegexes)  {
        if ( !r || (T_NUM === get_type(r)) ) return r;
        
        var l = (rid) ? (rid.length||0) : 0, i;
        
        if ( l && rid == r.substr(0, l) ) 
        {
            var regexSource = r.substr(l), delim = regexSource[0], flags = '',
                regexBody, regexID, regex, chars, i, ch
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
                /*chars = new RegexAnalyzer( regex ).peek();
                if ( null !== chars.peek && !Keys(chars.peek).length )  chars.peek = null;
                if ( null !== chars.negativepeek && !Keys(chars.negativepeek).length )  chars.negativepeek = null;*/
                // remove RegexAnalyzer dependency
                chars = {peek:null,negativepeek:null};
                
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
    
    get_combined_re = function(tokens, boundary)  {
        var peek = { }, i, l, b = "", bT = get_type(boundary);
        if ( T_STR === bT || T_CHAR === bT ) b = boundary;
        var combined = tokens
                    .sort(by_length)
                    .map(function( t ) {
                        peek[ t.charAt(0) ] = 1;
                        return esc_re( t );
                    })
                    .join("|")
                ;
        return [ new RegExp("^(" + combined + ")"+b), { peek: peek, negativepeek: null }, 1 ];
    },
    
    _id_ = 0, 
    get_id = function( ) { return ++_id_; },
    uuid = function( ns ) { return [ns||'uuid', ++_id_, new Date().getTime()].join('_'); }
;
