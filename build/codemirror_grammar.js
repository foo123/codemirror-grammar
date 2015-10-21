/**
*
*   CodeMirrorGrammar
*   @version: 2.5.0
*
*   Transform a grammar specification in JSON format, into a syntax-highlight parser mode for CodeMirror
*   https://github.com/foo123/codemirror-grammar
*
**/!function( root, name, factory ) {
"use strict";

//
// export the module, umd-style (no other dependencies)
var isCommonJS = ("object" === typeof(module)) && module.exports, 
    isAMD = ("function" === typeof(define)) && define.amd, m;

// CommonJS, node, etc..
if ( isCommonJS ) 
    module.exports = (module.$deps = module.$deps || {})[ name ] = module.$deps[ name ] || (factory.call( root, {NODE:module} ) || 1);

// AMD, requireJS, etc..
else if ( isAMD && ("function" === typeof(require)) && ("function" === typeof(require.specified)) && require.specified(name) ) 
    define( name, ['require', 'exports', 'module'], function( require, exports, module ){ return factory.call( root, {AMD:module} ); } );

// browser, web worker, etc.. + AMD, other loaders
else if ( !(name in root) ) 
    (root[ name ] = (m=factory.call( root, {} ) || 1)) && isAMD && define( name, [], function( ){ return m; } );

}(  /* current root */          this, 
    /* module name */           "CodeMirrorGrammar",
    /* module factory */        function( exports ) {
    
/* main code starts here */

"use strict";

//
// types
var    
TOKENS = 1, ERRORS = 2, FLAT = 32, REQUIRED = 4, ERROR = 8,
CLEAR_REQUIRED = ~REQUIRED, CLEAR_ERROR = ~ERROR, REQUIRED_OR_ERROR = REQUIRED | ERROR,

// action types
A_ERROR = 4,
A_INDENT = 8,
A_OUTDENT = 16,
A_CTXSTART = 32,
A_CTXEND = 64,
A_MCHSTART = 128,
A_MCHEND = 256,
A_UNIQUE = 512,

// pattern types
P_SIMPLE = 2,
P_COMPOSITE = 4,
P_BLOCK = 8,

// token types
T_ACTION = 4,
T_SOF = 8, T_EOL = 16/*=T_NULL*/, T_SOL = 32, T_EOF = 64,
T_EMPTY = 128, T_NONSPACE = 256,
T_SIMPLE = 512,
T_BLOCK = 1024, T_COMMENT = 1025,
T_ALTERNATION = 2048,
T_SEQUENCE = 4096,
T_REPEATED = 8192, T_ZEROORONE = 8193, T_ZEROORMORE = 8194, T_ONEORMORE = 8195,
T_NGRAM = 16384,
T_SEQUENCE_OR_NGRAM = T_SEQUENCE|T_NGRAM,
T_COMPOSITE = T_ALTERNATION|T_SEQUENCE|T_REPEATED|T_NGRAM,

// tokenizer types
tokenTypes = {
action: T_ACTION,
simple: T_SIMPLE,
block: T_BLOCK, comment: T_COMMENT,
alternation: T_ALTERNATION,
sequence: T_SEQUENCE,
repeat: T_REPEATED, zeroorone: T_ZEROORONE, zeroormore: T_ZEROORMORE, oneormore: T_ONEORMORE,
ngram: T_NGRAM
},

$T_SOF$ = '$|SOF|$', $T_SOL$ = '$|SOL|$', $T_EOL$ = '$|EOL|$', $T_NULL$ = '$|ENDLINE|$',
$T_EMPTY$ = '$|EMPTY|$', $T_NONSPACE$ = '$|NONSPACE|$'
//$T_SPACE$ = '$|SPACE|$'
;

var undef = undefined, 
    PROTO = 'prototype', HAS = 'hasOwnProperty', IS_ENUM = 'propertyIsEnumerable',
    OP = Object[PROTO], toString = OP.toString, Extend = Object.create,
    MAX = Math.max, MIN = Math.min, LOWER = 'toLowerCase', CHAR = 'charAt',
    
    // types
    INF = Infinity,
    T_UNKNOWN = 4, T_UNDEF = 8, T_NULL = 16,
    T_NUM = 32, T_INF = 33, T_NAN = 34, T_BOOL = 64,
    T_STR = 128, T_CHAR = 129, T_CHARLIST = 130,
    T_ARRAY = 256, T_OBJ = 512, T_FUNC = 1024,  T_REGEX = 2048, T_DATE = 4096,
    T_STR_OR_NUM = T_STR|T_NUM,
    T_STR_OR_ARRAY = T_STR|T_ARRAY,
    T_OBJ_OR_ARRAY = T_OBJ|T_ARRAY,
    T_REGEX_OR_ARRAY = T_REGEX|T_ARRAY,
    T_STR_OR_ARRAY_OR_REGEX = T_STR|T_ARRAY|T_REGEX,
    TYPE_STRING = {
    "[object Number]"   : T_NUM,
    "[object String]"   : T_STR,
    "[object Array]"    : T_ARRAY,
    "[object RegExp]"   : T_REGEX,
    "[object Date]"     : T_DATE,
    "[object Function]" : T_FUNC,
    "[object Object]"   : T_OBJ
    },
    
    trim_re = /^\s+|\s+$/g,
    trim = String[PROTO].trim
        ? function( s ){ return s.trim(); }
        : function( s ){ return s.replace(trim_re, ''); },
        
    by_length = function( a, b ) { 
        return b.length - a.length 
    },
    
    newline_re = /\r\n|\r|\n/g, dashes_re = /[\-_]/g, 
    _id_ = 0
;

function get_type( v )
{
    var T = 0;
    if      ( null === v )                T = T_NULL;
    else if ( true === v || false === v || 
                   v instanceof Boolean ) T = T_BOOL;
    else if ( undef === v )               T = T_UNDEF;
    else
    {
    T = TYPE_STRING[ toString.call( v ) ] || T_UNKNOWN;
    if      ( T_NUM === T   || v instanceof Number )   T = isNaN(v) ? T_NAN : (isFinite(v) ? T_NUM : T_INF);
    else if ( T_STR === T   || v instanceof String )   T = 1 === v.length ? T_CHAR : T_STR;
    else if ( T_ARRAY === T || v instanceof Array )    T = T_ARRAY;
    else if ( T_REGEX === T || v instanceof RegExp )   T = T_REGEX;
    else if ( T_DATE === T  || v instanceof Date )     T = T_DATE;
    else if ( T_FUNC === T  || v instanceof Function ) T = T_FUNC;
    else if ( T_OBJ === T )                            T = T_OBJ;
    else                                               T = T_UNKNOWN;
    }
    return T;
}
    
function map( x, F, i0, i1 )
{
    var len = x.length, i, k, l, r, q, Fx;
    if ( arguments.length < 4 ) i1 = len-1;
    if ( 0 > i1 ) i1 += len;
    if ( arguments.length < 3 ) i0 = 0;
    if ( i0 > i1 ) return [];
    else if ( i0 === i1 ) { return [F(x[i0], i0, i0, i1)]; }
    l = i1-i0+1; Fx = new Array(l);
    if ( 6 > l)
    {
        Fx[0] = F(x[i0], i0, i0, i1); Fx[1] = F(x[i0+1], i0+1, i0, i1);
        for (k=i0+2; k<=i1; k++) Fx[k-i0] = F(x[k], k, i0, i1);
        return Fx;
    }
    r=l&15; q=r&1; if ( q ) Fx[0] = F(x[i0], i0, i0, i1);
    for (i=q; i<r; i+=2)
    { 
        k = i0+i;
        Fx[i  ] = F(x[k  ], k  , i0, i1);
        Fx[i+1] = F(x[k+1], k+1, i0, i1);
    }
    for (i=r; i<l; i+=16)
    {
        k = i0+i;
        Fx[i  ] = F(x[k  ], k  , i0, i1);
        Fx[i+1] = F(x[k+1], k+1, i0, i1);
        Fx[i+2] = F(x[k+2], k+2, i0, i1);
        Fx[i+3] = F(x[k+3], k+3, i0, i1);
        Fx[i+4] = F(x[k+4], k+4, i0, i1);
        Fx[i+5] = F(x[k+5], k+5, i0, i1);
        Fx[i+6] = F(x[k+6], k+6, i0, i1);
        Fx[i+7] = F(x[k+7], k+7, i0, i1);
        Fx[i+8] = F(x[k+8], k+8, i0, i1);
        Fx[i+9] = F(x[k+9], k+9, i0, i1);
        Fx[i+10] = F(x[k+10], k+10, i0, i1);
        Fx[i+11] = F(x[k+11], k+11, i0, i1);
        Fx[i+12] = F(x[k+12], k+12, i0, i1);
        Fx[i+13] = F(x[k+13], k+13, i0, i1);
        Fx[i+14] = F(x[k+14], k+14, i0, i1);
        Fx[i+15] = F(x[k+15], k+15, i0, i1);
    }
    return Fx;
}

function operate( x, F, F0, i0, i1 )
{
    var len = x.length, i, k, l, r, q, Fv = F0;
    if ( arguments.length < 5 ) i1 = len-1;
    if ( 0 > i1 ) i1 += len;
    if ( arguments.length < 4 ) i0 = 0;
    if ( i0 > i1 ) return Fv;
    else if ( i0 === i1 ) { return F(Fv,x[i0],i0); }
    l = i1-i0+1;
    if ( 6 > l)
    {
        Fv = F(F(Fv,x[i0],i0),x[i0+1],i0+1);
        for (k=i0+2; k<=i1; k++) Fv = F(Fv,x[k],k);
        return Fv;
    }
    r=l&15; q=r&1; if ( q ) Fv = F(Fv,x[i0],i0);
    for (i=q; i<r; i+=2)  { k = i0+i; Fv = F(F(Fv,x[k],k),x[k+1],k+1); }
    for (i=r; i<l; i+=16) { k = i0+i; Fv = F(F(F(F(F(F(F(F(F(F(F(F(F(F(F(F(Fv,x[k],k),x[k+1],k+1),x[k+2],k+2),x[k+3],k+3),x[k+4],k+4),x[k+5],k+5),x[k+6],k+6),x[k+7],k+7),x[k+8],k+8),x[k+9],k+9),x[k+10],k+10),x[k+11],k+11),x[k+12],k+12),x[k+13],k+13),x[k+14],k+14),x[k+15],k+15); }
    return Fv;
}

function iterate( F, i0, i1, F0 )
{
    if ( i0 > i1 ) return F0;
    else if ( i0 === i1 ) { F(i0, F0, i0, i1); return F0; }
    var l=i1-i0+1, i, k, r, q;
    if ( 6 > l)
    {
        F(i0, F0, i0, i1); F(i0+1, F0, i0, i1);
        for (k=i0+2; k<=i1; k++) F(k, F0, i0, i1);
        return F0;
    }
    r=l&15; q=r&1;
    if ( q ) F(i0, F0, i0, i1);
    for (i=q; i<r; i+=2)
    { 
        k = i0+i;
        F(  k, F0, i0, i1);
        F(++k, F0, i0, i1);
    }
    for (i=r; i<l; i+=16)
    {
        k = i0+i;
        F(  k, F0, i0, i1);
        F(++k, F0, i0, i1);
        F(++k, F0, i0, i1);
        F(++k, F0, i0, i1);
        F(++k, F0, i0, i1);
        F(++k, F0, i0, i1);
        F(++k, F0, i0, i1);
        F(++k, F0, i0, i1);
        F(++k, F0, i0, i1);
        F(++k, F0, i0, i1);
        F(++k, F0, i0, i1);
        F(++k, F0, i0, i1);
        F(++k, F0, i0, i1);
        F(++k, F0, i0, i1);
        F(++k, F0, i0, i1);
        F(++k, F0, i0, i1);
    }
    return F0;
}

function clone( o, deep )
{
    var T = get_type( o ), T2, co, k, l, level = 0;
    if ( T_NUM === get_type(deep) )
    {
        if ( 0 < deep )
        {
            level = deep;
            deep = true; 
        }
        else
        {
            deep = false;
        }
    }
    else
    {
        deep = false !== deep;
    }
    
    if ( T_OBJ === T )
    {
        co = { };
        for (k in o) 
        {
            if ( !o[HAS](k) || !o[IS_ENUM](k) ) continue;
            T2 = get_type( o[k] );
            
            if ( T_OBJ === T2 )         co[k] = deep ? clone( o[k], level>0 ? level-1 : deep ) : o[k];
            else if ( T_ARRAY === T2 )  co[k] = deep ? clone( o[k], level>0 ? level-1 : deep ) : o[k].slice();
            else if ( T_DATE === T2 )   co[k] = new Date(o[k]);
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
            
            if ( T_OBJ === T2 )         co[k] = deep ? clone( o[k], level>0 ? level-1 : deep ) : o[k];
            else if ( T_ARRAY === T2 )  co[k] = deep ? clone( o[k], level>0 ? level-1 : deep ) : o[k].slice();
            else if ( T_DATE === T2 )   co[k] = new Date(o[k]);
            else if ( T_STR & T2 )      co[k] = o[k].slice();
            else if ( T_NUM & T2 )      co[k] = 0 + o[k];
            else                        co[k] = o[k]; 
        }
    }
    else if ( T_DATE === T )
    {
        co = new Date(o);
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
}

function extend(/* var args here.. */)
{
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
}
    
function make_array( a, force )
{
    return ( force || T_ARRAY !== get_type( a ) ) ? [ a ] : a;
}

function make_array_2( a, force )
{
    a = make_array( a );
    if ( force || T_ARRAY !== get_type( a[0] ) ) a = [ a ]; // array of arrays
    return a;
}

function has_prefix( s, p )
{
    return (
        (T_STR & get_type(p)) && (T_STR & get_type(s)) && p.length &&
        p.length <= s.length && p === s.substr(0, p.length)
    );
}

/*function peek( stack, index )
{
    index = 2 > arguments.length ? -1 : index;
    if ( stack.length )
    {
        if ( (0 > index) && (0 <= stack.length+index) )
            return stack[ stack.length + index ];
        else if ( 0 <= index && index < stack.length )
            return stack[ index ];
    }
}*/

function push_at( stack, pos, token, $id, id )
{
    if ( $id && id ) token[$id] = id;
    if ( pos < stack.length ) stack.splice( pos, 0, token );
    else stack.push( token );
    return stack;
}

function empty( stack, $id, id )
{
    if ( $id && id )
        while ( stack.length && stack[stack.length-1] && stack[stack.length-1][$id] === id ) stack.pop();
    else
        stack.length = 0;
    return stack;
}

function del( o, p, soft )
{
    if ( soft ) o[p] = undef; else delete o[p];
    return o;
}

function get_id( ) { return ++_id_; }

function uuid( ns ) { return (ns||'uuid') + '_' + (++_id_) + '_' + (new Date().getTime()); }


function Merge(/* var args here.. */)
{ 
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
                
                // shallow copy for dates, better ??
                else if ( T_DATE & T ) o[p] = new Date(v);
                
                // shallow copy for arrays or strings, better ??
                else if ( T_STR_OR_ARRAY & T ) o[p] = v.slice();  
                
                // just reference copy
                else o[p] = v;  
            }
        }
    }
    return o;
}

function Class( O, C )
{
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
}
    

//
// tokenizer helpers
var escaped_re = /([.*+?^${}()|[\]\/\\\-])/g, peg_bnf_special_re = /^([.\[\]{}()*+?\/|'"]|\s)/;

function esc_re( s )
{
    return s.replace(escaped_re, '\\$1');
}

function new_re( re, fl )
{
    return new RegExp(re, fl||'');
}

function get_delimited( src, delim, esc, collapse_esc )
{
    var c, i=src.pos, l=src.length, s='', escaped, is_esc, esc_cnt, can_be_escaped=!!esc;
    if ( can_be_escaped )
    {
        collapse_esc = !!collapse_esc; escaped = false; esc_cnt = 0;
        while ( i<l )
        {
            c = src[CHAR](i++);
            if ( delim === c && !escaped ) break;
            is_esc = esc === c; escaped = !escaped && is_esc;
            if ( collapse_esc )
            {
                if ( is_esc ) esc_cnt++;
                if ( !is_esc || esc_cnt&2 )
                {
                    s += c;
                    esc_cnt = 0;
                }
            }
            else s += c;
        }
        if ( esc_cnt&2 ) s += esc;
    }
    else
    {
        while ( i<l )
        {
            c = src[CHAR](i++);
            if ( delim === c ) break;
            s += c;
        }
    }
    src.pos = i;
    return s;
}

function group_replace( pattern, token, raw )
{
    var i, l, c, g, replaced, offset = true === raw ? 0 : 1;
    if ( T_STR & get_type(token) ) { token = [token, token, token]; offset = 0; }
    l = pattern.length; replaced = ''; i = 0;
    while ( i<l )
    {
        c = pattern[CHAR](i);
        if ( (i+1<l) && '$' === c )
        {
            g = pattern.charCodeAt(i+1);
            if ( 36 === g ) // escaped $ character
            {
                replaced += '$';
                i += 2;
            }
            else if ( 48 <= g && g <= 57 ) // group between 0 and 9
            {
                replaced += token[ offset + g - 48 ] || '';
                i += 2;
            }
            else
            {
                replaced += c;
                i += 1;
            }
        }
        else
        {
            replaced += c;
            i += 1;
        }
    }
    return replaced;
}

function get_re( r, rid, cachedRegexes )
{
    if ( !r || ((T_NUM|T_REGEX) & get_type(r)) ) return r;
    
    var l = rid ? (rid.length||0) : 0, i;
    
    if ( l && rid === r.substr(0, l) ) 
    {
        var regexSource = r.substr(l), delim = regexSource[CHAR](0), flags = '',
            regexBody, regexID, regex, i, ch
        ;
        
        // allow regex to have delimiters and flags
        // delimiter is defined as the first character after the regexID
        i = regexSource.length;
        while ( i-- )
        {
            ch = regexSource[CHAR](i);
            if ( delim === ch ) break;
            else if ('i' === ch.toLowerCase() ) flags = 'i';
        }
        regexBody = regexSource.substring(1, i);
        regexID = "^(" + regexBody + ")";
        
        if ( !cachedRegexes[ regexID ] )
        {
            regex = new_re( regexID, flags );
            // shared, light-weight
            cachedRegexes[ regexID ] = regex;
        }
        
        return cachedRegexes[ regexID ];
    }
    else
    {
        return r;
    }
}

function get_combined_re( tokens, boundary, case_insensitive )
{
    var b = "", combined;
    if ( T_STR & get_type(boundary) ) b = boundary;
    combined = map( tokens.sort( by_length ), esc_re ).join( "|" );
    return [ new_re("^(" + combined + ")"+b, case_insensitive ? "i": ""), 1 ];
}


function get_simplematcher( name, pattern, key, cachedMatchers ) 
{
    var T = get_type( pattern );
    
    if ( T_NUM === T ) return pattern;
    if ( cachedMatchers[ name ] ) return cachedMatchers[ name ];
    
    key = key || 0;
    var mtcher, is_char_list = 0;
    
    if ( pattern && pattern.isCharList ) { is_char_list = 1; del(pattern,'isCharList'); }
    
    // get a fast customized matcher for < pattern >
    if ( T_NULL === T ) mtcher = new matcher( P_SIMPLE, name, pattern, T_NULL, key );
    else if ( T_CHAR === T ) mtcher = new matcher( P_SIMPLE, name, pattern, T_CHAR, key );
    else if ( T_REGEX_OR_ARRAY & T ) mtcher = new matcher( P_SIMPLE, name, pattern, T_REGEX, key );
    else if ( T_STR & T ) mtcher = new matcher( P_SIMPLE, name, pattern, is_char_list ? T_CHARLIST : T_STR, key );
    else mtcher = pattern; // unknown
    
    return cachedMatchers[ name ] = mtcher;
}

function get_compositematcher( name, tokens, RegExpID, combined, caseInsensitive, cachedRegexes, cachedMatchers ) 
{
    if ( cachedMatchers[ name ] ) return cachedMatchers[ name ];
    
    var tmp, i, l, l2, array_of_arrays = 0, 
        has_regexs = 0, is_char_list = 1, 
        T1, T2, mtcher;
    
    tmp = make_array( tokens ); l = tmp.length;
    
    if ( 1 === l )
    {
        mtcher = get_simplematcher( name, get_re( tmp[0], RegExpID, cachedRegexes ), 0, cachedMatchers );
    }
    else if ( 1 < l /*combined*/ )
    {   
        l2 = (l>>>1) + 1;
        // check if tokens can be combined in one regular expression
        // if they do not contain sub-arrays or regular expressions
        for (i=0; i<=l2; i++)
        {
            T1 = get_type( tmp[i] ); T2 = get_type( tmp[l-1-i] );
            
            if ( (T_CHAR !== T1) || (T_CHAR !== T2) ) 
            {
                is_char_list = 0;
            }
            
            if ( (T_ARRAY & T1) || (T_ARRAY & T2) ) 
            {
                array_of_arrays = 1;
                //break;
            }
            else if ( (T_REGEX & T1) || (T_REGEX & T2) || 
                has_prefix( tmp[i], RegExpID ) || has_prefix( tmp[l-1-i], RegExpID ) )
            {
                has_regexs = 1;
                //break;
            }
        }
        
        if ( is_char_list && ( !combined || !( T_STR & get_type(combined) ) ) )
        {
            tmp = tmp.slice().join('');
            tmp.isCharList = 1;
            mtcher = get_simplematcher( name, tmp, 0, cachedMatchers );
        }
        else if ( combined && !(array_of_arrays || has_regexs) )
        {   
            mtcher = get_simplematcher( name, get_combined_re( tmp, combined, caseInsensitive ), 0, cachedMatchers );
        }
        else if ( array_of_arrays || has_regexs )
        {
            for (i=0; i<l; i++)
            {
                if ( T_ARRAY & get_type( tmp[i] ) )
                    tmp[i] = get_compositematcher( name + '_' + i, tmp[i], RegExpID, combined, caseInsensitive, cachedRegexes, cachedMatchers );
                else
                    tmp[i] = get_simplematcher( name + '_' + i, get_re( tmp[i], RegExpID, cachedRegexes ), i, cachedMatchers );
            }
            
            mtcher = l > 1 ? new matcher( P_COMPOSITE, name, tmp ) : tmp[0];
        }
        else /* strings */
        {
            tmp = tmp.sort( by_length );
            for (i=0; i<l; i++)
            {
                tmp[i] = get_simplematcher( name + '_' + i, get_re( tmp[i], RegExpID, cachedRegexes ), i, cachedMatchers );
            }
            
            mtcher = l > 1 ? new matcher( P_COMPOSITE, name, tmp ) : tmp[0];
        }
    }
    return cachedMatchers[ name ] = mtcher;
}

function get_blockmatcher( name, tokens, RegExpID, cachedRegexes, cachedMatchers ) 
{
    if ( cachedMatchers[ name ] ) return cachedMatchers[ name ];

    var tmp = make_array_2( tokens ), start = [], end = [];
    
    // build start/end mappings
    iterate(function( i ) {
        var t1, t2;
        t1= get_simplematcher( name + '_0_' + i, get_re( tmp[i][0], RegExpID, cachedRegexes ), i, cachedMatchers );
        if ( tmp[i].length > 1 )
        {
            if ( T_REGEX === t1.ptype && T_STR === get_type( tmp[i][1] ) && !has_prefix( tmp[i][1], RegExpID ) )
                t2 = tmp[i][1];
            else
                t2 = get_simplematcher( name + '_1_' + i, get_re( tmp[i][1], RegExpID, cachedRegexes ), i, cachedMatchers );
        }
        else
        {
            t2 = t1;
        }
        start.push( t1 );  end.push( t2 );
    }, 0, tmp.length-1);
    
    return cachedMatchers[ name ] = new matcher( P_BLOCK, name, [start, end] );
}

function get_comments( tok, comments ) 
{
    // build start/end mappings
    var tmp = make_array_2(tok.tokens.slice());
    iterate(function( i ) {
        var start = tmp[i][0],
            end = tmp[i].length>1 ? tmp[i][1] : tmp[i][0],
            lead = tmp[i].length>2 ? tmp[i][2] : "";
        
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
    }, 0, tmp.length-1);
}

function get_autocomplete( tok, type, keywords ) 
{
    var meta = tok.meta || type, case_insesitive = !!(tok.caseInsesitive||tok.ci),
        kws = map(make_array( tok.tokens ), function( word ) {
            return {word:word, meta:meta, ci:case_insesitive};
        });
    keywords.autocomplete = (keywords.autocomplete || []).concat( kws );
}

function preprocess_grammar( grammar )
{
    if ( !grammar.Lex ) grammar.Lex = {};
    if ( !grammar.Syntax ) grammar.Syntax = {};
    var id, type, t, tok, T, xtends, xtok, tl, tt,
        Lex = grammar.Lex, Syntax = grammar.Syntax, 
        conf = [Lex, Syntax], nG = conf.length, G, i, i1, i2, T1;
    
    // handle token-type annotations in token_ID
    i = 0;
    while ( i < nG )
    {
        G = conf[i++];
        for (t in G)
        {
            if ( !G[HAS](t) ) continue;
            id = t.split(':');
            type = id[1] && trim(id[1]).length ? trim(id[1]) : null;
            id = trim(id[0]);
            if ( !id.length ) { id=t; type=null; } // literal ':' token, bypass
            if ( id !== t )
            {
                G[id] = G[t]; del(G,t);
                if ( type )
                {
                    type = type[LOWER]();
                    tok = G[id]; T = get_type(tok);
                    if ( T_OBJ === T )
                    {
                        if ( !G[id].type ) G[id].type = type;
                    }
                    else
                    {
                        G[id] = {type:type};
                        if ( 'error' === type )
                        {
                            G[id].type = 'action';
                            G[id].error = tok;
                        }
                        else if ( 'group' === type )
                        {
                            G[id].type = 'sequence';
                            G[id].tokens = tok;
                        }
                        else if ( 'action' === type && T_STR === T )
                        {
                            G[id][tok] = true;
                        }
                        else
                        {                            
                            G[id].tokens = tok;
                        }
                    }
                }
            }
            if ( Lex === G )
            {
                if ( T_STR_OR_ARRAY_OR_REGEX & get_type(G[id]) )
                {
                    // simple token given as literal token, wrap it
                    G[id] = {type:"simple", tokens:G[id]};
                }
                //if ( !G[id].type ) G[id].type = 'simple';
                tok = G[id];
                
                if ( tok.type )
                {
                    tl = tok.type = tok.type[LOWER]();
                    
                    if ( 'line-block' === tl )
                    {
                        tok.type = 'block';
                        tok.multiline = false;
                        tok.escape = false;
                    }
                    else if ( 'escaped-line-block' === tl )
                    {
                        tok.type = 'block';
                        tok.multiline = false;
                        tok.escape = '\\';
                    }
                    else if ( 'escaped-block' === tl )
                    {
                        tok.type = 'block';
                        tok.multiline = true;
                        tok.escape = '\\';
                    }
                }
            }
        }
    }
    
    // handle token extensions in Lex, if any
    G = Lex;
    for (id in G)
    {
        if ( !G[HAS](id) ) continue;
        tok = G[id];
        // allow tokens to extend / reference other tokens
        while ( tok['extend'] )
        {
            xtends = tok['extend']; del(tok,'extend');
            xtok = Lex[ xtends ]/* || Syntax[ xtends ]*/;
            if ( xtok ) 
            {
                // tokens given directly, no token configuration object, wrap it
                if ( T_STR_OR_ARRAY_OR_REGEX & get_type( xtok ) )
                {
                    xtok = Lex[ xtends ] = {type:"simple", tokens:xtok};
                }
                //if ( !xtok.type ) xtok.type = 'simple';
                tok = extend( xtok, tok );
            }
            // xtok may in itself extend another tok and so on,
            // loop and get all references
        }
    }
    
    // handle Lex shorthands and defaults
    G = Lex;
    for (id in G)
    {
        if ( !G[HAS](id) ) continue;
        tok = G[id];
        if ( tok.type )
        {
            tl = tok.type = tok.type[LOWER]();
            if ( 'line-block' === tl )
            {
                tok.type = 'block';
                tok.multiline = false;
                tok.escape = false;
            }
            else if ( 'escaped-line-block' === tl )
            {
                tok.type = 'block';
                tok.multiline = false;
                tok.escape = '\\';
            }
            else if ( 'escaped-block' === tl )
            {
                tok.type = 'block';
                tok.multiline = true;
                tok.escape = '\\';
            }
        }
        else
        {
            if ( tok['escaped-line-block'] )
            {
                tok.type = "block";
                tok.multiline = false;
                if ( !tok.escape ) tok.escape = '\\';
                tok.tokens = tok['escaped-line-block'];
                del(tok,'escaped-line-block');
            }
            else if ( tok['escaped-block'] )
            {
                tok.type = "block";
                tok.multiline = true;
                if ( !tok.escape ) tok.escape = '\\';
                tok.tokens = tok['escaped-block'];
                del(tok,'escaped-block');
            }
            else if ( tok['line-block'] )
            {
                tok.type = "block";
                tok.multiline = false;
                tok.escape = false;
                tok.tokens = tok['line-block'];
                del(tok,'line-block');
            }
            else if ( tok['comment'] )
            {
                tok.type = "comment";
                tok.escape = false;
                tok.tokens = tok['comment'];
                del(tok,'comment');
            }
            else if ( tok['block'] )
            {
                tok.type = "block";
                tok.tokens = tok['block'];
                del(tok,'block');
            }
            else if ( tok['simple'] )
            {
                tok.type = "simple";
                tok.tokens = tok['simple'];
                del(tok,'simple');
            }
            else if ( tok['error'] )
            {
                tok.type = "action";
                tok.action = [ 'error', tok.error, !!tok['in-context'] ];
                del(tok,'error');
            }
            else if ( tok[HAS]('context') )
            {
                tok.type = "action";
                tok.action = [ !!tok.context ? 'context-start' : 'context-end', tok['context'], !!tok['in-context'] ];
                del(tok,'context');
            }
            else if ( tok['indent'] )
            {
                tok.type = "action";
                tok.action = [ 'indent', tok.indent, !!tok['in-context'] ];
                del(tok,'indent');
            }
            else if ( tok['outdent'] )
            {
                tok.type = "action";
                tok.action = [ 'outdent', tok.outdent, !!tok['in-context'] ];
                del(tok,'outdent');
            }
            else if ( tok['unique'] )
            {
                tok.type = "action";
                tok.action = [ 'unique', T_STR&get_type(tok.unique) ? ['_DEFAULT_', tok.unique] : tok.unique, !!tok['in-context'] ];
                del(tok,'unique');
            }
            else if ( tok['push'] )
            {
                tok.type = "action";
                tok.action = [ 'push', tok.push, !!tok['in-context'] ];
                del(tok,'push');
            }
            else if ( tok[HAS]('pop') )
            {
                tok.type = "action";
                tok.action = [ 'pop', tok.pop, !!tok['in-context'] ];
                del(tok,'pop');
            }
            else
            {
                tok.type = "simple";
            }
        }
        if ( 'action' === tok.type )
        {
            tok.ci = !!(tok.caseInsesitive||tok.ci);
        }
        else if ( 'block' === tok.type || 'comment' === tok.type )
        {
            tok.multiline = tok[HAS]('multiline') ? !!tok.multiline : true;
            if ( !(T_STR & get_type(tok.escape)) ) tok.escape = false;
        }
        else if ( 'simple' === tok.type )
        {
            tok.autocomplete = !!tok.autocomplete;
            tok.meta = tok.autocomplete && (T_STR & get_type(tok.meta)) ? tok.meta : null;
            tok.combine = !tok[HAS]('combine') ? "\\b" : tok.combine;
            tok.ci = !!(tok.caseInsesitive||tok.ci);
        }
    }
    
    // handle Syntax shorthands and defaults
    G = Syntax;
    for (id in G)
    {
        if ( !G[HAS](id) ) continue;
        tok = G[id];
        if ( T_OBJ === get_type(tok) && !tok.type )
        {
            if ( tok['ngram'] || tok['n-gram'] )
            {
                tok.type = "ngram";
                tok.tokens = tok['ngram'] || tok['n-gram'];
                if ( tok['n-gram'] ) del(tok,'n-gram'); else del(tok,'ngram');
            }
            else if ( tok['sequence'] || tok['all']  )
            {
                tok.type = "sequence";
                tok.tokens = tok['sequence'] || tok['all'];
                if ( tok['all'] ) del(tok,'all'); else del(tok,'sequence');
            }
            else if ( tok['alternation'] || tok['either'] )
            {
                tok.type = "alternation";
                tok.tokens = tok['alternation'] || tok['either'];
                if ( tok['either'] ) del(tok,'either'); else del(tok,'alternation');
            }
            else if ( tok['zeroOrOne'] )
            {
                tok.type = "zeroOrOne";
                tok.tokens = tok['zeroOrOne'];
                del(tok,'zeroOrOne');
            }
            else if ( tok['zeroOrMore'] )
            {
                tok.type = "zeroOrMore";
                tok.tokens = tok['zeroOrMore'];
                del(tok,'zeroOrMore');
            }
            else if ( tok['oneOrMore'] )
            {
                tok.type = "oneOrMore";
                tok.tokens = tok['oneOrMore'];
                del(tok,'oneOrMore');
            }
        }
        else if ( tok.type )
        {
            tl = tok.type = tok.type[LOWER]();
            if ( 'group' === tl && tok.match )
            {
                T = get_type(tok.match);
                if ( T_STR & T )
                {
                    tt = tok.match[LOWER]();
                    if ( 'alternation' === tt || 'either' === tt )
                    {
                        tok.type = 'alternation';
                        del(tok,'match');
                    }
                    else if ( 'sequence' === tt || 'all' === tt )
                    {
                        tok.type = 'sequence';
                        del(tok,'match');
                    }
                    else if ( 'zeroorone' === tt )
                    {
                        tok.type = 'zeroOrOne';
                        del(tok,'match');
                    }
                    else if ( 'zeroormore' === tt )
                    {
                        tok.type = 'zeroOrMore';
                        del(tok,'match');
                    }
                    else if ( 'oneormore' === tt )
                    {
                        tok.type = 'oneOrMore';
                        del(tok,'match');
                    }
                    else
                    {
                        tok.type = 'sequence';
                        del(tok,'match');
                    }
                }
                else if ( T_ARRAY & T )
                {
                    tok.type = "repeat";
                    tok.repeat = tok.match;
                    del(tok,'match');
                }
            }
            else if ( 'either' === tl )
            {
                tok.type = "alternation";
            }
            else if ( 'all' === tl )
            {
                tok.type = "sequence";
            }
        }
    }
    return grammar;
}

function get_backreference( token, Lex, Syntax, only_key )
{
    var entry;
    // handle trivial, back-references,
    // i.e a single token trivialy referencing another single token and so on..
    // until finding a non-trivial reference or none
    while ( T_STR & get_type(entry=Lex[token]||Syntax[token]) ) token = entry;
    return only_key ? token : Lex[token] || Syntax[token] || token;
}

function parse_peg_bnf_notation( tok, Lex, Syntax )
{
    var alternation, sequence, token, literal, repeat, entry, prev_entry,
        t, c, fl, prev_token, curr_token, stack, tmp,
        modifier = false, lookahead = false, modifier_preset;
    
    modifier_preset = !!tok.modifier ? tok.modifier : null;
    t = new String( trim(tok) ); t.pos = 0;
    
    if ( 1 === t.length )
    {
        curr_token = '' + tok;
        if ( !Lex[ curr_token ] && !Syntax[ curr_token ] ) Lex[ curr_token ] = { type:"simple", tokens:tok };
        tok = curr_token;
    }
    else
    {
        // parse PEG/BNF-like shorthand notations for syntax groups
        alternation = [ ]; sequence = [ ];
        token = ''; stack = [];
        while ( t.pos < t.length )
        {
            c = t[CHAR]( t.pos++ );
            
            if ( peg_bnf_special_re.test( c ) )
            {
                if ( token.length )
                {
                    if ( modifier )
                    {
                        // interpret as modifier / group / decorator
                        if ( sequence.length )
                        {
                            prev_token = sequence[sequence.length-1];
                            curr_token  = prev_token + '.' + token;
                            entry = Lex[curr_token] || Syntax[curr_token];
                            if ( !entry )
                            {
                                prev_entry = get_backreference( prev_token, Lex, Syntax );
                                // in case it is just string, wrap it, to maintain the modifier reference
                                Syntax[ curr_token ] = T_STR & get_type( prev_entry )
                                                    ? new String( prev_entry )
                                                    : clone( prev_entry );
                                Syntax[ curr_token ].modifier = token;
                            }
                            sequence[ sequence.length-1 ] = curr_token;
                        }
                        modifier = false;
                    }
                    else if ( '0' === token )
                    {
                        // interpret as empty tokenizer
                        if ( !Lex[$T_EMPTY$] ) Lex[$T_EMPTY$] = { type:"simple", tokens:0/*T_EMPTY*/ };
                        sequence.push( $T_EMPTY$ );
                    }
                    else if ( '^^' === token )
                    {
                        // interpret as SOF tokenizer
                        if ( !Lex[$T_SOF$] ) Lex[$T_SOF$] = { type:"simple", tokens:T_SOF };
                        sequence.push( $T_SOF$ );
                    }
                    else if ( '^' === token )
                    {
                        // interpret as SOL tokenizer
                        if ( !Lex[$T_SOL$] ) Lex[$T_SOL$] = { type:"simple", tokens:T_SOL };
                        sequence.push( $T_SOL$ );
                    }
                    else if ( '$' === token )
                    {
                        // interpret as EOL tokenizer
                        if ( !Lex[$T_EOL$] ) Lex[$T_EOL$] = { type:"simple", tokens:T_EOL };
                        sequence.push( $T_EOL$ );
                    }
                    else
                    {
                        if ( !Lex[token] && !Syntax[token] ) Lex[ token ] = { type:'simple', tokens:token };
                        sequence.push( token );
                    }
                    token = '';
                }
            
                if ( '.' === c )
                {
                    modifier = true;
                }
                
                else if ( '"' === c || "'" === c )
                {
                    // literal token, quoted
                    literal = get_delimited( t, c, '\\', true );
                    if ( literal.length )
                    {
                        curr_token = '' + literal;
                        if ( !Lex[curr_token] ) Lex[curr_token] = { type:'simple', tokens:literal };
                        sequence.push( curr_token );
                    }
                    else
                    {
                        // interpret as non-space tokenizer
                        if ( !Lex[$T_NONSPACE$] ) Lex[$T_NONSPACE$] = { type:"simple", tokens:'' };
                        sequence.push( $T_NONSPACE$ );
                    }
                }
                
                else if ( '/' === c )
                {
                    // literal regex token
                    literal = get_delimited( t, c, '\\', true ); fl = '';
                    if ( literal.length )
                    {
                        if ( t.pos < t.length && 'i' === t[CHAR](t.pos) ) { t.pos++; fl = 'i'; }
                        curr_token = '/' + literal + '/' + fl;
                        if ( !Lex[curr_token] ) Lex[curr_token] = { type:'simple', tokens:new_re("^("+literal+")",fl) };
                        sequence.push( curr_token );
                    }
                }
                
                else if ( '*' === c || '+' === c || '?' === c )
                {
                    // repeat modifier, applies to token that comes before
                    prev_token = sequence[sequence.length-1];
                    curr_token = '' + prev_token + c;
                    if ( !Syntax[ curr_token ] )
                        Syntax[ curr_token ] = {
                            type:'*' === c ? 'zeroOrMore' : ('+' === c ? 'oneOrMore' : 'zeroOrOne'),
                            tokens:[prev_token]
                        }
                    sequence[sequence.length-1] = curr_token;
                }
                
                else if ( '{' === c )
                {
                    // literal repeat modifier, applies to token that comes before
                    repeat = get_delimited( t, '}', false );
                    repeat = map( repeat.split( ',' ), trim );
                    
                    if ( !repeat[0].length ) repeat[0] = 0; // {,m} match 0 times or more
                    else repeat[0] = parseInt(repeat[0], 10) || 0;// {n,m} match n times up to m times
                    if ( 0 > repeat[0] ) repeat[0] = 0;
                    
                    if ( 2 > repeat.length ) repeat.push( repeat[0] ); // {n} match exactly n times
                    else if ( !repeat[1].length ) repeat[1] = INF; // {n,} match n times or more (INF)
                    else repeat[1] = parseInt(repeat[1], 10) || INF; // {n,m} match n times up to m times
                    if ( 0 > repeat[1] ) repeat[1] = 0;
                    
                    prev_token = sequence[sequence.length-1];
                    curr_token = '' + prev_token + [
                        '{',
                        repeat[0],
                        ',',
                        isFinite(repeat[1]) ? repeat[1] : '',
                        '}'
                    ].join('');
                    if ( !Syntax[ curr_token ] )
                        Syntax[ curr_token ] = { type:'repeat', repeat:[repeat[0], repeat[1]], tokens:[prev_token] }
                    sequence[sequence.length-1] = curr_token;
                }
                
                else if ( '}' === c )
                {
                    // literal repeat end modifier, should be handled in previous case
                    // added here just for completeness
                    continue;
                }
                
                else if ( '[' === c )
                {
                    // start of character select
                    literal = get_delimited( t, ']', '\\', true );
                    curr_token = '[' + literal + ']';
                    if ( !Lex[curr_token] )
                        Lex[curr_token] = {
                            type:'simple',
                            tokens:new_re("^(["+('^'===literal[CHAR](0)?('^'+esc_re(literal.slice(1))):esc_re(literal))+"])")
                            //                                          negative match,      else   positive match
                        /*literal.split('')*/};
                    sequence.push( curr_token );
                }
                
                else if ( ']' === c )
                {
                    // end of character select, should be handled in previous case
                    // added here just for completeness
                    continue;
                }
                
                else if ( '|' === c )
                {
                    modifier = false;
                    // alternation
                    if ( sequence.length > 1 )
                    {
                        curr_token = '' + sequence.join( " " );
                        if ( !Syntax[curr_token] ) Syntax[curr_token] = { type:'sequence', tokens:sequence };
                        alternation.push( curr_token );
                    }
                    else if ( sequence.length )
                    {
                        alternation.push( sequence[0] );
                    }
                    else
                    {
                        // ??
                    }
                    sequence = [];
                }
                
                else if ( '(' === c )
                {
                    // start of grouped sub-sequence
                    stack.push([sequence, alternation, token]);
                    sequence = []; alternation = []; token = '';
                }
                
                else if ( ')' === c )
                {
                    // end of grouped sub-sequence
                    if ( sequence.length > 1 )
                    {
                        curr_token = '' + sequence.join( " " );
                        if ( !Syntax[curr_token] ) Syntax[curr_token] = { type:'sequence', tokens:sequence };
                        alternation.push( curr_token );
                    }
                    else if ( sequence.length )
                    {
                        alternation.push( sequence[0] );
                    }
                    sequence = [];
                    
                    if ( alternation.length > 1 )
                    {
                        curr_token = '' + alternation.join( " | " );
                        if ( !Syntax[curr_token] ) Syntax[curr_token] = { type:'alternation', tokens:alternation };
                    }
                    else if ( alternation.length )
                    {
                        curr_token = alternation[ 0 ];
                    }
                    alternation = [];
                    
                    tmp = stack.pop( );
                    sequence = tmp[0]; alternation = tmp[1]; token = tmp[2];
                    
                    prev_token = curr_token;
                    curr_token = '(' + prev_token + ')';
                    if ( !Syntax[curr_token] ) Syntax[curr_token] = clone( get_backreference( prev_token, Lex, Syntax ) );
                    sequence.push( curr_token );
                }
                
                else // space
                {
                    // space separator, i.e sequence of tokens
                    //continue;
                }
            }
            else
            {
                token += c;
            }
        }
        
        if ( token.length )
        {
            if ( modifier )
            {
                // interpret as modifier / group / decorator
                if ( sequence.length )
                {
                    prev_token = sequence[sequence.length-1];
                    curr_token  = prev_token + '.' + token;
                    entry = Lex[curr_token] || Syntax[curr_token];
                    if ( !entry )
                    {
                        // in case it is just string, wrap it, to maintain the modifier reference
                        prev_entry = get_backreference( prev_token, Lex, Syntax );
                        Syntax[ curr_token ] = T_STR & get_type( prev_entry )
                                            ? new String( prev_entry )
                                            : clone( prev_entry );
                        Syntax[ curr_token ].modifier = token;
                    }
                    sequence[ sequence.length-1 ] = curr_token;
                }
                modifier = false;
            }
            else if ( '0' === token )
            {
                // interpret as empty tokenizer
                if ( !Lex[$T_EMPTY$] ) Lex[$T_EMPTY$] = { type:"simple", tokens:0/*T_EMPTY*/ };
                sequence.push( $T_EMPTY$ );
            }
            else if ( '^^' === token )
            {
                // interpret as SOF tokenizer
                if ( !Lex[$T_SOF$] ) Lex[$T_SOF$] = { type:"simple", tokens:T_SOF };
                sequence.push( $T_SOF$ );
            }
            else if ( '^' === token )
            {
                // interpret as SOL tokenizer
                if ( !Lex[$T_SOL$] ) Lex[$T_SOL$] = { type:"simple", tokens:T_SOL };
                sequence.push( $T_SOL$ );
            }
            else if ( '$' === token )
            {
                // interpret as EOL tokenizer
                if ( !Lex[$T_EOL$] ) Lex[$T_EOL$] = { type:"simple", tokens:T_EOL };
                sequence.push( $T_EOL$ );
            }
            else
            {
                if ( !Lex[token] && !Syntax[token] ) Lex[ token ] = { type:'simple', tokens:token };
                sequence.push( token );
            }
        }
        token = '';
        
        if ( sequence.length > 1 )
        {
            curr_token = '' + sequence.join( " " );
            if ( !Syntax[curr_token] ) Syntax[curr_token] = { type:'sequence', tokens:sequence };
            alternation.push( curr_token );
        }
        else if ( sequence.length )
        {
            alternation.push( sequence[0] );
        }
        else
        {
            // ??
        }
        sequence = [];
        
        if ( alternation.length > 1 )
        {
            curr_token = '' + alternation.join( " | " );
            if ( !Syntax[curr_token] ) Syntax[curr_token] = { type:'alternation', tokens:alternation };
            tok = curr_token;
        }
        else if ( alternation.length )
        {
            tok = alternation[ 0 ];
        }
        else
        {
            // ??
        }
        alternation = [];
    }
    if ( modifier_preset && (Lex[tok]||Syntax[tok]) ) (Lex[tok]||Syntax[tok]).modifier = modifier_preset;
    return tok;
}

function get_tokenizer( tokenID, RegExpID, Lex, Syntax, Style, 
                    cachedRegexes, cachedMatchers, cachedTokens, 
                    interleavedTokens, comments, keywords ) 
{
    var $token$ = null, $msg$ = null, $modifier$ = null, $type$, $tokens$, t, tt, token, combine;
    
    if ( T_SOF === tokenID || T_SOL === tokenID || T_EOL === tokenID )
    {
        // SOF/SOL/EOL Token
        return new tokenizer( tokenID, (T_SOF===tokenID?$T_SOF$:(T_SOL===tokenID?$T_SOL$:$T_EOL$)), tokenID, $msg$ );
    }
    
    else if ( false === tokenID || 0/*T_EMPTY*/ === tokenID )
    {
        // EMPTY Token
        return new tokenizer( T_EMPTY, $T_EMPTY$, 0, $msg$ );
    }
    
    else if ( '' === tokenID )
    {
        // NONSPACE Token
        return new tokenizer( T_NONSPACE, $T_NONSPACE$, '', $msg$ );
    }
    
    else if ( null === tokenID )
    {
        // skip-to-EOL Token
        return new tokenizer( T_SIMPLE, $T_NULL$, T_NULL, $msg$, $modifier$ );
    }
    
    else if ( T_ARRAY & get_type( tokenID ) )
    {
        // literal n-gram as array
        t = tokenID;
        tokenID = "NGRAM_" + t.join("_");
        if ( !Syntax[ tokenID ] ) Syntax[ tokenID ] = { type:"ngram", tokens:t };
    }
    
    tokenID = '' + tokenID;
    if ( cachedTokens[ tokenID ] ) return cachedTokens[ tokenID ];
    
    token = get_backreference( tokenID, Lex, Syntax );
    if ( T_STR & get_type(token) )
    {
        token = parse_peg_bnf_notation( token, Lex, Syntax );
        token = Lex[ token ] || Syntax[ token ] || null;
    }
    if ( !token ) return null;
    
    $type$ = token.type ? tokenTypes[ token.type[LOWER]( ).replace( dashes_re, '' ) ] || T_SIMPLE : T_SIMPLE;
    $msg$ = token.msg || null; $modifier$ = token.modifier || null;
    $tokens$ = token.tokens;
    
    if ( T_SIMPLE & $type$ )
    {
        if ( T_SOF === $tokens$ || T_SOL === $tokens$ || T_EOL === $tokens$ )
        {
            // SOF/SOL/EOL Token
            $token$ = new tokenizer( $tokens$, tokenID, $tokens$, $msg$ );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = $token$; return $token$;
        }
        
        else if ( false === $tokens$ || 0/*T_EMPTY*/ === $tokens$ )
        {
            // EMPTY Token
            $token$ = new tokenizer( T_EMPTY, tokenID, 0, $msg$ );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = $token$; return $token$;
        }
        
        else if ( '' === $tokens$ )
        {
            // NONSPACE Token
            $token$ = new tokenizer( T_NONSPACE, tokenID, '', $msg$ );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = $token$; return $token$;
        }
        
        else if ( null === $tokens$ )
        {
            // skip-to-EOL Token
            $token$ = new tokenizer( T_SIMPLE, tokenID, T_NULL, $msg$, $modifier$ );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = $token$;
            return $token$;
        }
        
        else if ( !$tokens$ )
        {
            return null;
        }
    }

    if ( T_ACTION & $type$ )
    {
        if ( !token[HAS]('action') )
        {
            if ( token[HAS]('error') ) token.action = [A_ERROR, token.error, !!token['in-context']];
            else if ( token[HAS]('context') ) token.action = [!!token.context?A_CTXSTART:A_CTXEND, token['context'], !!token['in-context']];
            else if ( token[HAS]('context-start') ) token.action = [A_CTXSTART, token['context-start'], !!token['in-context']];
            else if ( token[HAS]('context-end') ) token.action = [A_CTXEND, token['context-end'], !!token['in-context']];
            else if ( token[HAS]('push') ) token.action = [A_MCHSTART, token.push, !!token['in-context']];
            else if ( token[HAS]('pop') ) token.action = [A_MCHEND, token.pop, !!token['in-context']];
            else if ( token[HAS]('unique') ) token.action = [A_UNIQUE, T_STR&get_type(token.unique)?['_DEFAULT_',token.unique]:token.unique, !!token['in-context']];
            else if ( token[HAS]('indent') ) token.action = [A_INDENT, token.indent, !!token['in-context']];
            else if ( token[HAS]('outdent') ) token.action = [A_OUTDENT, token.outdent, !!token['in-context']];
        }
        else
        {
            if ( 'error' === token.action[0] ) token.action[0] = A_ERROR;
            else if ( 'context-start' === token.action[0] ) token.action[0] = A_CTXSTART;
            else if ( 'context-end' === token.action[0] ) token.action[0] = A_CTXEND;
            else if ( 'push' === token.action[0] ) token.action[0] = A_MCHSTART;
            else if ( 'pop' === token.action[0] ) token.action[0] = A_MCHEND;
            else if ( 'unique' === token.action[0] ) token.action[0] = A_UNIQUE;
            else if ( 'indent' === token.action[0] ) token.action[0] = A_INDENT;
            else if ( 'outdent' === token.action[0] ) token.action[0] = A_OUTDENT;
        }
        $token$ = new tokenizer( T_ACTION, tokenID, token.action.slice(), $msg$, $modifier$ );
        $token$.ci = !!token.caseInsensitive||token.ci;
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = $token$;
    }
    
    else
    {
        $tokens$ = make_array( $tokens$ );
        
        if ( T_SIMPLE & $type$ )
        {
            if ( token.autocomplete ) get_autocomplete( token, tokenID, keywords );
            
            // combine by default if possible using word-boundary delimiter
            combine = !token[HAS]('combine') ? "\\b" : token.combine;
            $token$ = new tokenizer( T_SIMPLE, tokenID,
                        get_compositematcher( tokenID, $tokens$.slice(), RegExpID, combine,
                        !!(token.caseInsensitive||token.ci), cachedRegexes, cachedMatchers ), 
                        $msg$, $modifier$
                    );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = $token$;
        }
        
        else if ( T_BLOCK & $type$ )
        {
            if ( T_COMMENT === $type$ ) get_comments( token, comments );

            $token$ = new tokenizer( $type$, tokenID,
                        get_blockmatcher( tokenID, $tokens$.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
                        $msg$
                    );
            $token$.mline = token[HAS]('multiline')?!!token.multiline:true;
            $token$.esc = token[HAS]('escape') ? token.escape : false;
            // allow block delims / block interior to have different styles
            $token$.inter = !!Style[ tokenID + '.inside' ];
            if ( (T_COMMENT === $type$) && token.interleave ) interleavedTokens.push( t_clone( $token$ ) );
            if ( $modifier$ ) $token$.modifier = $modifier$;
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = $token$;
        }
        
        else if ( T_COMPOSITE & $type$ )
        {
            if ( T_NGRAM === $type$ )
            {
                // get n-gram tokenizer
                tt = make_array_2( $tokens$ ); // array of arrays
                
                $token$ = map( tt, function( _, i ) {
                    // get tokenizer for whole ngram
                    return new tokenizer( T_NGRAM, tokenID+'_NGRAM_'+i, null, $msg$, $modifier$ );
                } );
                
                // pre-cache tokenizer to handle recursive calls to same tokenizer
                cachedTokens[ tokenID ] = $token$;
                
                iterate( function( i ) {
                    // get tokenizer for whole ngram
                    $token$[i].token = make_array( operate( tt[i], function( subTokenizers, t ){
                        return subTokenizers.concat( get_tokenizer( t, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, interleavedTokens,  comments, keywords ) );
                    }, [] ) );
                }, 0, tt.length-1 );
            }
            
            else
            {
                if ( (T_REPEATED & $type$) && (T_ARRAY & get_type( token.repeat )) )
                {
                    $token$ = new tokenizer( T_REPEATED, tokenID, null, $msg$, $modifier$ );
                    $token$.min = token.repeat[0]; $token$.max = token.repeat[1];
                }
                else if ( T_ZEROORONE === $type$ )
                {
                    $token$ = new tokenizer( T_ZEROORONE, tokenID, null, $msg$, $modifier$ );
                    $token$.min = 0; $token$.max = 1;
                }
                
                else if ( T_ZEROORMORE === $type$ )
                {
                    $token$ = new tokenizer( T_ZEROORMORE, tokenID, null, $msg$, $modifier$ );
                    $token$.min = 0; $token$.max = INF;
                }
                
                else if ( T_ONEORMORE === $type$ )
                {
                    $token$ = new tokenizer( T_ONEORMORE, tokenID, null, $msg$, $modifier$ );
                    $token$.min = 1; $token$.max = INF;
                }
                
                else if ( T_ALTERNATION === $type$ )
                {
                    $token$ = new tokenizer( T_ALTERNATION, tokenID, null, $msg$, $modifier$ );
                }
                
                else //if ( T_SEQUENCE === $type$ )
                {
                    $token$ = new tokenizer( T_SEQUENCE, tokenID, null, $msg$, $modifier$ );
                }
                
                // pre-cache tokenizer to handle recursive calls to same tokenizer
                cachedTokens[ tokenID ] = $token$;
                
                $token$.token = make_array( operate( $tokens$, function( subTokenizers, t ){
                    return subTokenizers.concat( get_tokenizer( t, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, interleavedTokens, comments, keywords ) );
                }, [] ) );
            }
        }
    }
    return cachedTokens[ tokenID ];
}

function parse_grammar( grammar ) 
{
    var RegExpID, tokens,
        Extra, Style, Lex, Syntax, 
        cachedRegexes, cachedMatchers, cachedTokens, 
        interleavedTokens, comments, keywords;
    
    // grammar is parsed, return it, avoid reparsing already parsed grammars
    if ( grammar.__parsed ) return grammar;
    
    //grammar = clone( grammar );
    RegExpID = grammar.RegExpID || null;
    Extra = grammar.Extra ? clone(grammar.Extra) : { };
    Style = grammar.Style ? clone(grammar.Style) : { };
    Lex = grammar.Lex ? clone(grammar.Lex) : { };
    Syntax = grammar.Syntax ? clone(grammar.Syntax) : { };
    
    cachedRegexes = { }; cachedMatchers = { }; cachedTokens = { }; 
    comments = { }; keywords = { }; interleavedTokens = [ ];
    
    tokens = grammar.Parser ? clone(grammar.Parser) : [ ];
    
    grammar = preprocess_grammar({
        Style           : Style,
        Lex             : Lex,
        Syntax          : Syntax,
        $parser         : null,
        $interleaved    : null,
        $comments       : null,
        $autocomplete   : null,
        $extra          : Extra,
        __parsed        : 0
    });
    
    grammar.$parser = operate( tokens, function( tokens, tokenID ) {
        var token = get_tokenizer( tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, interleavedTokens, comments, keywords ) || null;
        if ( token )
        {
            if ( T_ARRAY & get_type( token ) ) tokens = tokens.concat( token );
            else tokens.push( token );
        }
        return tokens;
    }, [] );
    grammar.$interleaved = interleavedTokens&&interleavedTokens.length ? interleavedTokens : null;
    grammar.$comments = comments;
    grammar.$autocomplete = keywords&&keywords.autocomplete&&keywords.autocomplete.length ? keywords.autocomplete : null;
    // this grammar is parsed
    grammar.__parsed = 1;
    return grammar;
}


//
// tokenizers
// change to functional-oriented instead of object-oriented approach to tokenizers and parsing

function matcher( type, name, pattern, ptype, key )
{
    var self = this, PT, T;
    PT = self.type = type;
    self.name = name;
    self.pattern = pattern;
    T = self.ptype = ptype || T_STR;
    self.key = key || 0;
    if ( P_COMPOSITE === PT )
    {
        self.key = false !== key;
    }
    else if ( P_BLOCK === PT )
    {
        self.pattern[0] = new matcher( P_COMPOSITE, name + '_Start', pattern[0], null, false );
    }
    else //if ( P_SIMPLE === PT )
    {
        if ( T_NULL === T )
            self.pattern = null;
        else if ( T_REGEX === T )
            self.pattern = T_REGEX&get_type(pattern) ? [pattern, 0] : [pattern[0], pattern[1]||0];
    }
}

/*function m_dispose( t )
{
    t.type = null;
    t.name = null;
    t.pattern = null;
    t.ptype = null;
    t.key = null;
}*/

function t_match( t, stream, eat )
{
    var self = t, PT = self.type, name, type,
        pattern = self.pattern, key = self.key,
        start, ends, end, match, m, T, T0, i, n, c
    ;
    
    if ( P_BLOCK === PT )
    {
        name = self.name;
        start = pattern[0]; ends = pattern[1];
        
        // matches start of block using startMatcher
        // and returns the associated endBlock matcher
        if ( match = t_match( start, stream, eat ) )
        {
            // use the token key to get the associated endMatcher
            end = ends[ match[0] ];
            T = get_type( end ); T0 = start.pattern[ match[0] ].ptype;
            
            // regex group number given, get the matched group pattern for the ending of this block
            // string replacement pattern given, get the proper pattern for the ending of this block
            if ( T_REGEX === T0 && (T_STR_OR_NUM & T) )
            {
                // the regex is wrapped in an additional group, 
                // add 1 to the requested regex group transparently
                m = T_NUM & T ? match[1][ end+1 ] : group_replace( end, match[1] );
                end = new matcher( P_SIMPLE, name+'_End', m, m.length>1 ? T_STR : T_CHAR );
            }
            return end;
        }
    }
    else if ( P_COMPOSITE === PT )
    {
        for (i=0,n=pattern.length; i<n; i++)
        {
            // each one is a matcher in its own
            m = t_match( pattern[ i ], stream, eat );
            if ( m ) return key ? [ i, m[1] ] : m;
        }
    }
    else //if ( P_SIMPLE === PT )
    {
        type = self.ptype;
        if ( T_NULL === type /*|| null === pattern*/ )
        {
            // up to end-of-line
            if ( false !== eat ) stream.end( ); // skipToEnd
            return [ key, "" ];
        }
        else if ( T_REGEX === type )
        {
            m = stream.slice( stream.pos ).match( pattern[0] );
            if ( m && 0 === m.index )
            {
                if ( false !== eat ) stream.mov( m[ pattern[1]||0 ].length );
                return [ key, pattern[1] > 0 ? m[pattern[1]] : m ];
            }
        }
        else if ( T_CHARLIST === type )
        {
            m = stream[CHAR](stream.pos) || null;
            if ( m && (-1 < pattern.indexOf( m )) ) 
            {
                if ( false !== eat ) stream.mov( 1 );
                return [ key, m ];
            }
        }
        else if ( T_CHAR === type )
        {
            m = stream[CHAR](stream.pos) || null;
            if ( pattern === m ) 
            {
                if ( false !== eat ) stream.mov( 1 );
                return [ key, m ];
            }
        }
        else if ( T_STR === type ) // ?? some pattern is undefined !!!!!!!!!
        {
            n = pattern.length;
            if ( pattern === stream.substr(stream.pos, n) ) 
            {
                if ( false !== eat ) stream.mov( n );
                return [ key, pattern ];
            }
        }
    }
    return false;
}

function tokenizer( type, name, token, msg, modifier )
{
    var self = this;
    self.type = type;
    self.name = name;
    self.token = token;
    self.modifier = modifier || null;
    self.pos = null;
    self.msg = msg || null;
    self.$msg = null;
    self.status = 0;
    self.ci = false; self.mline = true; self.esc = false; self.inter = false;
    self.found = 0; self.min = 0; self.max = 1;
    self.$id = null;
}

function t_clone( t, required, modifier )
{
    var tt = new tokenizer( t.type, t.name, t.token, t.msg, t.modifier );
    tt.ci = t.ci; tt.mline = t.mline; tt.esc = t.esc; tt.inter = t.inter;
    tt.found = t.found; tt.min = t.min; tt.max = t.max;
    if ( required ) tt.status |= REQUIRED;
    if ( modifier ) tt.modifier = modifier;
    return tt;
}

/*function t_dispose( t )
{
    t.type = null;
    t.name = null;
    t.token = null;
    t.modifier = null;
    t.pos = null;
    t.msg = null; t.$msg = null;
    t.status = null;
    t.ci = null; t.mline = null; t.esc = null; t.inter = null;
    t.found = null; t.min = null; t.max = null;
    t.$id = null;
}*/

function t_err( t )
{
    var T = t.name;
    return t.$msg
        ? t.$msg
        : (
            t.status & REQUIRED
            ? 'Token "'+T+'" Expected'
            : 'Syntax Error: "'+T+'"'
        );
}

function error_( state, l1, c1, l2, c2, t, err )
{
    //if ( state.err )
    state.err[ l1+'_'+c1+'_'+l2+'_'+c2+'_'+t.name ] = [ l1, c1, l2, c2, err || t_err( t ) ];
    //return state;
}

function tokenize( t, stream, state, token )
{
    var T = t.type, 
        t_ = T_COMPOSITE & T
        ? t_composite
        : (
            T_BLOCK & T
            ? t_block
            : ( T_ACTION & T ? t_action : t_simple )
        );
    return t_( t, stream, state, token );
}

function t_action( a, stream, state, token )
{
    var self = a, action_def = self.token || null,
    action, case_insensitive = self.ci, aid = self.name,
    t, t0, ns, msg, queu, symb, scop, ctx,
    l1, c1, l2, c2, in_ctx, err, t_str, is_block,
    no_errors = !(state.status & ERRORS);

    self.status = 0; self.$msg = null;

    // do action only if state.status handles (action) errors, else dont clutter
    if ( no_errors || !action_def || !token || !token.pos ) return true;
    is_block = !!(T_BLOCK & token.T);
    // partial block not completed yet, postpone
    if ( is_block && !token.block ) return true;

    action = action_def[ 0 ]; t = action_def[ 1 ]; in_ctx = action_def[ 2 ];
    queu = state.queu; symb = state.symb; ctx = state.ctx;
    msg = self.msg;
    
    if ( is_block /*&& token.block*/ )
    {
        t_str = token.block.match || token.block.str;
        l1 = token.block.pos[0][0];                          c1 = token.block.pos[0][1];
        l2 = token.block.pos[token.block.pos.length-1][2];   c2 = token.block.pos[token.block.pos.length-1][3];
    }
    else
    {
        t_str = token.match || token.str;
        l1 = token.pos[0];                                   c1 = token.pos[1];
        l2 = token.pos[2];                                   c2 = token.pos[3];
    }

    if ( A_ERROR === action )
    {
        if ( !msg && (T_STR & get_type(t)) ) msg = t;
        self.$msg = msg ? group_replace( msg, t_str, true ) : 'Error "' + aid + '"';
        error_( state, l1, c1, l2, c2, self, t_err( self ) );
        self.status |= ERROR;
        return false;
    }

    else if ( A_INDENT === action )
    {
        // TODO
    }

    else if ( A_OUTDENT === action )
    {
        // TODO
    }

    else if ( A_CTXEND === action )
    {
        if ( ctx.length ) ctx.shift();
    }

    else if ( A_CTXSTART === action )
    {
        ctx.unshift({symb:{},scop:{},queu:[]});
    }

    else if ( A_UNIQUE === action )
    {
        if ( in_ctx )
        {
            if ( ctx.length ) symb = ctx[0].symb;
            else return true;
        }
        if ( token )
        {
            t0 = t[1]; ns = t[0];
            t0 = group_replace( t0, t_str, true );
            if ( case_insensitive ) t0 = t0[LOWER]();
            if ( !symb[HAS](ns) ) symb[ns] = { };
            if ( symb[ns][HAS](t0) )
            {
                // duplicate
                self.$msg = msg
                    ? group_replace( msg, t0, true )
                    : 'Duplicate "'+t0+'"';
                err = t_err( self );
                error_( state, symb[ns][t0][0], symb[ns][t0][1], symb[ns][t0][2], symb[ns][t0][3], self, err );
                error_( state, l1, c1, l2, c2, self, err );
                self.status |= ERROR;
                return false;
            }
            else
            {
                symb[ns][t0] = [l1, c1, l2, c2];
            }
        }
    }

    else if ( A_MCHEND === action )
    {
        if ( in_ctx )
        {
            if ( ctx.length ) queu = ctx[0].queu;
            else return true;
        }
        if ( t )
        {
            t = group_replace( t, t_str );
            if ( case_insensitive ) t = t[LOWER]();
            if ( !queu.length || t !== queu[0][0] ) 
            {
                // no match
                if ( queu.length )
                {
                    self.$msg = msg
                        ? group_replace( msg, [queu[0][0],t], true )
                        : 'Tokens do not match "'+queu[0][0]+'","'+t+'"';
                    err = t_err( self );
                    error_( state, queu[0][1], queu[0][2], queu[0][3], queu[0][4], self, err );
                    error_( state, l1, c1, l2, c2, self, err );
                    queu.shift( );
                }
                else
                {
                    self.$msg = msg
                        ? group_replace( msg, ['',t], true )
                        : 'Token does not match "'+t+'"';
                    err = t_err( self );
                    error_( state, l1, c1, l2, c2, self, err );
                }
                self.status |= ERROR;
                return false;
            }
            else
            {
                queu.shift( );
            }
        }
        else
        {
            // pop unconditionaly
            queu.shift( );
        }
    }

    else if ( (A_MCHSTART === action) && t )
    {
        if ( in_ctx )
        {
            if ( ctx.length ) queu = ctx[0].queu;
            else return true;
        }
        t = group_replace( t, t_str );
        if ( case_insensitive ) t = t[LOWER]();
        queu.unshift( [t, l1, c1, l2, c2] );
    }
    return true;
}

function t_simple( t, stream, state, token )
{
    var self = t, pattern = self.token, modifier = self.modifier,
        type = self.type, tokenID = self.name,
        line = state.line, pos = stream.pos, m = null, ret = false;
    
    self.status &= CLEAR_ERROR;
    self.$msg = self.msg || null;
    
    // match SOF (start-of-file, first line of source)
    if ( T_SOF === type ) { ret = 0 === line; }
    // match SOL (start-of-line)
    else if ( T_SOL === type ) { ret = stream.sol(); }
    // match EOL (end-of-line) ( with possible leading spaces )
    else if ( T_EOL === type ) 
    { 
        stream.spc();
        if ( stream.eol() ) ret = tokenID;
        else stream.bck( pos );
    }
    // match EMPTY token
    else if ( T_EMPTY === type ) { self.status = 0; ret = true; }
    // match non-space
    else if ( T_NONSPACE === type ) 
    { 
        if ( (self.status & REQUIRED) && stream.spc() && !stream.eol() )
        {
            stream.bck( pos );
            self.status |= ERROR;
        }
        else
        {
            ret = true;
        }
        self.status &= CLEAR_REQUIRED;
    }
    // match up to end-of-line
    else if ( T_NULL === pattern ) 
    { 
        stream.end( ); // skipToEnd
        ret = modifier || tokenID; 
    }
    // else match a simple token
    else if ( m = t_match( pattern, stream ) ) 
    { 
        m = m[ 1 ];
        ret = modifier || tokenID; 
    }
    if ( false !== ret )
    {
        token.T = type; token.id = tokenID; token.type = ret;
        token.str = stream.sel(pos, stream.pos); token.match = m;
        token.pos = [line, pos, line, stream.pos];
    }
    if ( !ret && self.status && self.$msg ) self.$msg = group_replace( self.$msg, tokenID, true );
    return ret;
}

function t_block( t, stream, state, token )
{
    var self = t, block = self.name, type = self.type, modifier = self.modifier,
        block_start = self.token, block_end,
        is_multiline = self.mline, has_interior = self.inter,
        block_interior = has_interior ? block+'.inside' : block,
        esc_char = self.esc, is_escaped = !!esc_char, is_eol,
        already_inside, found, ended, continued, continue_to_next_line,
        block_start_pos, block_end_pos, block_inside_pos,
        b_start = '', b_inside = '', b_inside_rest = '', b_end = '',
        char_escaped, next, ret, is_required, $id = self.$id || block,
        stack = state.stack, stream_pos, stream_pos0, stack_pos, line, pos
    ;

    /*
        This tokenizer class handles many different block types ( BLOCK, COMMENT, ESC_BLOCK, SINGLE_LINE_BLOCK ),
        having different styles ( DIFFERENT BLOCK DELIMS/INTERIOR ) etc..
        So logic can become somewhat complex,
        descriptive names and logic used here for clarity as far as possible
    */

    self.status &= CLEAR_ERROR;
    self.$msg = self.msg || null;
    line = state.line; pos = stream.pos;
    // comments are not required tokens
    if ( T_COMMENT === type ) self.status &= CLEAR_REQUIRED;
    
    is_required = self.status & REQUIRED; already_inside = 0; found = 0;
    
    if ( state.block && state.block.name === block )
    {
        found = 1; already_inside = 1; ret = block_interior;
        block_end = state.block.end;
        block_start_pos = state.block.sp; block_inside_pos = state.block.ip;  block_end_pos = state.block.ep;
        b_start = state.block.s;  b_inside = state.block.i;
    }    
    else if ( !state.block && (block_end = t_match(block_start, stream)) )
    {
        found = 1; ret = block;
        stream_pos = stream.pos;
        block_start_pos = [line, pos];
        block_inside_pos = [[line, stream_pos], [line, stream_pos]]; block_end_pos = [line, stream_pos];
        b_start = stream.sel(pos, stream_pos);  b_inside = '';  b_end = '';
        state.block = {
            name: block,  end: block_end,
            sp: block_start_pos, ip: block_inside_pos, ep: block_end_pos,
            s: b_start, i: b_inside, e: b_end
        };
    }    

    if ( found )
    {
        stack_pos = stack.length;
        is_eol = T_NULL === block_end.type;
        
        if ( has_interior )
        {
            if ( is_eol && already_inside && stream.sol() )
            {
                // eol block continued to start of next line, abort
                self.status &= CLEAR_REQUIRED;
                state.block = null;
                return false;
            }
            
            if ( !already_inside )
            {
                stream_pos = stream.pos;
                token.T = type; token.id = block; token.type = modifier || ret;
                token.str = stream.sel(pos, stream_pos); token.match = null;
                token.pos = [line, pos, line, stream_pos];
                push_at( stack, stack_pos, t_clone( self, is_required ), '$id', $id );
                return modifier || ret;
            }
        }
        
        ended = t_match( block_end, stream );
        continue_to_next_line = is_multiline;
        continued = 0;
        
        if ( !ended )
        {
            stream_pos0 = stream.pos;
            char_escaped = false;
            while ( !stream.eol( ) ) 
            {
                stream_pos = stream.pos;
                if ( !char_escaped && t_match(block_end, stream) ) 
                {
                    if ( has_interior )
                    {
                        if ( stream.pos > stream_pos && stream_pos > stream_pos0 )
                        {
                            ret = block_interior;
                            stream.bck( stream_pos );
                            continued = 1;
                        }
                        else
                        {
                            ret = block;
                            ended = 1;
                        }
                    }
                    else
                    {
                        ret = block;
                        ended = 1;
                    }
                    b_end = stream.cur().slice(b_inside_rest.length);
                    break;
                }
                else
                {
                    next = stream.nxt( 1 );
                    b_inside_rest += next;
                }
                char_escaped = is_escaped && !char_escaped && esc_char === next;
            }
        }
        else
        {
            ret = is_eol ? block_interior : block;
            b_end = stream.cur().slice(b_inside_rest.length);
        }
        continue_to_next_line = is_multiline || (is_escaped && char_escaped);
        
        b_inside += b_inside_rest;
        block_inside_pos[ 1 ] = [line, stream_pos]; block_end_pos = [line, stream.pos];
        
        if ( ended || (!continue_to_next_line && !continued) )
        {
            state.block = null;
        }
        else
        {
            state.block.ip = block_inside_pos;  state.block.ep = block_end_pos;
            state.block.i = b_inside; state.block.e = b_end;
            push_at( stack, stack_pos, t_clone( self, is_required ), '$id', $id );
        }
        token.T = type; token.id = block; token.type = modifier || ret;
        token.str = stream.sel(pos, stream.pos); token.match = null;
        token.pos = [line, pos, block_end_pos[0], block_end_pos[1]];
        
        if ( !state.block )
        {
            // block is now completed
            token.block = {
            str: b_start + b_inside + b_end,
            match: [
                b_start + b_inside + b_end,
                b_inside, b_start, b_end
            ],
            part: [ b_start, b_inside, b_end ],
            pos: [
                [block_start_pos[0], block_start_pos[1], block_inside_pos[0][0], block_inside_pos[0][1]],
                [block_inside_pos[0][0], block_inside_pos[0][1], block_inside_pos[1][0], block_inside_pos[1][1]],
                [block_inside_pos[1][0], block_inside_pos[1][1], block_end_pos[0], block_end_pos[1]]
            ]
            };
        }
        return modifier || ret;
    }
    if ( self.status && self.$msg ) self.$msg = group_replace( self.$msg, block, true );
    return false;
}

function t_composite( t, stream, state, token )
{
    var self = t, type = self.type, name = self.name, tokens = self.token, n = tokens.length,
        tokenizer, style, modifier = self.modifier, found, min, max,
        tokens_required, tokens_err, stream_pos, stack_pos,
        i, tt, stack, err, $id, match_all;

    self.status &= CLEAR_ERROR;
    self.$msg = self.msg || null;

    stack = state.stack;
    stream_pos = stream.pos; stack_pos = stack.length;

    tokens_required = 0; tokens_err = 0;

    if ( T_ALTERNATION === type )
    {
        self.status |= REQUIRED;
        err = [];
        
        for (i=0; i<n; i++)
        {
            tokenizer = t_clone( tokens[ i ], 1, modifier );
            style = tokenize( tokenizer, stream, state, token );
            
            if ( tokenizer.status & REQUIRED )
            {
                tokens_required++;
                err.push( t_err( tokenizer ) );
            }
            
            if ( false !== style )
            {
                return style;
            }
            else if ( tokenizer.status & ERROR )
            {
                tokens_err++;
                stream.bck( stream_pos );
            }
        }
        
        if ( tokens_required > 0 ) self.status |= REQUIRED;
        else self.status &= CLEAR_REQUIRED;
        if ( (n === tokens_err) && (tokens_required > 0) ) self.status |= ERROR;
        else self.status &= CLEAR_ERROR;
        if ( self.status && !self.$msg && err.length ) self.$msg = err.join(' | ');
        return false;
    }

    else if ( T_SEQUENCE_OR_NGRAM & type )
    {
        match_all = !!(type & T_SEQUENCE);
        if ( match_all ) self.status |= REQUIRED;
        else self.status &= CLEAR_REQUIRED;
        $id = /*self.$id ||*/ name+'_'+get_id();
        tokenizer = t_clone( tokens[ 0 ], match_all, modifier );
        style = tokenize( tokenizer, stream, state, token );
        
        if ( false !== style )
        {
            // not empty token
            if ( true !== style || T_EMPTY !== tokenizer.type )
            {
                for (i=n-1; i>0; i--)
                {
                    tt = t_clone( tokens[ i ], 1, modifier );
                    push_at( stack, stack_pos+n-i-1, tt, '$id', $id );
                }
            }
                
            return style;
        }
        else if ( tokenizer.status & ERROR /*&& tokenizer.REQ*/ )
        {
            if ( match_all ) self.status |= ERROR;
            else self.status &= CLEAR_ERROR;
            stream.bck( stream_pos );
        }
        else if ( match_all && (tokenizer.status & REQUIRED) )
        {
            self.status |= ERROR;
        }
        
        if ( self.status && !self.$msg ) self.$msg = t_err( tokenizer );
        return false;
    }

    else //if ( T_REPEATED & type )
    {
        found = self.found; min = self.min; max = self.max;
        self.status &= CLEAR_REQUIRED;
        $id = /*self.$id ||*/ name+'_'+get_id();
        err = [];
        
        for (i=0; i<n; i++)
        {
            tokenizer = t_clone( tokens[ i ], 1, modifier );
            style = tokenize( tokenizer, stream, state, token );
            
            if ( false !== style )
            {
                ++found;
                if ( found <= max )
                {
                    // push it to the stack for more
                    self.found = found;
                    push_at( stack, stack_pos, t_clone( self ), '$id', $id );
                    self.found = 0;
                    return style;
                }
                break;
            }
            else if ( tokenizer.status & REQUIRED )
            {
                tokens_required++;
                err.push( t_err( tokenizer ) );
            }
            if ( tokenizer.status & ERROR ) stream.bck( stream_pos );
        }
        
        if ( found < min ) self.status |= REQUIRED;
        else self.status &= CLEAR_REQUIRED;
        if ( (found > max) || (found < min && 0 < tokens_required) ) self.status |= ERROR;
        else self.status &= CLEAR_ERROR;
        if ( self.status && !self.$msg && err.length ) self.$msg = err.join(' | ');
        return false;
    }
}


//
// parser factory
function State( unique, s )
{
    var self = this;
    // this enables unique state "names"
    // thus forces highlight to update
    // however updates also occur when no update necessary ??
    self.id = unique ? uuid("state") : "state";
    if ( s instanceof State )
    {
        // clone
        self.line = s.line;
        self.status = s.status;
        self.stack = s.stack.slice();
        self.block = s.block;
        // keep extra state only if error handling is enabled
        if ( self.status & ERRORS )
        {
            self.queu = s.queu;
            self.symb = s.symb;
            self.scop = s.scop;
            self.ctx = s.ctx;
            self.err = s.err;
        }
        // else dont use-up more space and clutter
        else
        {
            self.queu = null;
            self.symb = null;
            self.scop = null;
            self.ctx = null;
            self.err = null;
        }
        self.$eol$ = s.$eol$;
    }
    else
    {
        self.line = -1;
        self.status = s || 0;
        self.stack = [];
        self.block = null;
        // keep extra state only if error handling is enabled
        if ( self.status & ERRORS )
        {
            self.queu = [];
            self.symb = {};
            self.scop = {};
            self.ctx = [];
            self.err = {};
        }
        // else dont use-up more space and clutter
        else
        {
            self.queu = null;
            self.symb = null;
            self.scop = null;
            self.ctx = null;
            self.err = null;
        }
        self.$eol$ = true;
    }
    // make sure to generate a string which will cover most cases where state needs to be updated by the editor
    self.toString = function() {
        return self.id+'_'+self.line+'_'+(self.block?self.block.name:'0');
    };
}

function state_dispose( state )
{
    state.id = null;
    state.line = null;
    state.status = null;
    state.stack = null;
    state.block = null;
    state.queu = null;
    state.symb = null;
    state.scop = null;
    state.ctx = null;
    state.err = null;
}

// a wrapper to manipulate a string as a stream, based on Codemirror's StringStream
function Stream( line, start, pos )
{
    var self = new String( line );
    self.start = start || 0;
    self.pos = pos || 0;
    
    // string start-of-line?
    self.sol = function( ) { 
        return 0 === self.pos; 
    };
    
    // string end-of-line?
    self.eol = function( ) { 
        return self.pos >= self.length; 
    };
    
    // skip to end
    self.end = function( ) {
        self.pos = self.length;
        return self;
    };

    // move pointer forward/backward n steps
    self.mov = function( n ) {
        self.pos = 0 > n ? MAX(0, self.pos+n) : MIN(self.length, self.pos+n);
        return self;
    };
    
    // move pointer back to pos
    self.bck = function( pos ) {
        self.pos = MAX(0, pos);
        return self;
    };
    
    // move/shift stream
    self.sft = function( ) {
        self.start = self.pos;
        return self;
    };
    
    // next char(s) or whole token
    self.nxt = function( num, re_token ) {
        var c, token = '', n;
        if ( true === num )
        {
            re_token = re_token || Stream.$RE_NONSPC$;
            while ( self.pos<self.length && re_token.test(c=self[CHAR](self.pos++)) ) token += c;
            return token.length ? token : null;
        }
        else
        {
            num = num||1; n = 0;
            while ( n++ < num && self.pos<self.length ) token += self[CHAR](self.pos++);
            return token;
        }
    };
    
    // current stream selection
    self.cur = function( shift ) {
        var ret = self.slice(self.start, self.pos);
        if ( shift ) self.start = self.pos;
        return ret;
    };
    
    // stream selection
    self.sel = function( p0, p1 ) {
        return self.slice(p0, p1);
    };
    
    // eat "space"
    self.spc = function( eat, re_space ) {
        var m;
        if ( m = self.slice(self.pos).match( re_space||Stream.$RE_SPC$ ) ) 
        {
            if ( false !== eat ) self.mov( m[0].length );
            return m[0];
        }
    };
    return self;
}
Stream.$RE_SPC$ = /^[\s\u00a0]+/;
Stream.$RE_NONSPC$ = /[^\s\u00a0]/;


var Parser = Class({
    constructor: function Parser( grammar, DEFAULT, ERROR ) {
        var self = this;
        self.$grammar = grammar;
        self.$DEF = DEFAULT || null; self.$ERR = ERROR || null;
        self.DEF = self.$DEF; self.ERR = self.$ERR;
    }
    
    ,$grammar: null
    ,$n$: 'name', $t$: 'type', $v$: 'token'
    ,$DEF: null, $ERR: null
    ,DEF: null, ERR: null
    
    ,dispose: function( ) {
        var self = this;
        self.$grammar = null;
        self.$n$ = self.$t$ = self.$v$ = null;
        self.$DEF = self.$ERR = self.DEF = self.ERR = null;
        return self;
    }
    
    ,token: function( stream, state ) {
        var self = this, grammar = self.$grammar, Style = grammar.Style, DEFAULT = self.DEF, ERR = self.ERR,
            T = { }, $name$ = self.$n$, $type$ = self.$t$, $value$ = self.$v$, //$pos$ = 'pos',
            interleaved_tokens = grammar.$interleaved, tokens = grammar.$parser, 
            nTokens = tokens.length, niTokens = interleaved_tokens ? interleaved_tokens.length : 0,
            tokenizer, action, token, type, err, stack, line, pos, i, ii, notfound
        ;
        
        // state marks a new line
        if ( state.$eol$ && stream.sol() ) { state.$eol$ = false; state.line++; }
        state.$actionerr$ = false;
        stack = state.stack; line = state.line; pos = stream.pos;
        notfound = true; err = false; type = false;
        
        // if EOL tokenizer is left on stack, pop it now
        if ( stack.length && T_EOL === stack[stack.length-1].type && stream.sol() ) stack.pop();
        
        // check for non-space tokenizer before parsing space
        if ( (!stack.length || (T_NONSPACE !== stack[stack.length-1].type)) && stream.spc() ) notfound = false;
        
        T[$name$] = null; T[$type$] = DEFAULT; T[$value$] = null;
        if ( notfound )
        {
            token = {
                T:0, id:null, type:null,
                match:null, str:'', pos:null
            };
            
            i = 0;
            while ( notfound && (stack.length || i<nTokens) && !stream.eol() )
            {
                if ( niTokens )
                {
                    for (ii=0; ii<niTokens; ii++)
                    {
                        tokenizer = interleaved_tokens[ii];
                        type = tokenize( tokenizer, stream, state, token );
                        if ( false !== type ) { notfound = false; break; }
                    }
                    if ( !notfound ) break;
                }
                
                tokenizer = stack.length ? stack.pop() : tokens[i++];
                type = tokenize( tokenizer, stream, state, token );
                
                // match failed
                if ( false === type )
                {
                    // error
                    if ( tokenizer.status & REQUIRED_OR_ERROR )
                    {
                        // empty the stack of the syntax rule group of this tokenizer
                        empty( stack, '$id', tokenizer.$id );
                        // skip this
                        stream.nxt( true ) || stream.spc( );
                        // generate error
                        err = true; notfound = false; break;
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
                    // action token(s) follow, execute action(s) on current token
                    if ( stack.length && T_ACTION === stack[stack.length-1].type )
                    {
                        while ( stack.length && T_ACTION === stack[stack.length-1].type )
                        {
                            action = stack.pop(); t_action( action, stream, state, token );
                            // action error
                            if ( action.status & ERROR ) state.$actionerr$ = true;
                        }
                    }
                    // partial block, apply any action(s) following it
                    else if ( stack.length > 1 && stream.eol() &&  
                        (T_BLOCK & stack[stack.length-1].type) && state.block &&
                        state.block.name === stack[stack.length-1].name 
                    )
                    {
                        ii = stack.length-2;
                        while ( ii >= 0 && T_ACTION === stack[ii].type )
                        {
                            action = stack[ii--]; t_action( action, stream, state, token );
                            // action error
                            if ( action.status & ERROR ) state.$actionerr$ = true;
                        }
                    }
                    // not empty
                    if ( true !== type ) { notfound = false; break; }
                }
            }
        }
        
        
        // unknown, bypass, next default token/char
        if ( notfound )  stream.nxt( 1/*true*/ );
        
        T[$value$] = stream.cur( 1 );
        if ( false !== type )
        {
            type = Style[type] || DEFAULT;
            T[$name$] = tokenizer.name;
        }
        else if ( err )
        {
            type = ERR;
            if ( state.status & ERRORS )
                error_( state, line, pos, line, stream.pos, tokenizer );
        }
        else
        {
            type = DEFAULT;
        }
        T[$type$] = type;
        state.$eol$ = stream.eol();
        
        return T;
    }
    
    ,tokenize: function( stream, state, row ) {
        var self = this, tokens = [];
        //state.line = row || 0;
        if ( stream.eol() ) { state.line++; /*state.$eol$ = true;*/ }
        else while ( !stream.eol() ) tokens.push( self.token( stream, state ) );
        return tokens;
    }
    
    ,parse: function( code, parse_type ) {
        var self = this, lines = (code||"").split(newline_re), l = lines.length,
            linetokens = null, state, parse_errors, parse_tokens, ret;
        
        parse_type = parse_type || TOKENS;
        parse_errors = !!(parse_type & ERRORS);
        parse_tokens = !!(parse_type & TOKENS);
        state = new State( 0, parse_type );
        state.$full_parse$ = true;
        
        // add back the newlines removed from split-ting
        iterate(function( i ){ lines[i] += "\n"; }, 0, l-2);
        
        if ( parse_tokens ) 
            linetokens = iterate(parse_type & FLAT
            ? function( i, linetokens ) {
                linetokens._ = linetokens._.concat( self.tokenize( Stream( lines[i] ), state, i ) );
            }
            : function( i, linetokens ) {
                linetokens._.push( self.tokenize( Stream( lines[i] ), state, i ) );
            }, 0, l-1, {_:[]} )._;
        
        else 
            iterate(function( i ) {
                var stream = Stream( lines[i] );
                //state.line = i;
                if ( stream.eol() ) { state.line++; state.$eol$ = true; }
                else while ( !stream.eol() ) self.token( stream, state );
            }, 0, l-1);
        
        ret = parse_tokens && parse_errors
            ? {tokens:linetokens, errors:state.err}
            : (parse_tokens ? linetokens : state.err);
        
        state_dispose( state );
        return ret;
    }
    
    ,indent: function( ) { }
});

/**
*
*   CodeMirrorGrammar
*   @version: 2.5.0
*
*   Transform a grammar specification in JSON format, into a syntax-highlight parser mode for CodeMirror
*   https://github.com/foo123/codemirror-grammar
*
**/


// codemirror supposed to be available
var $CodeMirror$ = CodeMirror || { Pass : { toString: function(){return "CodeMirror.Pass";} } },
    // used for autocompletion
    RE_W = /[\w$]/, by_score = function( a, b ) { return b.score-a.score }
;

//
// parser factories
var CodeMirrorParser = Class(Parser, {
    constructor: function CodeMirrorParser( grammar, DEFAULT ) {
        var self = this;
        
        Parser.call(self, grammar, null, "error");
        self.DEF = DEFAULT || self.$DEF;
        self.ERR = grammar.Style.error || self.$ERR;
        
        // support comments toggle functionality
        self.LC = grammar.$comments.line ? grammar.$comments.line[0] : null;
        self.BCS = grammar.$comments.block ? grammar.$comments.block[0][0] : null;
        self.BCE = grammar.$comments.block ? grammar.$comments.block[0][1] : null;
        self.BCC = self.BCL = grammar.$comments.block ? grammar.$comments.block[0][2] : null;
    }
    
    ,LC: null
    ,BCS: null
    ,BCE: null
    ,BCL: null
    ,BCC: null
    
    ,dispose: function( ) {
        var self = this;
        self.LC = self.BCS = self.BCE = self.BCL = self.BCC = null;
        return Parser[PROTO].dispose.call( self );
    }
    
    ,indent: function( state, textAfter, fullLine, conf, parserConf ) {
        var indentUnit = conf.indentUnit || 4, Pass = $CodeMirror$.Pass;
        return Pass;
    }
});

function get_mode( grammar, DEFAULT ) 
{
    // Codemirror-compatible Mode
    var cm_mode = function cm_mode( conf, parserConf ) {
        return {
            /*
            // maybe needed in later versions..?
            
            blankLine: function( state ) { }
            
            ,innerMode: function( state ) { }
            */
            
            startState: function( ) { 
                return new State( );
            }
            
            ,copyState: function( state ) { 
                return new State( 0, state );
            }
            
            ,token: function( stream, state ) { 
                var pstream = Stream( stream.string, stream.start, stream.pos ), 
                    token = cm_mode.$parser.token( pstream, state ).type;
                stream.pos = pstream.pos;
                return token;
            }
            
            ,indent: function( state, textAfter, fullLine ) { 
                return cm_mode.$parser.indent( state, textAfter, fullLine, conf, parserConf ); 
            }
            
            // support comments toggle functionality
            ,lineComment: cm_mode.$parser.LC
            ,blockCommentStart: cm_mode.$parser.BCS
            ,blockCommentEnd: cm_mode.$parser.BCE
            ,blockCommentContinue: cm_mode.$parser.BCC
            ,blockCommentLead: cm_mode.$parser.BCL
            // support extra functionality defined in grammar
            // eg. code folding, electriChars etc..
            ,electricInput: cm_mode.$parser.$grammar.$extra.electricInput || false
            ,electricChars: cm_mode.$parser.$grammar.$extra.electricChars || false
            ,fold: cm_mode.$parser.$grammar.$extra.fold || false
        };
    };
    
    cm_mode.$id = uuid("codemirror_grammar_mode");
    
    cm_mode.$parser = new CodeMirrorParser( parse_grammar( grammar ), DEFAULT );
    
    cm_mode.supportGrammarAnnotations = false;
    // syntax, lint-like validator generated from grammar
    // maybe use this as a worker (a-la ACE) ??
    cm_mode.validator = function( code, options )  {
        if ( !cm_mode.$parser || !cm_mode.supportGrammarAnnotations || !code || !code.length ) return [];
        
        var errors = [], err, msg, error, Pos = $CodeMirror$.Pos,
            code_errors = cm_mode.$parser.parse( code, ERRORS );
        if ( !code_errors ) return errors;
        
        for (err in code_errors)
        {
            if ( !code_errors[HAS](err) ) continue;
            error = code_errors[err];
            errors.push({
                message: error[4] || "Syntax Error",
                severity: "error",
                from: Pos(error[0], error[1]),
                to: Pos(error[2], error[3])
            });
        }
        return errors;
    };
    
    // autocompletion helper extracted from the grammar
    // adapted from codemirror anyword-hint helper
    cm_mode.autocomplete_renderer = function( elt, data, cmpl ) {
        var word = cmpl.text, type = cmpl.meta, p1 = cmpl.start, p2 = cmpl.end,
            padding = data.list.maxlen-word.length-type.length+5;
        elt.innerHTML = [
            '<span class="cmg-autocomplete-keyword">', word.slice(0,p1),
            '<strong class="cmg-autocomplete-keyword-match">', word.slice(p1,p2), '</strong>',
            word.slice(p2), '</span>',
            new Array(1+padding).join('&nbsp;'),
            '<strong class="cmg-autocomplete-keyword-meta">', type, '</strong>',
            '&nbsp;'
        ].join('');
        // adjust to fit keywords
        elt.className = (elt.className&&elt.className.length ? elt.className+' ' : '') + 'cmg-autocomplete-keyword-hint';
        elt.style.position = 'relative'; elt.style.boxSizing = 'border-box';
        elt.style.width = '100%'; elt.style.maxWidth = '100%';
    };
    cm_mode.autocomplete = function( cm, options ) {
        var list = [], Pos = $CodeMirror$.Pos,
            cur = cm.getCursor(), curLine,
            start0 = cur.ch, start = start0, end0 = start0, end = end0,
            token, token_i, len, maxlen = 0, word_re, renderer,
            case_insensitive_match, prefix_match;
        if ( cm_mode.$parser && cm_mode.$parser.$grammar.$autocomplete )
        {
            options = options || {};
            word_re = options.word || RE_W; curLine = cm.getLine(cur.line);
            prefix_match = options[HAS]('prefixMatch') ? !!options.prefixMatch : true;
            while (start && word_re.test(curLine[CHAR](start - 1))) --start;
            // operate similar to current ACE autocompleter equivalent
            if ( !prefix_match ) while (end < curLine.length && word_re.test(curLine[CHAR](end))) ++end;
            if ( start < end )
            {
                case_insensitive_match = options[HAS]('caseInsensitiveMatch') ? !!options.caseInsensitiveMatch : false;
                renderer = options.renderer || cm_mode.autocomplete_renderer;
                token = curLine.slice(start, end); token_i = token[LOWER](); len = token.length;
                operate(cm_mode.$parser.$grammar.$autocomplete, function( list, word ){
                    var w = word.word, wl = w.length, 
                        wm, case_insensitive_word,
                        pos, pos_i, m1, m2, case_insensitive;
                    if ( wl >= len )
                    {
                        wm = word.meta;  case_insensitive_word = !!w.ci;
                        case_insensitive = case_insensitive_match || case_insensitive_word;
                        if ( case_insensitive ) { m1 = w[LOWER](); m2 = token_i; }
                        else { m1 = w; m2 = token; }
                        if ( ((pos_i = m1.indexOf( m2 )) >= 0) && (!prefix_match || (0 === pos_i)) )
                        {
                            pos = case_insensitive ? w.indexOf( token ) : pos_i;
                            if ( wl+wm.length > maxlen ) maxlen = wl+wm.length;
                            list.push({
                                text: w, name: w, meta: wm,
                                start: pos<0?pos_i:pos, end: (pos<0?pos_i:pos) + token.length, match: token,
                                displayText: w + "\t\t["+wm+"]",
                                render: renderer,
                                // longer matches or matches not at start have lower match score
                                score: 1000 - 10*(wl-len) - 5*(pos<0?pos_i+3:pos)
                            });
                        }
                    }
                    return list;
                }, list);
                if ( list.length ) list = list.sort( by_score );
                list.maxlen = maxlen; 
            }
        }
        return {
            list: list,
            from: Pos( cur.line, start ),
            to: Pos( cur.line, end )
        };
    };
    cm_mode.dispose = function( ) {
        if ( cm_mode.$parser ) cm_mode.$parser.dispose( );
        cm_mode.$parser = null;
    };
    return cm_mode;
}

//
//  CodeMirror Grammar main class
/**[DOC_MARKDOWN]
*
* ###CodeMirrorGrammar Methods
*
* __For node:__
*
* ```javascript
* CodeMirrorGrammar = require('build/codemirror_grammar.js').CodeMirrorGrammar;
* ```
*
* __For browser:__
*
* ```html
* <script src="build/codemirror_grammar.js"></script>
* ```
*
[/DOC_MARKDOWN]**/
var CodeMirrorGrammar = exports['CodeMirrorGrammar'] = {
    
    VERSION: "2.5.0",
    
    // clone a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `clone`
    *
    * ```javascript
    * cloned = CodeMirrorGrammar.clone( grammar [, deep=true] );
    * ```
    *
    * Clone (deep) a `grammar`
    *
    * Utility to clone objects efficiently
    [/DOC_MARKDOWN]**/
    clone: clone,
    
    // extend a grammar using another base grammar
    /**[DOC_MARKDOWN]
    * __Method__: `extend`
    *
    * ```javascript
    * extendedgrammar = CodeMirrorGrammar.extend( grammar, basegrammar1 [, basegrammar2, ..] );
    * ```
    *
    * Extend a `grammar` with `basegrammar1`, `basegrammar2`, etc..
    *
    * This way arbitrary `dialects` and `variations` can be handled more easily
    [/DOC_MARKDOWN]**/
    extend: extend,
    
    // pre-process a grammar (in-place)
    /**[DOC_MARKDOWN]
    * __Method__: `pre_process`
    *
    * ```javascript
    * CodeMirrorGrammar.pre_process( grammar );
    * ```
    *
    * This is used internally by the `CodeMirrorGrammar` Class `parse` method
    * In order to pre-process, in-place, a `JSON grammar` 
    * to transform any shorthand configurations to full object configurations and provide defaults.
    [/DOC_MARKDOWN]**/
    pre_process: preprocess_grammar,
    
    // parse a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `parse`
    *
    * ```javascript
    * parsedgrammar = CodeMirrorGrammar.parse( grammar );
    * ```
    *
    * This is used internally by the `CodeMirrorGrammar` Class
    * In order to parse a `JSON grammar` to a form suitable to be used by the syntax-highlight parser.
    * However user can use this method to cache a `parsedgrammar` to be used later.
    * Already parsed grammars are NOT re-parsed when passed through the parse method again
    [/DOC_MARKDOWN]**/
    parse: parse_grammar,
    
    // get a codemirror syntax-highlight mode from a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `getMode`
    *
    * ```javascript
    * mode = CodeMirrorGrammar.getMode( grammar [, DEFAULT] );
    * ```
    *
    * This is the main method which transforms a `JSON grammar` into a `CodeMirror` syntax-highlight parser.
    * `DEFAULT` is the default return value (`null` by default) for things that are skipped or not styled
    * In general there is no need to set this value, unless you need to return something else
    [/DOC_MARKDOWN]**/
    getMode: get_mode
};

/* main code ends here */
/* export the module */
return exports["CodeMirrorGrammar"];
});