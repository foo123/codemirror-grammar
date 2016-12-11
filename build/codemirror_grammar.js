/**
*
*   CodeMirrorGrammar
*   @version: 4.2.1
*
*   Transform a grammar specification in JSON format, into a syntax-highlight parser mode for CodeMirror
*   https://github.com/foo123/codemirror-grammar
*   https://github.com/foo123/editor-grammar
*
**/!function( root, name, factory ){
"use strict";
if ( ('object'===typeof module)&&module.exports ) /* CommonJS */
    (module.$deps = module.$deps||{}) && (module.exports = module.$deps[name] = factory.call(root));
else if ( ('function'===typeof define)&&define.amd&&('function'===typeof require)&&('function'===typeof require.specified)&&require.specified(name) /*&& !require.defined(name)*/ ) /* AMD */
    define(name,['module'],function(module){factory.moduleUri = module.uri; return factory.call(root);});
else if ( !(name in root) ) /* Browser/WebWorker/.. */
    (root[name] = factory.call(root)||1)&&('function'===typeof(define))&&define.amd&&define(function(){return root[name];} );
}(  /* current root */          this, 
    /* module name */           "CodeMirrorGrammar",
    /* module factory */        function ModuleFactory__CodeMirrorGrammar( ){
/* main code starts here */

"use strict";
/**
*   EditorGrammar Codebase
*   @version: 4.2.1
*
*   https://github.com/foo123/editor-grammar
**/


//
// types
var    
TOKENS = 1, ERRORS = 2, FLAT = 32, REQUIRED = 4, ERROR = 8,
CLEAR_REQUIRED = ~REQUIRED, CLEAR_ERROR = ~ERROR, REQUIRED_OR_ERROR = REQUIRED | ERROR,

// action types
A_NOP = 0, A_ERROR = 4,
A_DEFINE = 8, A_UNDEFINE = 9,
A_DEFINED = 10, A_NOTDEFINED = 11, A_UNIQUE = 12,
A_CTXSTART = 16, A_CTXEND = 17,
A_HYPCTXSTART = 18, A_HYPCTXEND = 19,
A_MCHSTART = 32, A_MCHEND = 33,
A_FOLDSTART = 64, A_FOLDEND = 65, /*TODO*/
A_INDENT = 128, A_OUTDENT = 129, /*TODO*/

// pattern types
P_SIMPLE = 2,
P_COMPOSITE = 4,
P_BLOCK = 8,

// token types
T_ACTION = 4,
T_SOF = 8, T_FNBL = 9, T_EOL = 16/*=T_NULL*/, T_SOL = 32, T_EOF = 64,
T_EMPTY = 128, T_NONSPACE = 256,
T_INDENTATION = 129, T_DEDENTATION = 130, /*TODO*/
T_SIMPLE = 512,
T_BLOCK = 1024, T_COMMENT = 1025,
T_ALTERNATION = 2048,
T_SEQUENCE = 4096,
T_REPEATED = 8192, T_ZEROORONE = 8193, T_ZEROORMORE = 8194, T_ONEORMORE = 8195,
T_LOOKAHEAD = 16384, T_POSITIVE_LOOKAHEAD = T_LOOKAHEAD, T_NEGATIVE_LOOKAHEAD = 16385,
T_NGRAM = 32768, T_SUBGRAMMAR = 65536,
T_SEQUENCE_OR_NGRAM = T_SEQUENCE|T_NGRAM,
T_COMPOSITE = T_ALTERNATION|T_SEQUENCE|T_REPEATED|T_LOOKAHEAD|T_NGRAM|T_SUBGRAMMAR,

// tokenizer types
tokenTypes = {
action: T_ACTION,
simple: T_SIMPLE,
block: T_BLOCK, comment: T_COMMENT,
subgrammar: T_SUBGRAMMAR,
alternation: T_ALTERNATION,
sequence: T_SEQUENCE,
repeat: T_REPEATED, zeroorone: T_ZEROORONE, zeroormore: T_ZEROORMORE, oneormore: T_ONEORMORE,
positivelookahead: T_POSITIVE_LOOKAHEAD, negativelookahead: T_NEGATIVE_LOOKAHEAD,
ngram: T_NGRAM
},

$T_SOF$ = '$|SOF|$', $T_FNBL$ = '$|NONBLANK|$', $T_SOL$ = '$|SOL|$', $T_EOL$ = '$|EOL|$', $T_NULL$ = '$|ENDLINE|$',
$T_EMPTY$ = '$|EMPTY|$', $T_NONSPACE$ = '$|NONSPACE|$'
//$T_SPACE$ = '$|SPACE|$'
;

var undef = undefined, 
    PROTO = 'prototype', OP = Object[PROTO], Extend = Object.create,
    MAX = Math.max, MIN = Math.min, LOWER = 'toLowerCase', CHAR = 'charAt',
    toString = OP.toString, HAS = OP.hasOwnProperty, IS_ENUM = OP.propertyIsEnumerable,
    
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
    l = i1-i0+1; r=l&15; q=r&1; Fx = new Array(l);
    if ( q ) Fx[0] = F(x[i0], i0, i0, i1);
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
    l = i1-i0+1; r=l&15; q=r&1;
    if ( q ) Fv = F(Fv,x[i0],i0);
    for (i=q; i<r; i+=2)  { k = i0+i; Fv = F(F(Fv,x[k],k),x[k+1],k+1); }
    for (i=r; i<l; i+=16) { k = i0+i; Fv = F(F(F(F(F(F(F(F(F(F(F(F(F(F(F(F(Fv,x[k],k),x[k+1],k+1),x[k+2],k+2),x[k+3],k+3),x[k+4],k+4),x[k+5],k+5),x[k+6],k+6),x[k+7],k+7),x[k+8],k+8),x[k+9],k+9),x[k+10],k+10),x[k+11],k+11),x[k+12],k+12),x[k+13],k+13),x[k+14],k+14),x[k+15],k+15); }
    return Fv;
}

// http://jsperf.com/functional-loop-with-try-catch
function iterate( F, i0, i1, F0 )
{
    if ( i0 > i1 ) return F0;
    else if ( i0 === i1 ) { F(i0, F0, i0, i1); return F0; }
    var l=i1-i0+1, i, k, r=l&15, q=r&1;
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
            if ( !HAS.call(o,k) || !IS_ENUM.call(o,k) ) continue;
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
            if ( !HAS.call(o2,k) || !IS_ENUM.call(o2,k) ) continue;
            if ( HAS.call(o,k) && IS_ENUM.call(o,k) ) 
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

function TRUE( )
{
    return true;
}

function FALSE( )
{
    return false;
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

function del( o, p, soft )
{
    if ( soft ) o[p] = undef; else delete o[p];
    return o;
}

function get_id( ns ) { return (ns||'id_') + (++_id_); }

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
                if ( !HAS.call(o2,p) || !IS_ENUM.call(o2,p) ) continue;
                
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
    if ( !HAS.call(C,CTOR) ) C[CTOR] = function( ){ };
    ctor = C[CTOR]; delete C[CTOR];
    ctor[PROTO] = Merge( Extend(O[PROTO]), C );
    ctor[PROTO][CTOR] = ctor;
    return ctor;
}
    

//
// tokenizer helpers
var escaped_re = /([.*+?^${}()|[\]\/\\\-])/g,
    html_special_re = /[&"'<>]/g,
    de_html_special_re = /&(amp|lt|gt|apos|quot);/g,
    peg_bnf_special_re = /^([.!&\[\]{}()*+?\/|'"]|\s)/,
    default_combine_delimiter = "\\b", 
    combine_delimiter = "(\\s|\\W|$)" /* more flexible than \\b */;

/*
[ '&', 38 ]
[ '<', 60 ]
[ '>', 62 ]
[ '\'', 39 ]
[ '"', 34 ]
de_html_special_num_re = /&#(34|38|39|60|62);/g,
function html_escaper( c )
{
    return "&#" + c.charCodeAt(0) + ";";
}
function html_de_escaper( c, g1 )
{
    return '38' === g1
        ? '&'
        : ('60' === g1
        ? '<'
        : ('62' === g1
        ? '>'
        : ('34' === g1
        ? '"'
        : '\'')))
    ;
}
function de_esc_html( s, num_entities )
{
    return num_entities ? s.replace(de_html_special_num_re, html_de_escaper) : s.replace(de_html_special_re, html_de_escaper_entities);
}
*/

function html_escaper_entities( c )
{
    return '&' === c
        ? '&amp;'
        :(
        '<' === c
        ? '&lt;'
        : (
        '>' === c
        ? '&gt;'
        : (
        '"' === c
        ? '&quot;'
        : '&apos;'
        )))
    ;
}

function html_de_escaper_entities( c )
{
    return '&amp;' === c
        ? '&'
        :(
        '&lt;' === c
        ? '<'
        : (
        '&gt;' === c
        ? '>'
        : (
        '&quot;' === c
        ? '"'
        : '\''
        )))
    ;
}

function html_escaper( c )
{
    return "&#" + c.charCodeAt(0) + ";";
}

function esc_html( s, entities )
{
    return s.replace(html_special_re, entities ? html_escaper_entities : html_escaper);
}

function de_esc_html( s )
{
    return s.replace(de_html_special_re, html_de_escaper_entities);
}


function esc_re( s )
{
    return s.replace(escaped_re, '\\$1');
}

function new_re( re, fl )
{
    fl = fl || {l:0,x:0,i:0,g:0};
    var re = new RegExp(re, (fl.g?'g':'')+(fl.i?'i':''));
    re.xflags = fl;
    return re;
}

function get_delimited( src, delim, esc, collapse_esc )
{
    var i = src.pos||0, l = src.length, dl = delim.length, s = '', escaped;
    if ( !!esc )
    {
        if ( !!collapse_esc )
        {
            while ( i<l )
            {
                escaped = false;
                if ( esc === src[CHAR](i) )
                {
                    escaped = true;
                    i += 1;
                }
                if ( delim === src.substr(i,dl) )
                {
                    i += dl;
                    if ( escaped ) s += delim;
                    else break;
                }
                else
                {
                    s += src[CHAR](i++);
                }
            }
        }
        else
        {
            while ( i<l )
            {
                escaped = false;
                if ( esc === src[CHAR](i) )
                {
                    escaped = true;
                    i += 1;
                    s += esc;
                }
                if ( delim === src.substr(i,dl) )
                {
                    i += dl;
                    if ( escaped ) s += delim;
                    else break;
                }
                else
                {
                    s += src[CHAR](i++);
                }
            }
        }
    }
    else
    {
        while ( i<l )
        {
            if ( delim === src.substr(i,dl) ) { i += dl; break; }
            s += src[CHAR](i++);
        }
    }
    src.pos = i;
    return s;
}

function group_replace( pattern, token, raw, in_regex )
{
    var i, l, c, g, replaced, offset = true === raw ? 0 : 1,
        placeholder = in_regex ? '\\' : '$', placeholder_code = in_regex ? 92 : 36;
    if ( T_STR & get_type(token) )
    {
        if ( in_regex ) token = esc_re( token );
        token = [token, token, token];
        offset = 0;
    }
    l = pattern.length; replaced = ''; i = 0;
    while ( i<l )
    {
        c = pattern[CHAR](i);
        if ( (i+1<l) && (placeholder === c) )
        {
            g = pattern.charCodeAt(i+1);
            if ( placeholder_code === g ) // escaped placeholder character
            {
                replaced += placeholder;
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

function get_re( r, rid, cachedRegexes, boundary )
{
    if ( !r || ((T_NUM|T_REGEX) & get_type(r)) ) return r;
    
    var l = rid ? (rid.length||0) : 0, i, b = "", xflags = {g:0,i:0,x:0,l:0};

    if ( T_STR & get_type(boundary) ) b = boundary;
    else if ( !!boundary ) b = combine_delimiter;
    
    if ( l && (r.substr(0, l) === rid) ) 
    {
        var regexSource = r.substr(l), delim = regexSource[CHAR](0), regexBody, regexID, regex, i, ch;
        
        // allow regex to have delimiters and flags
        // delimiter is defined as the first character after the regexID
        i = regexSource.length;
        while ( i-- )
        {
            ch = regexSource[CHAR](i);
            if ( delim === ch ) break;
            else if ('i' === ch.toLowerCase()) xflags.i = 1;
            else if ('x' === ch.toLowerCase()) xflags.x = 1;
            else if ('l' === ch.toLowerCase()) xflags.l = 1;
        }
        regexBody = regexSource.substring(1, i);
        if ( '^' === regexBody.charAt(0) )
        {
            xflags.l = 1;
            regexID = "^(" + regexBody.slice(1) + ")";
        }
        else
        {
            regexID = "^(" + regexBody + ")";
        }
        regex = regexID;
        if ( xflags.x || xflags.l || xflags.i )
            regexID = (xflags.l?'l':'')+(xflags.x?'x':'')+(xflags.i?'i':'')+'::'+regexID;
        
        if ( !cachedRegexes[ regexID ] )
        {
            regex = new_re( regex, xflags );
            // shared, light-weight
            cachedRegexes[ regexID ] = regex;
        }
        
        return cachedRegexes[ regexID ];
    }
    else if ( !!b )
    {
        regex = regexID = "^(" + esc_re( r ) + ")"+b;
        
        if ( !cachedRegexes[ regexID ] )
        {
            regex = new_re( regex, xflags );
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
    else if ( !!boundary ) b = combine_delimiter;
    combined = map( tokens.sort( by_length ), esc_re ).join( "|" );
    return [ new_re("^(" + combined + ")"+b, {l:0,x:0,i:case_insensitive?1:0}), 1 ];
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

function get_compositematcher( name, tokens, RegExpID, combined, caseInsensitive, cachedRegexes, cachedMatchers, ret_keywords ) 
{
    if ( cachedMatchers[ name ] ) return cachedMatchers[ name ];
    
    var tmp, i, l, l2, array_of_arrays = 0, 
        has_regexs = 0, is_char_list = 1, 
        T1, T2, mtcher, combine = T_STR & get_type(combined) ? true : !!combined;
    
    tmp = make_array( tokens ); l = tmp.length;
    
    if ( 1 === l )
    {
        mtcher = get_simplematcher( name, get_re( tmp[0], RegExpID, cachedRegexes, combined ), 0, cachedMatchers );
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
        
        if ( is_char_list && !combine )
        {
            tmp = tmp.slice().join('');
            tmp.isCharList = 1;
            mtcher = get_simplematcher( name, tmp, 0, cachedMatchers );
        }
        else if ( combine && !(array_of_arrays || has_regexs) )
        {   
            if ( ret_keywords ) ret_keywords.keywords = make_array( tokens ).slice( );
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
            if ( ret_keywords ) ret_keywords.keywords = make_array( tokens ).slice( );
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

var /*regex_pattern_re = /(\\\\)*?\\\d/,*/ extended_regex_re = /(l?i?l?)x(l?i?l?)$/;
function get_blockmatcher( name, tokens, RegExpID, cachedRegexes, cachedMatchers ) 
{
    if ( cachedMatchers[ name ] ) return cachedMatchers[ name ];

    var tmp = make_array_2( tokens ), start = [], end = [];
    
    // build start/end mappings
    iterate(function( i ) {
        var t1, t2, is_regex, is_regex_pattern;
        t1 = get_simplematcher( name + '_0_' + i, get_re( tmp[i][0], RegExpID, cachedRegexes ), i, cachedMatchers );
        if ( tmp[i].length > 1 )
        {
            is_regex = has_prefix( tmp[i][1], RegExpID );
            is_regex_pattern = is_regex && /*regex_pattern_re*/extended_regex_re.test(tmp[i][1]);
            if ( (T_REGEX === t1.ptype) && (T_STR === get_type( tmp[i][1] )) && (is_regex_pattern || !is_regex) )
            {
                if ( is_regex_pattern )
                {
                    t2 = new String(tmp[i][1]);
                    t2.regex_pattern = RegExpID;
                }
                else
                {
                    t2 = tmp[i][1];
                }
            }
            else
            {
                t2 = get_simplematcher( name + '_1_' + i, get_re( tmp[i][1], RegExpID, cachedRegexes ), i, cachedMatchers );
            }
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

function get_autocomplete( tok, autocompletions, type, keywords ) 
{
    var meta = tok.meta || type, case_insesitive = !!(tok.caseInsesitive||tok.ci),
        kws = map(autocompletions, function( word ) {
            return {word:word, meta:meta, ci:case_insesitive};
        });
    keywords.autocomplete = (keywords.autocomplete || []).concat( kws );
    return kws;
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
            if ( !HAS.call(G,t) ) continue;
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
                        else if ( 'nop' === type )
                        {
                            G[id].type = 'action';
                            G[id].nop = true;
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
                    G[id] = {type:'simple', tokens:G[id]};
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
        if ( !HAS.call(G,id) ) continue;
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
                    xtok = Lex[ xtends ] = {type:'simple', tokens:xtok};
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
        if ( !HAS.call(G,id) ) continue;
        tok = G[id];
        if ( tok.type )
        {
            tl = tok.type = tok.type[LOWER]();
            if ( 'action' === tl )
            {
                tok.options = tok.options||{};
            }
            else if ( 'line-block' === tl )
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
                tok.type = 'block';
                tok.multiline = false;
                if ( !tok.escape ) tok.escape = '\\';
                tok.tokens = tok['escaped-line-block'];
                del(tok,'escaped-line-block');
            }
            else if ( tok['escaped-block'] )
            {
                tok.type = 'block';
                tok.multiline = true;
                if ( !tok.escape ) tok.escape = '\\';
                tok.tokens = tok['escaped-block'];
                del(tok,'escaped-block');
            }
            else if ( tok['line-block'] )
            {
                tok.type = 'block';
                tok.multiline = false;
                tok.escape = false;
                tok.tokens = tok['line-block'];
                del(tok,'line-block');
            }
            else if ( tok['comment'] )
            {
                tok.type = 'comment';
                tok.escape = false;
                tok.tokens = tok['comment'];
                del(tok,'comment');
            }
            else if ( tok['block'] )
            {
                tok.type = 'block';
                tok.tokens = tok['block'];
                del(tok,'block');
            }
            else if ( tok['simple'] )
            {
                tok.type = 'simple';
                tok.tokens = tok['simple'];
                del(tok,'simple');
            }
            else if ( tok['nop'] )
            {
                tok.type = 'action';
                tok.options = tok.options||{};
                tok.action = [ 'nop', tok.nop, tok.options ];
                tok.nop = true;
            }
            else if ( tok['error'] )
            {
                tok.type = 'action';
                tok.options = tok.options||{};
                tok.action = [ 'error', tok.error, tok.options ];
                del(tok,'error');
            }
            else if ( HAS.call(tok,'hypercontext') )
            {
                tok.type = 'action';
                tok.options = tok.options||{};
                tok.action = [ !!tok.hypercontext ? 'hypercontext-start' : 'hypercontext-end', tok['hypercontext'], tok.options ];
                del(tok,'hypercontext');
            }
            else if ( HAS.call(tok,'context') )
            {
                tok.type = 'action';
                tok.options = tok.options||{};
                tok.action = [ !!tok.context ? 'context-start' : 'context-end', tok['context'], tok.options ];
                del(tok,'context');
            }
            else if ( tok['indent'] )
            {
                tok.type = 'action';
                tok.options = tok.options||{};
                tok.action = [ 'indent', tok.indent, tok.options ];
                del(tok,'indent');
            }
            else if ( tok['outdent'] )
            {
                tok.type = 'action';
                tok.options = tok.options||{};
                tok.action = [ 'outdent', tok.outdent, tok.options ];
                del(tok,'outdent');
            }
            else if ( tok['define'] )
            {
                tok.type = 'action';
                tok.options = tok.options||{};
                tok.action = [ 'define', T_STR&get_type(tok.define) ? ['*', tok.define] : tok.define, tok.options ];
                del(tok,'define');
            }
            else if ( tok['undefine'] )
            {
                tok.type = 'action';
                tok.options = tok.options||{};
                tok.action = [ 'undefine', T_STR&get_type(tok.undefine) ? ['*', tok.undefine] : tok.undefine, tok.options ];
                del(tok,'undefine');
            }
            else if ( tok['defined'] )
            {
                tok.type = 'action';
                tok.options = tok.options||{};
                tok.action = [ 'defined', T_STR&get_type(tok.defined) ? ['*', tok.defined] : tok.defined, tok.options ];
                del(tok,'defined');
            }
            else if ( tok['notdefined'] )
            {
                tok.type = 'action';
                tok.options = tok.options||{};
                tok.action = [ 'notdefined', T_STR&get_type(tok.notdefined) ? ['*', tok.notdefined] : tok.notdefined, tok.options ];
                del(tok,'notdefined');
            }
            else if ( tok['unique'] )
            {
                tok.type = 'action';
                tok.options = tok.options||{};
                tok.action = [ 'unique', T_STR&get_type(tok.unique) ? ['*', tok.unique] : tok.unique, tok.options ];
                del(tok,'unique');
            }
            else if ( tok['push'] )
            {
                tok.type = 'action';
                tok.options = tok.options||{};
                tok.action = [ 'push', tok.push, tok.options ];
                del(tok,'push');
            }
            else if ( HAS.call(tok,'pop') )
            {
                tok.type = 'action';
                tok.options = tok.options||{};
                tok.action = [ 'pop', tok.pop, tok.options ];
                del(tok,'pop');
            }
            else
            {
                tok.type = 'simple';
            }
        }
        if ( 'action' === tok.type )
        {
            tok.options = tok.options||{};
            tok.options['in-context'] = !!(tok.options['in-context'] || tok['in-context']);
            tok.options['in-hypercontext'] = !!(tok.options['in-hypercontext'] || tok['in-hypercontext']);
            tok.options.ci = tok.ci = !!(tok.options.caseInsesitive || tok.options.ci || tok.caseInsesitive || tok.ci);
            tok.options.autocomplete = !!(tok.options.autocomplete || tok.autocomplete);
            tok.options.mode = tok.options.mode || tok.mode;
        }
        else if ( 'block' === tok.type || 'comment' === tok.type )
        {
            tok.multiline = HAS.call(tok,'multiline') ? !!tok.multiline : true;
            if ( !(T_STR & get_type(tok.escape)) ) tok.escape = false;
        }
        else if ( 'simple' === tok.type )
        {
            //tok.autocomplete = !!tok.autocomplete;
            tok.meta = !!tok.autocomplete && (T_STR & get_type(tok.meta)) ? tok.meta : null;
            //tok.combine = !HAS.call(tok,'combine') ? true : tok.combine;
            tok.ci = !!(tok.caseInsesitive||tok.ci);
        }
    }
    
    // handle Syntax shorthands and defaults
    G = Syntax;
    for (id in G)
    {
        if ( !HAS.call(G,id) ) continue;
        tok = G[id];
        if ( T_OBJ === get_type(tok) && !tok.type )
        {
            if ( tok['ngram'] || tok['n-gram'] )
            {
                tok.type = 'ngram';
                tok.tokens = tok['ngram'] || tok['n-gram'];
                if ( tok['n-gram'] ) del(tok,'n-gram'); else del(tok,'ngram');
            }
            else if ( tok['sequence'] || tok['all']  )
            {
                tok.type = 'sequence';
                tok.tokens = tok['sequence'] || tok['all'];
                if ( tok['all'] ) del(tok,'all'); else del(tok,'sequence');
            }
            else if ( tok['alternation'] || tok['either'] )
            {
                tok.type = 'alternation';
                tok.tokens = tok['alternation'] || tok['either'];
                if ( tok['either'] ) del(tok,'either'); else del(tok,'alternation');
            }
            else if ( tok['zeroOrOne'] )
            {
                tok.type = 'zeroOrOne';
                tok.tokens = tok['zeroOrOne'];
                del(tok,'zeroOrOne');
            }
            else if ( tok['zeroOrMore'] )
            {
                tok.type = 'zeroOrMore';
                tok.tokens = tok['zeroOrMore'];
                del(tok,'zeroOrMore');
            }
            else if ( tok['oneOrMore'] )
            {
                tok.type = 'oneOrMore';
                tok.tokens = tok['oneOrMore'];
                del(tok,'oneOrMore');
            }
            else if ( tok['positiveLookahead'] || tok['lookahead'] )
            {
                tok.type = 'positiveLookahead';
                tok.tokens = tok['positiveLookahead'] || tok['lookahead'];
                if ( tok['lookahead'] ) del(tok,'lookahead'); else del(tok,'positiveLookahead');
            }
            else if ( tok['negativeLookahead'] )
            {
                tok.type = 'negativeLookahead';
                tok.tokens = tok['negativeLookahead'];
                del(tok,'negativeLookahead');
            }
            else if ( tok['subgrammar'] || tok['grammar'] )
            {
                tok.type = 'subgrammar';
                tok.tokens = tok['subgrammar'] || tok['grammar'];
                if ( tok['subgrammar'] ) del(tok,'subgrammar'); else del(tok,'grammar');
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
                    tok.type = 'repeat';
                    tok.repeat = tok.match;
                    del(tok,'match');
                }
            }
            else if ( 'either' === tl )
            {
                tok.type = 'alternation';
            }
            else if ( 'all' === tl )
            {
                tok.type = 'sequence';
            }
            else if ( 'lookahead' === tl )
            {
                tok.type = 'positiveLookahead';
            }
            else if ( 'grammar' === tl )
            {
                tok.type = 'subgrammar';
            }
            if ( 'subgrammar' === tok.type && !tok.tokens ) tok.tokens = id;
        }
    }
    return grammar;
}

function generate_dynamic_autocompletion( state, follows )
{
    follows = follows || [];
    var list, symb, n, entry;
    list = state.ctx;
    while ( list )
    {
        symb = list.val.symb;
        while ( symb )
        {
            entry = symb.val[1];
            if ( entry[7] )
            {
                follows.push( {word:entry[5], meta:(entry[6]||'')+' at ('+(entry[0]+1)+','+(entry[1]+1)+')', ci:entry[8], token:entry[6], pos:[entry[0]+1,entry[1]+1,entry[2]+1,entry[3]+1]} );
            }
            symb = symb.prev;
        }
        symb = list.val.tabl;
        for(n in symb)
        {
            if ( !HAS.call(symb, n) || !symb[n][7] ) continue;
            entry = symb[n];
            follows.push( {word:entry[5], meta:(entry[6]||'')+' at ('+(entry[0]+1)+','+(entry[1]+1)+')', ci:entry[8], token:entry[6], pos:[entry[0]+1,entry[1]+1,entry[2]+1,entry[3]+1]} );
        }
        list = list.prev;
    }
    list = state.hctx;
    while ( list )
    {
        symb = list.val.symb;
        while ( symb )
        {
            entry = symb.val[1];
            if ( entry[7] )
            {
                follows.push( {word:entry[5], meta:(entry[6]||'')+' at ('+(entry[0]+1)+','+(entry[1]+1)+')', ci:entry[8], token:entry[6], pos:[entry[0]+1,entry[1]+1,entry[2]+1,entry[3]+1]} );
            }
            symb = symb.prev;
        }
        symb = list.val.tabl;
        for(n in symb)
        {
            if ( !HAS.call(symb, n) || !symb[n][7] ) continue;
            entry = symb[n];
            follows.push( {word:entry[5], meta:(entry[6]||'')+' at ('+(entry[0]+1)+','+(entry[1]+1)+')', ci:entry[8], token:entry[6], pos:[entry[0]+1,entry[1]+1,entry[2]+1,entry[3]+1]} );
        }
        list = list.prev;
    }
    symb = state.symb;
    while ( symb )
    {
        entry = symb.val[1];
        if ( entry[7] )
        {
            follows.push( {word:entry[5], meta:(entry[6]||'')+' at ('+(entry[0]+1)+','+(entry[1]+1)+')', ci:entry[8], token:entry[6], pos:[entry[0]+1,entry[1]+1,entry[2]+1,entry[3]+1]} );
        }
        symb = symb.prev;
    }
    symb = state.tabl;
    for(n in symb)
    {
        if ( !HAS.call(symb, n) || !symb[n][7] ) continue;
        entry = symb[n];
        follows.push( {word:entry[5], meta:(entry[6]||'')+' at ('+(entry[0]+1)+','+(entry[1]+1)+')', ci:entry[8], token:entry[6], pos:[entry[0]+1,entry[1]+1,entry[2]+1,entry[3]+1]} );
    }
    return follows;
}
function generate_autocompletion( token, follows, hash, dynamic )
{
    hash = hash || {}; follows = follows || [];
    if ( !token || !token.length ) return follows;
    var i, l, j, m, tok, tok2, toks, i0, w;
    for(i=0,l=token.length; i<l; i++)
    {
        tok = token[i];
        if ( !tok ) continue;
        if ( T_SIMPLE === tok.type )
        {
            if ( dynamic && dynamic.length && !!tok.name )
            {
                for (j=dynamic.length-1; j>=0; j--)
                {
                    if ( !!dynamic[j].token && (
                        (tok.name === dynamic[j].token) ||
                        (tok.name.length > dynamic[j].token.length && tok.name.slice(0,dynamic[j].token.length) === dynamic[j].token) ||
                        (tok.name.length < dynamic[j].token.length && tok.name === dynamic[j].token.slice(0,tok.name.length))
                    ) )
                    {
                        dynamic[j].meta = tok.name + ' at ('+dynamic[j].pos[0]+','+dynamic[j].pos[1]+')';
                        follows.push( dynamic[j] );
                        dynamic.splice(j, 1);
                    }
                }
            }
            if ( !!tok.autocompletions )
            {
                for(j=0,m=tok.autocompletions.length; j<m; j++)
                {
                    w = tok.autocompletions[j];
                    if ( !HAS.call(hash,'w_'+w.word) )
                    {
                        follows.push( w );
                        hash['w_'+w.word] = 1;
                    }
                }
            }
            else if ( (T_STR === tok.token.ptype) && (T_STR&get_type(tok.token.pattern)) && (tok.token.pattern.length > 1) )
            {
                if ( !HAS.call(hash,'w_'+tok.token.pattern) )
                {
                    follows.push( {word:''+tok.token.pattern, meta:tok.name, ci:!!tok.ci} );
                    hash['w_'+tok.token.pattern] = 1;
                }
            }
        }
        else if ( T_ALTERNATION === tok.type )
        {
            generate_autocompletion( tok.token, follows, hash, dynamic );
        }
        else if ( T_SEQUENCE_OR_NGRAM & tok.type )
        {
            j = 0; m = tok.token.length;
            do{
            generate_autocompletion( [tok2 = tok.token[j++]], follows, hash, dynamic );
            }while(j < m && (((T_REPEATED & tok2.type) && (1 > tok2.min)) || (T_ACTION === tok2.type)));
        }
        else if ( T_REPEATED & tok.type )
        {
            generate_autocompletion( [tok.token[0]], follows, hash, dynamic );
        }
    }
    return follows;
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

var trailing_repeat_re = /[*+]$/;
function peg_simplify( expression, is_alternation_else_sequence )
{
    return expression.length > 1
    ? iterate(is_alternation_else_sequence
        // simplify e.g x | x .. | x => x etc.. in alternation
        ? function( i, simplified ){
            var current = simplified[simplified.length-1], next = expression[i];
            if ( current === next ) { /* skip*/ }
            else simplified.push( next );
        }
        // simplify e.g x x* => x+, x*x* => x* or x+x+ => x+ etc.. in sequence
        : function( i, simplified ){
            var current = simplified[simplified.length-1], next = expression[i];
            //if ( current+'*' === next ) { simplified[simplified.length-1] = current+'+'; }
            /*else*/ if ( trailing_repeat_re.test(next) && trailing_repeat_re.test(current) && current === next ) { /* skip*/ }
            else simplified.push( next );
        }, 1, expression.length-1, [expression[0]]
    )
    : expression;
}

function parse_peg_bnf_notation( tok, Lex, Syntax )
{
    var alternation, sequence, token, literal, repeat, entry, prev_entry,
        t, c, fl, prev_token, curr_token, stack, tmp,
        modifier = false, modifier_preset;
    
    modifier_preset = !!tok.modifier ? tok.modifier : null;
    t = new String( trim(tok) ); t.pos = 0;
    
    if ( 1 === t.length )
    {
        curr_token = '' + tok;
        if ( !Lex[ curr_token ] && !Syntax[ curr_token ] ) Lex[ curr_token ] = { type:'simple', tokens:tok };
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
                        if ( !Lex[$T_EMPTY$] ) Lex[$T_EMPTY$] = { type:'simple', tokens:0/*T_EMPTY*/ };
                        sequence.push( $T_EMPTY$ );
                    }
                    else if ( '^^' === token )
                    {
                        // interpret as SOF tokenizer
                        if ( !Lex[$T_SOF$] ) Lex[$T_SOF$] = { type:'simple', tokens:T_SOF };
                        sequence.push( $T_SOF$ );
                    }
                    else if ( '^^1' === token )
                    {
                        // interpret as FNBL tokenizer
                        if ( !Lex[$T_FNBL$] ) Lex[$T_FNBL$] = { type:'simple', tokens:T_FNBL };
                        sequence.push( $T_FNBL$ );
                    }
                    else if ( '^' === token )
                    {
                        // interpret as SOL tokenizer
                        if ( !Lex[$T_SOL$] ) Lex[$T_SOL$] = { type:'simple', tokens:T_SOL };
                        sequence.push( $T_SOL$ );
                    }
                    else if ( '$' === token )
                    {
                        // interpret as EOL tokenizer
                        if ( !Lex[$T_EOL$] ) Lex[$T_EOL$] = { type:'simple', tokens:T_EOL };
                        sequence.push( $T_EOL$ );
                    }
                    else
                    {
                        if ( !Lex[token] && !Syntax[token] ) Lex[ token ] = { type:'simple', tokens:token };
                        sequence.push( token );
                    }
                    token = '';
                }
            
                if ( '.' === c /*|| ':' === c*/ )
                {
                    // a dot by itself, not specifying a modifier
                    if ( sequence.length && t.pos < t.length && 
                        !peg_bnf_special_re.test(t[CHAR](t.pos)) ) modifier = true;
                    else token += c;
                }
                
                else if ( ('"' === c) || ('\'' === c) )
                {
                    // literal token, quoted
                    literal = get_delimited( t, c, '\\', 1 );
                    if ( literal.length )
                    {
                        curr_token = '' + literal;
                        if ( !Lex[curr_token] ) Lex[curr_token] = { type:'simple', tokens:literal };
                        sequence.push( curr_token );
                    }
                    else
                    {
                        // interpret as non-space tokenizer
                        if ( !Lex[$T_NONSPACE$] ) Lex[$T_NONSPACE$] = { type:'simple', tokens:'' };
                        sequence.push( $T_NONSPACE$ );
                    }
                }
                
                else if ( '[' === c )
                {
                    // start of character select
                    /*if ( !token.length )
                    {*/
                    c = t[CHAR]( t.pos+1 );
                    if ( '^' === c ) t.pos++;
                    else c = '';
                    literal = get_delimited( t, ']', '\\', 0 );
                    curr_token = '[' + c+literal + ']';
                    if ( !Lex[curr_token] )
                        Lex[curr_token] = {
                            type:'simple',
                            tokens:new_re("^(["+c+/*esc_re(*/literal/*)*/+"])")
                            //                                          negative match,      else   positive match
                        /*literal.split('')*/};
                    sequence.push( curr_token );
                    /*}
                    else token += c;*/
                }
                
                else if ( ']' === c )
                {
                    // end of character select, should be handled in previous case
                    // added here just for completeness
                    token += c;
                    continue;
                }
                
                else if ( '/' === c )
                {
                    // literal regex token
                    /*if ( !token.length )
                    {*/
                    literal = get_delimited( t, c, '\\', 0 ); fl = '';
                    if ( literal.length )
                    {
                        if ( t.pos < t.length && 'i' === t[CHAR](t.pos) ) { t.pos++; fl = 'i'; }
                        curr_token = '/' + literal + '/' + fl;
                        if ( !Lex[curr_token] ) Lex[curr_token] = { type:'simple', tokens:new_re("^("+literal+")",{l:0,x:0,i:'i'===fl}) };
                        sequence.push( curr_token );
                    }
                    /*}
                    else token += c;*/
                }
                
                else if ( ('*' === c) || ('+' === c) || ('?' === c) )
                {
                    // repeat modifier, applies to token that comes before
                    if ( sequence.length )
                    {
                        prev_token = sequence[sequence.length-1];
                        curr_token = '' + prev_token + c;
                        if ( !Syntax[ curr_token ] )
                            Syntax[ curr_token ] = {
                                type:'*' === c ? 'zeroOrMore' : ('+' === c ? 'oneOrMore' : 'zeroOrOne'),
                                tokens:[prev_token]
                            };
                        sequence[sequence.length-1] = curr_token;
                    }
                    else token += c;
                }
                
                else if ( '{' === c )
                {
                    // literal repeat modifier, applies to token that comes before
                    if ( sequence.length )
                    {
                        repeat = get_delimited( t, '}', 0, 0 );
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
                    else token += c;
                }
                
                else if ( '}' === c )
                {
                    // literal repeat end modifier, should be handled in previous case
                    // added here just for completeness
                    token += c;
                    continue;
                }
                
                else if ( ('&' === c) || ('!' === c) )
                {
                    // lookahead modifier, applies to token that comes before
                    if ( sequence.length )
                    {
                        prev_token = sequence[sequence.length-1];
                        curr_token = '' + prev_token + c;
                        if ( !Syntax[ curr_token ] )
                            Syntax[ curr_token ] = {
                                type:'!' === c ? 'negativeLookahead' : 'positiveLookahead',
                                tokens:[prev_token]
                            };
                        sequence[sequence.length-1] = curr_token;
                    }
                    else token += c;
                }
                
                else if ( '|' === c )
                {
                    modifier = false;
                    // alternation
                    sequence = peg_simplify( sequence );
                    if ( sequence.length > 1 )
                    {
                        curr_token = '' + sequence.join( ' ' );
                        if ( !Syntax[curr_token] ) Syntax[curr_token] = { type:'sequence', tokens:sequence };
                        alternation.push( curr_token );
                    }
                    else if ( sequence.length )
                    {
                        alternation.push( sequence[0] );
                    }
                    else
                    {
                        token += c;
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
                    sequence = peg_simplify( sequence );
                    if ( sequence.length > 1 )
                    {
                        curr_token = '' + sequence.join( ' ' );
                        if ( !Syntax[curr_token] ) Syntax[curr_token] = { type:'sequence', tokens:sequence };
                        alternation.push( curr_token );
                    }
                    else if ( sequence.length )
                    {
                        alternation.push( sequence[0] );
                    }
                    sequence = [];
                    
                    alternation = peg_simplify( alternation, 1 );
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
                if ( !Lex[$T_EMPTY$] ) Lex[$T_EMPTY$] = { type:'simple', tokens:0/*T_EMPTY*/ };
                sequence.push( $T_EMPTY$ );
            }
            else if ( '^^' === token )
            {
                // interpret as SOF tokenizer
                if ( !Lex[$T_SOF$] ) Lex[$T_SOF$] = { type:'simple', tokens:T_SOF };
                sequence.push( $T_SOF$ );
            }
            else if ( '^^1' === token )
            {
                // interpret as FNBL tokenizer
                if ( !Lex[$T_FNBL$] ) Lex[$T_FNBL$] = { type:'simple', tokens:T_FNBL };
                sequence.push( $T_FNBL$ );
            }
            else if ( '^' === token )
            {
                // interpret as SOL tokenizer
                if ( !Lex[$T_SOL$] ) Lex[$T_SOL$] = { type:'simple', tokens:T_SOL };
                sequence.push( $T_SOL$ );
            }
            else if ( '$' === token )
            {
                // interpret as EOL tokenizer
                if ( !Lex[$T_EOL$] ) Lex[$T_EOL$] = { type:'simple', tokens:T_EOL };
                sequence.push( $T_EOL$ );
            }
            else
            {
                if ( !Lex[token] && !Syntax[token] ) Lex[ token ] = { type:'simple', tokens:token };
                sequence.push( token );
            }
        }
        token = '';
        
        sequence = peg_simplify( sequence );
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
        
        alternation = peg_simplify( alternation, 1 );
        if ( alternation.length > 1 )
        {
            curr_token = '' + alternation.join( ' | ' );
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
    var $token$ = null, $msg$ = null, $modifier$ = null, $type$, $tokens$, t, tt, token, combine, autocompletions;
    
    if ( T_SOF === tokenID || T_FNBL === tokenID || T_SOL === tokenID || T_EOL === tokenID )
    {
        // SOF/FNBL/SOL/EOL Token
        return new tokenizer( tokenID, T_SOF === tokenID
                                            ? $T_SOF$
                                            : (T_FNBL === tokenID
                                                ? $T_FBNL$
                                                : (T_SOL === tokenID ? $T_SOL$ : $T_EOL$)
                                            ), tokenID, $msg$ );
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
        if ( !Syntax[ tokenID ] ) Syntax[ tokenID ] = { type:'ngram', tokens:t };
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
        if ( T_SOF === $tokens$ || T_FNBL === $tokens$ || T_SOL === $tokens$ || T_EOL === $tokens$ || 
            false === $tokens$ || 0/*T_EMPTY*/ === $tokens$ )
        {
            // SOF/FNBL/SOL/EOL/EMPTY Token
            $token$ = new tokenizer( $tokens$ || T_EMPTY , tokenID, $tokens$ || 0, $msg$ );
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
        token.options = token.options||{};
        token.options['in-context'] = !!(token.options['in-context'] || token['in-context']);
        token.options['in-hypercontext'] = !!(token.options['in-hypercontext'] || token['in-hypercontext']);
        token.options.ci = token.ci = !!(token.options.caseInsesitive || token.options.ci || token.caseInsesitive || token.ci);
        token.options.autocomplete = !!(token.options.autocomplete || token.autocomplete);
        token.options.mode = token.options.mode || token.mode;
        
        if ( !HAS.call(token,'action') )
        {
            if ( HAS.call(token,'nop') ) token.action = [A_NOP, token.nop, token['options']];
            else if ( HAS.call(token,'error') ) token.action = [A_ERROR, token.error, token['options']];
            else if ( HAS.call(token,'context') ) token.action = [!!token.context?A_CTXSTART:A_CTXEND, token['context'], token['options']];
            else if ( HAS.call(token,'hypercontext') ) token.action = [!!token.hypercontext?A_HYPCTXSTART:A_HYPCTXEND, token['hypercontext'], token['options']];
            else if ( HAS.call(token,'context-start') ) token.action = [A_CTXSTART, token['context-start'], token['options']];
            else if ( HAS.call(token,'context-end') ) token.action = [A_CTXEND, token['context-end'], token['options']];
            else if ( HAS.call(token,'hypercontext-start') ) token.action = [A_HYPCTXSTART, token['hypcontext-start'], token['options']];
            else if ( HAS.call(token,'hypercontext-end') ) token.action = [A_HYPCTXEND, token['hypcontext-end'], token['options']];
            else if ( HAS.call(token,'push') ) token.action = [A_MCHSTART, token.push, token['options']];
            else if ( HAS.call(token,'pop') ) token.action = [A_MCHEND, token.pop, token['options']];
            else if ( HAS.call(token,'define') ) token.action = [A_DEFINE, T_STR&get_type(token.define)?['*',token.define]:token.define, token['options']];
            else if ( HAS.call(token,'undefine') ) token.action = [A_UNDEFINE, T_STR&get_type(token.undefine)?['*',token.undefine]:token.undefine, token['options']];
            else if ( HAS.call(token,'defined') ) token.action = [A_DEFINED, T_STR&get_type(token.defined)?['*',token.defined]:token.defined, token['options']];
            else if ( HAS.call(token,'notdefined') ) token.action = [A_NOTDEFINED, T_STR&get_type(token.notdefined)?['*',token.notdefined]:token.notdefined, token['options']];
            else if ( HAS.call(token,'unique') ) token.action = [A_UNIQUE, T_STR&get_type(token.unique)?['*',token.unique]:token.unique, token['options']];
            else if ( HAS.call(token,'indent') ) token.action = [A_INDENT, token.indent, token['options']];
            else if ( HAS.call(token,'outdent') ) token.action = [A_OUTDENT, token.outdent, token['options']];
        }
        else
        {
            if ( 'nop' === token.action[0] ) token.action[0] = A_NOP;
            else if ( 'error' === token.action[0] ) token.action[0] = A_ERROR;
            else if ( 'context-start' === token.action[0] ) token.action[0] = A_CTXSTART;
            else if ( 'context-end' === token.action[0] ) token.action[0] = A_CTXEND;
            else if ( 'hypercontext-start' === token.action[0] ) token.action[0] = A_HYPCTXSTART;
            else if ( 'hypercontext-end' === token.action[0] ) token.action[0] = A_HYPCTXEND;
            else if ( 'push' === token.action[0] ) token.action[0] = A_MCHSTART;
            else if ( 'pop' === token.action[0] ) token.action[0] = A_MCHEND;
            else if ( 'define' === token.action[0] ) token.action[0] = A_DEFINE;
            else if ( 'undefine' === token.action[0] ) token.action[0] = A_UNDEFINE;
            else if ( 'defined' === token.action[0] ) token.action[0] = A_DEFINED;
            else if ( 'notdefined' === token.action[0] ) token.action[0] = A_NOTDEFINED;
            else if ( 'unique' === token.action[0] ) token.action[0] = A_UNIQUE;
            else if ( 'indent' === token.action[0] ) token.action[0] = A_INDENT;
            else if ( 'outdent' === token.action[0] ) token.action[0] = A_OUTDENT;
        }
        if ( false === token.msg ) $msg$ = false;
        // NOP action, no action
        if ( token.nop ) token.action[0] = A_NOP;
        //if ( token.action.length < 3 ) token.action.push( token.options );
        $token$ = new tokenizer( T_ACTION, tokenID, token.action.slice(), $msg$, $modifier$ );
        $token$.ci = !!(token.options.caseInsensitive || token.options.ci || token.caseInsensitive || token.ci);
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = $token$;
    }
    
    else
    {
        $tokens$ = make_array( $tokens$ );
        
        if ( T_SIMPLE & $type$ )
        {
            if ( !!token.autocomplete )
            {
                autocompletions = get_autocomplete(
                    token,
                    T_STR_OR_ARRAY&get_type(token.autocomplete) ? make_array( token.autocomplete ) : $tokens$,
                    tokenID,
                    keywords
                );
            }
            else
            {
                autocompletions = null;
            }
            
            var kws = {};
            // combine by default if possible using default word-boundary delimiter
            combine = 'undefined' !== typeof token.combine ? token.combine : (T_ARRAY&get_type(token.tokens) ? true : false);
            $token$ = new tokenizer( T_SIMPLE, tokenID,
                        get_compositematcher( tokenID, $tokens$.slice(), RegExpID, combine,
                        !!(token.caseInsensitive||token.ci), cachedRegexes, cachedMatchers, kws ), 
                        $msg$, $modifier$, null, autocompletions
                    );
            if ( kws.keywords ) $token$.keywords = kws.keywords.join('|');
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = $token$;
            
            // token has excepted matches/tokens, e.g keywords
            if ( null != token.except )
            {
                var token_except = make_array( token.except ), i, l = token_except.length, except = [ ], tok_exce;
                for(i=0; i<l; i++)
                {
                    if ( !!token_except[i] )
                    {
                        tok_exce = get_tokenizer( token_except[i], RegExpID, Lex, Syntax, Style, 
                                                cachedRegexes, cachedMatchers, cachedTokens, 
                                                interleavedTokens, comments, keywords );
                        if ( tok_exce ) except.push( tok_exce );
                    }
                }
                if ( except.length ) $token$.except = except;
            }
        }
        
        else if ( T_BLOCK & $type$ )
        {
            if ( T_COMMENT === $type$ ) get_comments( token, comments );

            $token$ = new tokenizer( $type$, tokenID,
                        get_blockmatcher( tokenID, $tokens$.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
                        $msg$
                    );
            $token$.empty = HAS.call(token,'empty') ? !!token.empty : true;
            $token$.mline = HAS.call(token,'multiline') ? !!token.multiline : true;
            $token$.esc = HAS.call(token,'escape') ? token.escape : false;
            // allow block delims / block interior to have different styles
            $token$.inter = !!Style[ tokenID + '.inside' ];
            if ( (T_COMMENT === $type$) && token.interleave ) interleavedTokens.push( t_clone( $token$ ) );
            if ( $modifier$ ) $token$.modifier = $modifier$;
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = $token$;
        }
        
        else if ( T_COMPOSITE & $type$ )
        {
            if ( T_SUBGRAMMAR === $type$ )
            {
                // pre-cache tokenizer to handle recursive calls to same tokenizer
                cachedTokens[ tokenID ] = new tokenizer( T_SUBGRAMMAR, tokenID, $tokens$, $msg$, $modifier$ );
            }
            
            else if ( T_NGRAM === $type$ )
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
                if ( T_POSITIVE_LOOKAHEAD === $type$ || T_NEGATIVE_LOOKAHEAD === $type$ )
                {
                    $token$ = new tokenizer( $type$, tokenID, null, $msg$, $modifier$ );
                }
                else if ( (T_REPEATED & $type$) && (T_ARRAY & get_type( token.repeat )) )
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

function get_block_types( grammar, the_styles )
{
    var Style = grammar.Style, Lex = grammar.Lex, Syntax = grammar.Syntax, t, T,
        blocks = [], visited = {};
    for (t in Style )
    {
        if ( !HAS.call(Style,t) ) continue;
        T = Lex[t] || Syntax[t];
        if ( T && ('block' == T.type || 'comment' === T.type) )
        {
            if ( the_styles && (Style[ t+'.inside' ]||Style[ t ]) )
            {
                t = Style[ t+'.inside' ] || Style[ t ];
                if ( !HAS.call(visited,t) )
                {
                    blocks.push( t );
                    visited[t] = 1;
                }
            }
            else if ( !the_styles )
            {
                if ( !HAS.call(visited,t) )
                {
                    blocks.push( t );
                    visited[t] = 1;
                }
            }
        }
    }
    return blocks;
}

function preprocess_and_parse_grammar( grammar )
{
    var processed = {}; // for recursive references
    grammar.Lex = grammar.Lex || {}; grammar.Syntax = grammar.Syntax || {};
    grammar = preprocess_grammar( grammar );
    if ( grammar.Parser && grammar.Parser.length )
    {
        iterate( function process( i, T ) {
            var id = T[ i ], t, token, type, tokens;
            if ( processed[id] ) return;
            if ( T_ARRAY & get_type( id ) )
            {
                // literal n-gram as array
                t = id; id = "NGRAM_" + t.join("_");
                if ( !grammar.Syntax[ id ] ) grammar.Syntax[ id ] = {type:'ngram', tokens:t};
            }
            token = get_backreference( id, grammar.Lex, grammar.Syntax );
            if ( T_STR & get_type( token ) )
            {
                token = parse_peg_bnf_notation( token, grammar.Lex, grammar.Syntax );
                token = grammar.Lex[ token ] || grammar.Syntax[ token ] || null;
            }
            if ( token )
            {
                processed[id] = token;
                type = token.type ? tokenTypes[ token.type[LOWER]( ).replace( dashes_re, '' ) ] || T_SIMPLE : T_SIMPLE;
                if ( T_COMPOSITE & type ) iterate( process, 0, token.tokens.length-1, token.tokens );
            }
        }, 0, grammar.Parser.length-1, grammar.Parser );
    }
    return grammar;
}

function parse_grammar( grammar ) 
{
    var RegExpID, tokens,
        Extra, Style, Fold, Match, Lex, Syntax, 
        cachedRegexes, cachedMatchers, cachedTokens, 
        interleavedTokens, comments, keywords;
    
    // grammar is parsed, return it, avoid reparsing already parsed grammars
    if ( grammar.__parsed ) return grammar;
    
    //grammar = clone( grammar );
    RegExpID = grammar.RegExpID || null;
    Extra = grammar.Extra ? clone(grammar.Extra) : { };
    Style = grammar.Style ? clone(grammar.Style) : { };
    Fold = /*grammar.Fold ||*/ null;
    Match = /*grammar.Match ||*/ null;
    Lex = grammar.Lex ? clone(grammar.Lex) : { };
    Syntax = grammar.Syntax ? clone(grammar.Syntax) : { };
    
    cachedRegexes = { }; cachedMatchers = { }; cachedTokens = { }; 
    comments = { }; keywords = { }; interleavedTokens = [ ];
    
    tokens = grammar.Parser ? clone(grammar.Parser) : [ ];
    
    grammar = preprocess_grammar({
        Style           : Style,
        Fold            : Fold,
        Match           : Match,
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

function t_match( t, stream, eat, any_match )
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
        if ( match = t_match( start, stream, eat, any_match ) )
        {
            // use the token key to get the associated endMatcher
            end = ends[ match[0] ];
            T = get_type( end ); T0 = start.pattern[ match[0] ].ptype;
            
            // regex group number given, get the matched group pattern for the ending of this block
            // string replacement pattern given, get the proper pattern for the ending of this block
            if ( (T_REGEX === T0) && (T_STR_OR_NUM & T) )
            {
                // the regex is wrapped in an additional group, 
                // add 1 to the requested regex group transparently
                if ( end.regex_pattern )
                {
                    // dynamicaly-created regex with substistution group as well
                    m = group_replace( end, match[1]/*, 0, 1*/ );
                    end = new matcher( P_SIMPLE, name+'_End', get_re(m, end.regex_pattern, {}), T_REGEX );
                }
                else
                {
                    // dynamicaly-created string with substistution group as well
                    m = T_NUM & T ? match[1][ end+1 ] : group_replace( end, match[1] );
                    end = new matcher( P_SIMPLE, name+'_End', m, m.length>1 ? T_STR : T_CHAR );
                }
            }
            return end;
        }
    }
    else if ( P_COMPOSITE === PT )
    {
        for (i=0,n=pattern.length; i<n; i++)
        {
            // each one is a matcher in its own
            m = t_match( pattern[ i ], stream, eat, any_match );
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
            m = pattern[0].xflags.l ? stream.match( pattern[0] ) : stream.slice( stream.pos ).match( pattern[0] );
            if ( m && (0 === m.index) )
            {
                if ( false !== eat ) stream.mov( m[ pattern[1]||0 ].length );
                return [ key, pattern[1] > 0 ? m[pattern[1]] : m ];
            }
        }
        else if ( T_CHARLIST === type )
        {
            if ( true === any_match )
            {
                m = -1;
                var mm, cc;
                for(n=pattern.length-1; n>=0; n--)
                {
                    mm = stream.indexOf(pattern[CHAR](n), stream.pos);
                    if ( -1 < mm && (-1 === m || mm < m) ) 
                    {
                        m = mm; cc = pattern[CHAR](n);
                    }
                }
                if ( -1 < m ) 
                {
                    if ( false !== eat ) stream.pos = m+1;
                    return [ key, cc ];
                }
            }
            else
            {
                m = stream[CHAR](stream.pos) || null;
                if ( m && (-1 < pattern.indexOf( m )) ) 
                {
                    if ( false !== eat ) stream.mov( 1 );
                    return [ key, m ];
                }
            }
        }
        else if ( T_CHAR === type )
        {
            if ( true === any_match )
            {
                m = stream.indexOf(pattern, stream.pos);
                if ( -1 < m ) 
                {
                    if ( false !== eat ) stream.pos = m+1;
                    return [ key, pattern ];
                }
            }
            else
            {
                m = stream[CHAR](stream.pos) || null;
                if ( pattern === m ) 
                {
                    if ( false !== eat ) stream.mov( 1 );
                    return [ key, m ];
                }
            }
        }
        else if ( T_STR === type ) // ?? some pattern is undefined !!!!!!!!!
        {
            n = pattern.length;
            if ( true === any_match )
            {
                m = stream.indexOf(pattern, stream.pos);
                if ( -1 < m ) 
                {
                    if ( false !== eat ) stream.pos = m+n;
                    return [ key, pattern ];
                }
            }
            else
            {
                if ( pattern === stream.substr(stream.pos, n) ) 
                {
                    if ( false !== eat ) stream.mov( n );
                    return [ key, pattern ];
                }
            }
        }
    }
    return false;
}

function Stack( val, prev/*, next*/ )
{
    this.val = val || null;
    /*if ( prev && next )
    {
        this.prev = prev; this.next = next;
        prev.next = next.prev = this;
    }
    else*/ if ( prev )
    {
        //this.next = null;
        /*if ( prev.next )
        {
            prev.next.prev = this;
            this.next = prev.next;
        }*/
        this.prev = prev;
        //prev.next = this;
    }
    /*else if ( next )
    {
        this.prev = null;
        if ( next.prev )
        {
            next.prev.next = this;
            this.prev = next.prev;
        }
        this.next = next;
        next.prev = this;
    }*/
    else
    {
        this.prev = null;
        //this.next = null;
    }
}

function tokenizer( type, name, token, msg, modifier, except, autocompletions, keywords )
{
    var self = this;
    self.type = type;
    self.name = name;
    self.token = token;
    self.modifier = modifier || null;
    self.except = except || null;
    self.autocompletions = autocompletions || null;
    self.keywords = keywords || null;
    self.pos = null;
    self.msg = false === msg ? false : (msg || null);
    self.$msg = null;
    self.status = 0;
    self.empty = false; self.ci = false; self.mline = true; self.esc = false; self.inter = false;
    self.found = 0; self.min = 0; self.max = 1; self.i0 = 0;
    self.$id = null;
}

function s_token( )
{
    var t = this;
    t.T = 0;
    t.id = null;
    t.type = null;
    t.match = null;
    t.str = '';
    t.pos = null;
    t.block = null;
    t.space = null;
}

function t_clone( t, required, modifier, $id )
{
    var tt = new tokenizer( t.type, t.name, t.token, t.msg, t.modifier, t.except, t.autocompletions, t.keywords );
    tt.empty = t.empty; tt.ci = t.ci; tt.mline = t.mline; tt.esc = t.esc; tt.inter = t.inter;
    tt.found = t.found; tt.min = t.min; tt.max = t.max; tt.i0 = t.i0;
    if ( required ) tt.status |= REQUIRED;
    if ( modifier ) tt.modifier = modifier;
    if ( $id ) tt.$id = $id;
    return tt;
}

/*function t_dispose( t )
{
    t.type = null;
    t.name = null;
    t.token = null;
    t.modifier = null;
    t.except = null;
    t.autocompletions = null;
    t.keywords = null;
    t.pos = null;
    t.msg = null; t.$msg = null;
    t.status = null;
    t.ci = null; t.mline = null; t.esc = null; t.inter = null;
    t.found = null; t.min = null; t.max = t.i0 = null;
    t.$id = null;
}*/

function t_err( t )
{
    var T = t.name;
    return t.$msg
        ? t.$msg
        : (
            t.status & REQUIRED
            ? 'Token "'+T+'"'+(t.keywords?': '+t.keywords:'')+' Expected'
            : 'Syntax Error: "'+T+'"'
        );
}

function error_( state, l1, c1, l2, c2, t, err )
{
    if ( (state.status & ERRORS) && state.err )
    state.err[ ''+l1+'_'+c1+'_'+l2+'_'+c2+'_'+(t?t.name:'ERROR') ] = [ l1, c1, l2, c2, err || t_err( t ) ];
    //return state;
}

function find_key( list, key, hash )
{
    var match = null;
    if ( hash )
    {
        if ( list && HAS.call(list,key) )
        {
            match = {list:list, key:key, val:list[key]};
        }
    }
    else
    {
        var next = null, root = list;
        while ( list )
        {
            if ( key === list.val[0] )
            {
                match = {list:root, node:list, nodePrev:list.prev, nodeNext:next, key:key, val:list.val[1]};
                break;
            }
            next = list; list = list.prev;
        }
    }
    return match;
}

function add_key( list, key, val, hash )
{
    if ( hash )
    {
        list[key] = val;
        return list;
    }
    else
    {
        return new Stack([key,val], list);
    }
}

function del_key( match, hash )
{
    if ( hash )
    {
        delete match.list[match.key];
    }
    else
    {
        if ( match.nodeNext )
        {
            match.nodeNext.prev = match.nodePrev;
        }
        else
        {
            match.list = match.list.prev;
        }
    }
    return match.list;
}

function push_at( state, pos, token )
{
    if ( state.stack === pos )
    {
        pos = state.stack = new Stack( token, state.stack );
    }
    else
    {
        var ptr = state.stack;
        while ( ptr && (ptr.prev !== pos) ) ptr = ptr.prev;
        pos = new Stack(token, pos);
        if ( ptr) ptr.prev = pos;
    }
    return pos;
}

function empty( state, $id )
{
    // http://dvolvr.davidwaterston.com/2013/06/09/restating-the-obvious-the-fastest-way-to-truncate-an-array-in-javascript/
    if ( true === $id )
    {
        // empty whole stack
        state.stack = null;
    }
    else if ( $id )
    {
        // empty only entries associated to $id
        while ( state.stack && state.stack.val.$id === $id ) state.stack = state.stack.prev;
    }
    /*else if ( count )
    {
        // just pop one
        stack.length =  count-1;
    }*/
    return state;
}

function stack_clone( stack, deep )
{
    if ( null == stack ) return null;
    if ( deep )
    {
        var stack2 = new Stack( stack.val ), ptr2 = stack2, ptr = stack;
        while( ptr.prev )
        {
            ptr2.prev = new Stack( ptr.prev.val );
            ptr = ptr.prev; ptr2 = ptr2.prev;
        }
        return stack2;
    }
    else
    {
        return stack;
    }
}

function err_recover( state, stream, token, tokenizer )
{
    //var just_space = false;
    // empty the stack of the syntax rule group of this tokenizer
    //empty( stack, tokenizer.$id /*|| true*/ );
    
    // skip this
    //if ( tokenizer.pos > stream.pos ) stream.pos = tokenizer.pos;
    //else if ( !stream.nxt( true ) ) { stream.spc( ); just_space = true; }
    
    var stack_pos, stream_pos, stream_pos2, tok, depth,
        recover_stream = Infinity, recover_stack = null, recover_depth = Infinity;
    stream_pos = stream.pos;
    stream.spc( );
    stream_pos2 = stream.pos;
    stack_pos = state.stack;
    if ( stream.pos < stream.length )
    {
        // try to recover in a state with:
        // 1. the closest stream position that matches a tokenizer in the stack (more important)
        // 2. and the minimum number of stack tokenizers to discard (less important)
        depth = 0;
        while( stack_pos )
        {
            tok = stack_pos.val;
            if ( tok.$id !== tokenizer.$id ) break;
            while( (T_ACTION !== tok.type) && !tokenize(tok, stream, state, token) )
            {
                stream.pos = tok.pos > stream.pos ? tok.pos : stream.pos+1;
                state.stack = stack_pos;
                if ( stream.pos >= stream.length ) break;
            }
            state.stack = stack_pos;
            
            if ( (stream.pos < stream.length) && (recover_stream > stream.pos) )
            {
                recover_stream = stream.pos;
                recover_stack = stack_pos;
                recover_depth = depth;
            }
            else if ( (recover_stream === stream.pos) && (depth < recover_depth) )
            {
                recover_stream = stream.pos;
                recover_stack = stack_pos;
                recover_depth = depth;
            }
            
            stream.pos = stream_pos2;
            stack_pos = stack_pos.prev;
            depth++;
        }
        
        if ( recover_stream < stream.length )
        {
            stream.pos = recover_stream;
            state.stack = recover_stack;
        }
        else
        {
            stream.end( );
            state.stack = null;
        }
    }
    /*else
    {
    }*/
    return (stream_pos2 >= stream_pos) && (stream.pos === stream_pos2);
}

function tokenize( t, stream, state, token )
{
    //console.log( t );
    if ( !t ) return false;
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
    t, t0, ns, msg, queu, symb, found, raw = false,
    l1, c1, l2, c2, in_ctx, in_hctx, err, t_str, is_block,
    options, hash, list, no_state_errors = !(state.status & ERRORS);

    self.status = 0; self.$msg = null;

    // do action only if state.status handles (action) errors, else dont clutter
    if ( /*no_state_errors ||*/ !action_def || !token || !token.pos ) return true;
    is_block = !!(T_BLOCK & token.T);
    // NOP action, return OR partial block not completed yet, postpone
    if ( A_NOP === action_def[ 0 ] || is_block && !token.block ) return true;

    action = action_def[ 0 ]; t = action_def[ 1 ]; options = action_def[ 2 ] || {}; msg = self.msg;
    in_ctx = options['in-context']; in_hctx = options['in-hypercontext'];
    
    if ( is_block /*&& token.block*/ )
    {
        t_str = token.block.match || token.block.str;
        l1 = token.block.pos[0][0];     c1 = token.block.pos[0][1];
        l2 = token.block.pos[0][2];     c2 = token.block.pos[0][3];
        raw = true;
    }
    else
    {
        t_str = token.match || token.str;
        l1 = token.pos[0];              c1 = token.pos[1];
        l2 = token.pos[2];              c2 = token.pos[3];
        raw = false;
    }

    if ( A_CTXEND === action )
    {
        state.ctx = state.ctx ? state.ctx.prev : null;
    }

    else if ( A_CTXSTART === action )
    {
        state.ctx = new Stack({tabl:{},symb:null,queu:null}, state.ctx);
    }

    else if ( A_HYPCTXEND === action )
    {
        state.hctx = state.hctx ? state.hctx.prev : null;
    }

    else if ( A_HYPCTXSTART === action )
    {
        state.hctx = new Stack({tabl:{},symb:null,queu:null}, state.hctx);
    }

    else if ( A_DEFINE === action )
    {
        hash = "hash" === options.mode;
        list = hash ? "tabl" : "symb";
        t0 = t[1]; ns = t[0];
        t0 = group_replace( t0, t_str, raw );
        if ( case_insensitive ) t0 = t0[LOWER]();
        ns += '::'+t0;
        if ( in_hctx && state.hctx )
        {
            found = find_key(state.hctx.val[list], ns, hash);
        }
        else if ( in_ctx && state.ctx )
        {
            found = find_key(state.ctx.val[list], ns, hash);
        }
        else
        {
            found = find_key(state[list], ns, hash);
        }
        if ( !found )
        {
            if ( in_hctx && state.hctx )
                state.hctx.val[list] = add_key(state.hctx.val[list], ns, [l1, c1, l2, c2, ns, t0, token.type, !!options.autocomplete, case_insensitive], hash);
            else if ( in_ctx && state.ctx )
                state.ctx.val[list] = add_key(state.ctx.val[list], ns, [l1, c1, l2, c2, ns, t0, token.type, !!options.autocomplete, case_insensitive], hash);
            else
                state[list] = add_key(state[list], ns, [l1, c1, l2, c2, ns, t0, token.type, !!options.autocomplete, case_insensitive], hash);
        }
    }
    
    else if ( A_UNDEFINE === action )
    {
        hash = "hash" === options.mode;
        list = hash ? "tabl" : "symb";
        t0 = t[1]; ns = t[0];
        t0 = group_replace( t0, t_str, raw );
        if ( case_insensitive ) t0 = t0[LOWER]();
        ns += '::'+t0;
        if ( in_hctx && state.hctx )
        {
            found = find_key(state.hctx.val[list], ns, hash);
        }
        else if ( in_ctx && state.ctx )
        {
            found = find_key(state.ctx.val[list], ns, hash);
        }
        else
        {
            found = find_key(state[list], ns, hash);
        }
        if ( found )
        {
            if ( in_hctx && state.hctx )
                state.hctx.val[list] = del_key( found, hash );
            else if ( in_ctx && state.ctx )
                state.ctx.val[list] = del_key( found, hash );
            else
                state[list] = del_key( found, hash );
        }
    }
    
    else if ( A_DEFINED === action )
    {
        hash = "hash" === options.mode;
        list = hash ? "tabl" : "symb";
        t0 = t[1]; ns = t[0];
        t0 = group_replace( t0, t_str, raw );
        if ( case_insensitive ) t0 = t0[LOWER]();
        ns += '::'+t0;
        if ( in_hctx && state.hctx )
        {
            found = find_key(state.hctx.val[list], ns, hash);
        }
        else if ( in_ctx && state.ctx )
        {
            found = find_key(state.ctx.val[list], ns, hash);
        }
        else
        {
            found = find_key(state[list], ns, hash);
        }
        if ( !found )
        {
            // undefined
            if ( false !== msg )
            {
                self.$msg = msg
                    ? group_replace( msg, t0, true )
                    : 'Undefined "'+t0+'"';
                err = t_err( self );
                error_( state, l1, c1, l2, c2, self, err );
                self.status |= ERROR;
            }
            return false;
        }
    }
    
    else if ( A_NOTDEFINED === action )
    {
        hash = "hash" === options.mode;
        list = hash ? "tabl" : "symb";
        t0 = t[1]; ns = t[0];
        t0 = group_replace( t0, t_str, raw );
        if ( case_insensitive ) t0 = t0[LOWER]();
        ns += '::'+t0;
        if ( in_hctx && state.hctx )
        {
            found = find_key(state.hctx.val[list], ns, hash);
        }
        else if ( in_ctx && state.ctx )
        {
            found = find_key(state.ctx.val[list], ns, hash);
        }
        else
        {
            found = find_key(state[list], ns, hash);
        }
        if ( found )
        {
            // defined
            if ( false !== msg )
            {
                self.$msg = msg
                    ? group_replace( msg, t0, true )
                    : 'Defined "'+t0+'"';
                err = t_err( self );
                error_( state, found.val[0], found.val[1], found.val[2], found.val[3], self, err );
                error_( state, l1, c1, l2, c2, self, err );
                self.status |= ERROR;
            }
            return false;
        }
    }
    
    // above actions can run during live editing as well
    if ( no_state_errors ) return true;
    
    if ( A_ERROR === action )
    {
        if ( !msg && (T_STR & get_type(t)) ) msg = t;
        self.$msg = msg ? group_replace( msg, t_str, true ) : 'Error "' + aid + '"';
        error_( state, l1, c1, l2, c2, self, t_err( self ) );
        self.status |= ERROR;
        return false;
    }

    else if ( A_UNIQUE === action )
    {
        hash = "hash" === options.mode;
        list = hash ? "tabl" : "symb";
        if ( in_hctx )
        {
            if ( state.hctx ) symb = state.hctx.val[list];
            else return true;
        }
        else if ( in_ctx )
        {
            if ( state.ctx ) symb = state.ctx.val[list];
            else return true;
        }
        else
        {
            symb = state[list];
        }
        t0 = t[1]; ns = t[0];
        t0 = group_replace( t0, t_str, raw );
        if ( case_insensitive ) t0 = t0[LOWER]();
        ns += '::'+t0; found = find_key(symb, ns, hash);
        if ( found )
        {
            // duplicate
            if ( false !== msg )
            {
                self.$msg = msg
                    ? group_replace( msg, t0, true )
                    : 'Duplicate "'+t0+'"';
                err = t_err( self );
                error_( state, found.val[0], found.val[1], found.val[2], found.val[3], self, err );
                error_( state, l1, c1, l2, c2, self, err );
                self.status |= ERROR;
            }
            return false;
        }
        else
        {
            if ( in_hctx )
                state.hctx.val[list] = add_key(state.hctx.val[list], ns, [l1, c1, l2, c2, ns, t0, token.type, !!options.autocomplete, case_insensitive], hash);
            else if ( in_ctx )
                state.ctx.val[list] = add_key(state.ctx.val[list], ns, [l1, c1, l2, c2, ns, t0, token.type, !!options.autocomplete, case_insensitive], hash);
            else
                state[list] = add_key(state[list], ns, [l1, c1, l2, c2, ns, t0, token.type, !!options.autocomplete, case_insensitive], hash);
        }
    }
    
    else if ( A_MCHEND === action )
    {
        if ( in_hctx )
        {
            if ( state.hctx ) queu = state.hctx.val.queu;
            else return true;
        }
        else if ( in_ctx )
        {
            if ( state.ctx ) queu = state.ctx.val.queu;
            else return true;
        }
        else
        {
            queu = state.queu;
        }
        if ( t )
        {
            t = group_replace( t, t_str, raw );
            if ( case_insensitive ) t = t[LOWER]();
            if ( !queu || t !== queu.val[0] ) 
            {
                // no match
                if ( false !== msg )
                {
                    if ( queu )
                    {
                        self.$msg = msg
                            ? group_replace( msg, [queu.val[0],t], true )
                            : 'Mismatched "'+queu.val[0]+'","'+t+'"';
                        err = t_err( self );
                        error_( state, queu.val[1], queu.val[2], queu.val[3], queu.val[4], self, err );
                        error_( state, l1, c1, l2, c2, self, err );
                        queu = queu.prev;
                    }
                    else
                    {
                        self.$msg = msg
                            ? group_replace( msg, ['',t], true )
                            : 'Missing matching "'+t+'"';
                        err = t_err( self );
                        error_( state, l1, c1, l2, c2, self, err );
                    }
                    self.status |= ERROR;
                }
                if ( in_hctx )
                {
                    if ( state.hctx ) state.hctx.val.queu = queu;
                }
                else if ( in_ctx )
                {
                    if ( state.ctx ) state.ctx.val.queu = queu;
                }
                else
                {
                    state.queu = queu;
                }
                return false;
            }
            else
            {
                queu = queu ? queu.prev : null;
            }
        }
        else
        {
            // pop unconditionaly
            queu = queu ? queu.prev : null;
        }
        if ( in_hctx )
        {
            if ( state.hctx ) state.hctx.val.queu = queu;
        }
        else if ( in_ctx )
        {
            if ( state.ctx ) state.ctx.val.queu = queu;
        }
        else
        {
            state.queu = queu;
        }
    }

    else if ( (A_MCHSTART === action) && t )
    {
        if ( in_hctx )
        {
            if ( state.hctx ) queu = state.hctx.val.queu;
            else return true;
        }
        else if ( in_ctx )
        {
            if ( state.ctx ) queu = state.ctx.val.queu;
            else return true;
        }
        else
        {
            queu = state.queu;
        }
        t = group_replace( t, t_str, raw );
        if ( case_insensitive ) t = t[LOWER]();
        self.$msg = msg
            ? group_replace( msg, t, true )
            : 'Missing matching "'+t+'"';
        // used when end-of-file is reached and unmatched tokens exist in the queue
        // to generate error message, if needed, as needed
        queu = new Stack( [t, l1, c1, l2, c2, t_err( self )], queu );
        if ( in_hctx )
        {
            if ( state.hctx ) state.hctx.val.queu = queu;
        }
        else if ( in_ctx )
        {
            if ( state.ctx ) state.ctx.val.queu = queu;
        }
        else
        {
            state.queu = queu;
        }
    }

    /*else if ( A_INDENT === action )
    {
        // TODO
    }

    else if ( A_OUTDENT === action )
    {
        // TODO
    }

    else if ( A_FOLDSTART === action )
    {
        // TODO
    }

    else if ( A_FOLDEND === action )
    {
        // TODO
    }*/

    return true;
}

function t_simple( t, stream, state, token, exception )
{
    var self = t, pattern = self.token, modifier = self.modifier,
        type = self.type, tokenID = self.name, except = self.except, tok_except,
        backup, line = state.line, pos = stream.pos, m = null, ret = false;
    
    self.status &= CLEAR_ERROR;
    self.$msg = exception ? null : (self.msg || null);
    self.pos = stream.pos;
    if ( except && !exception )
    {
        backup = state_backup( state, stream );
        for(var i=0,l=except.length; i<l; i++)
        {
            tok_except = except[i];
            // exceptions are ONLY simple tokens
            if ( self === tok_except || T_SIMPLE !== tok_except.type ) continue;
            // exception matched, backup and fail
            if ( t_simple( tok_except, stream, state, token, 1 ) ) { self.pos = tok_except.pos; state_backup( state, stream, backup ); return false; }
        }
    }
    // match SOF (start-of-file, first line of source)
    if ( T_SOF === type ) { ret = 0 === state.line; }
    // match FNBL (first non-blank line of source)
    else if ( T_FNBL === type ) { ret = state.bline+1 === state.line; }
    // match SOL (start-of-line)
    else if ( T_SOL === type ) { ret = stream.sol(); }
    // match EOL (end-of-line) ( with possible leading spaces )
    else if ( T_EOL === type ) 
    { 
        stream.spc();
        if ( stream.eol() ) ret = tokenID;
        else {self.pos = stream.pos; stream.bck( pos );}
    }
    // match EMPTY token
    else if ( T_EMPTY === type ) { self.status = 0; ret = true; }
    // match non-space
    else if ( T_NONSPACE === type ) 
    { 
        if ( (null != token.space) && !stream.eol() )
        {
            // space is already parsed, take it into account here
            if ( self.status & REQUIRED ) self.status |= ERROR;
        }
        else if ( stream.spc() && !stream.eol() )
        {
            self.pos = stream.pos;
            stream.bck( pos );
            if ( self.status & REQUIRED ) self.status |= ERROR;
        }
        else
        {
            ret = true;
        }
        self.status &= CLEAR_REQUIRED;
        if ( true === ret ) return ret;
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
    if ( exception ) return ret;
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
        b_start = '', b_inside = '', b_inside_rest = '', b_end = '', b_block,
        char_escaped, next, ret, is_required, $id = self.$id || block, can_be_empty,
        stream_pos, stream_pos0, stack_pos, line, pos, matched,
        outer = state.outer, outerState = outer && outer[2], outerTokenizer = outer && outer[1]
    ;

    /*
        This tokenizer class handles many different block types ( BLOCK, COMMENT, ESC_BLOCK, SINGLE_LINE_BLOCK ),
        having different styles ( DIFFERENT BLOCK DELIMS/INTERIOR ) etc..
        So logic can become somewhat complex,
        descriptive names and logic used here for clarity as far as possible
    */

    self.status &= CLEAR_ERROR;
    self.$msg = self.msg || null;
    self.pos = stream.pos;
    line = state.line; pos = stream.pos;
    // comments are not required tokens
    if ( T_COMMENT === type ) self.status &= CLEAR_REQUIRED;
    
    is_required = self.status & REQUIRED; already_inside = 0; found = 0;
    
    if ( state.block && (state.block.name === block) )
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
        stack_pos = state.stack;
        is_eol = T_NULL === block_end.ptype;
        can_be_empty = is_eol || self.empty;
        
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
                push_at( state, stack_pos, t_clone( self, is_required, 0, $id ) );
                return modifier || ret;
            }
        }
        
        stream_pos = stream.pos;
        ended = outerTokenizer ? is_eol && stream.eol() : t_match( block_end, stream );
        continue_to_next_line = is_multiline;
        continued = 0;
        
        if ( !ended )
        {
            stream_pos0 = stream.pos;
            char_escaped = false;
            if ( outerTokenizer || is_escaped ||
                (T_CHARLIST !== block_end.ptype && T_CHAR !== block_end.ptype && T_STR !== block_end.ptype)
            )
            {
                while ( !stream.eol( ) ) 
                {
                    // check for outer parser interleaved
                    if ( outerTokenizer )
                    {
                        if ( tokenize( outerTokenizer, stream, outerState, token ) )
                        {
                            if ( stream.pos > stream_pos0 )
                            {
                                // return any part of current block first
                                if ( is_eol ) ended = 1;
                                break;
                            }
                            else
                            {
                                // dispatch back to outer parser (interleaved next)
                                return true;
                            }
                        }
                        else if ( is_eol )
                        {
                            // EOL block, go char-by-char since outerToken might still be inside
                            next = stream.nxt( 1 );
                            b_inside_rest += next;
                            continue;
                        }
                    }
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
                        b_end = stream.sel(stream_pos, stream.pos);
                        break;
                    }
                    else
                    {
                        next = stream.nxt( 1 );
                        b_inside_rest += next;
                    }
                    char_escaped = is_escaped && !char_escaped && (esc_char === next);
                    stream_pos = stream.pos;
                }
                if ( is_eol && stream.eol() ) ended = 1;
            }
            else
            {
                // non-escaped block, 
                // match at once instead of char-by-char
                if ( matched = t_match(block_end, stream, true, true) )
                {
                    if ( has_interior )
                    {
                        if ( stream.pos > stream_pos+matched[1].length )
                        {
                            ret = block_interior;
                            stream.mov( -matched[1].length );
                            continued = 1;
                            b_inside_rest = stream.sel(stream_pos, stream.pos);
                        }
                        else
                        {
                            ret = block;
                            ended = 1;
                            b_inside_rest = stream.sel(stream_pos, stream.pos-matched[1].length);
                            b_end = matched[1];
                        }
                    }
                    else
                    {
                        ret = block;
                        ended = 1;
                        b_inside_rest = stream.sel(stream_pos, stream.pos-matched[1].length);
                        b_end = matched[1];
                    }
                }
                else
                {
                    // skip to end of line, and continue
                    stream.end( );
                    ret = block_interior;
                    continued = 1;
                    b_inside_rest = stream.sel(stream_pos, stream.pos);
                }
            }
        }
        else
        {
            ret = is_eol ? block_interior : block;
            b_end = stream.sel(stream_pos, stream.pos);
        }
        continue_to_next_line = is_multiline || (is_escaped && char_escaped);
        
        b_inside += b_inside_rest;
        block_inside_pos[ 1 ] = [line, stream_pos]; block_end_pos = [line, stream.pos];
        
        if ( ended )
        {
            // block is empty, invalid block
            if ( !can_be_empty && 
                (block_inside_pos[0][0] === block_inside_pos[1][0]) && 
                (block_inside_pos[0][1] === block_inside_pos[1][1])
            )
            {
                state.block = null;
                return false;
            }
        }
        
        if ( ended || (!continue_to_next_line && !continued) )
        {
            state.block = null;
        }
        else
        {
            state.block.ip = block_inside_pos;  state.block.ep = block_end_pos;
            state.block.i = b_inside; state.block.e = b_end;
            push_at( state, stack_pos, t_clone( self, is_required, 0, $id ) );
        }
        token.T = type; token.id = block; token.type = modifier || ret;
        token.str = stream.sel(pos, stream.pos); token.match = null;
        token.pos = [line, pos, block_end_pos[0], block_end_pos[1]];
        self.pos = stream.pos;
        
        if ( !state.block )
        {
            // block is now completed
            b_block = b_start + b_inside + b_end;
            token.block = {
            str: b_block,
            match: [ b_block, b_inside, b_start, b_end ],
            part: [ b_block, b_start, b_inside, b_end ],
            pos: [
                [block_start_pos[0], block_start_pos[1], block_end_pos[0], block_end_pos[1]],
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
        token_izer, style, modifier = self.modifier, found, min, max,
        tokens_required, tokens_err, stream_pos, stack_pos,
        i, i0, tt, err, $id, is_sequence, backup;

    self.status &= CLEAR_ERROR;
    self.$msg = self.msg || null;

    stream_pos = stream.pos;
    stack_pos = state.stack;
    self.pos = stream.pos;

    tokens_required = 0; tokens_err = 0;
    
    // TODO: a better error handling and recovery method
    // it should error recover to minimum/closest state
    // i.e generate only the minimum/necessary error notices
    if ( T_SUBGRAMMAR === type )
    {
        self.status &= CLEAR_ERROR;
        var subgrammar = new String(tokens[0]), nextTokenizer = state.stack ? state.stack.val : null;
        subgrammar.subgrammar = 1;
        subgrammar.next = nextTokenizer ? new tokenizer(T_POSITIVE_LOOKAHEAD, nextTokenizer.name, [nextTokenizer]) : null;
        subgrammar.required = nextTokenizer ? nextTokenizer.status & REQUIRED : 0;
        // return the subgrammar id to continue parsing with the subgrammar (if exists)
        return subgrammar;
    }
    
    else if ( T_ALTERNATION === type )
    {
        $id = /*self.$id ||*/ get_id( );
        self.status |= REQUIRED;
        err = [];
        backup = state_backup( state, stream );
        i0 = /*self.i0 ||*/ 0;
        for (i=i0; i<n; i++)
        {
            token_izer = t_clone( tokens[ i ], 1, modifier, $id );
            style = tokenize( token_izer, stream, state, token );
            self.pos = token_izer.pos;
            
            if ( token_izer.status & REQUIRED )
            {
                tokens_required++;
                err.push( t_err( token_izer ) );
            }
            
            if ( false !== style )
            {
                /*if ( (i+1 < n) && (stack.length > stack_pos) )
                {
                    // push it to the stack as well, in case this option is not finaly matched
                    token_izer = t_clone( self, 1, modifier ); token_izer.i0 = i+1; // to try next option
                    token_izer.last_option = stack[stack.length-1];
                    push_at( stack, stack_pos, token_izer );
                    // a way is needed to check if this option finaly matched
                    // using an internal stack can solve this, but how about the global stack?
                }*/
                return style;
            }
            else if ( token_izer.status & ERROR )
            {
                tokens_err++;
                state_backup( state, stream, backup );
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
        is_sequence = !!(type & T_SEQUENCE);
        $id = self.$id || get_id( );
        if ( is_sequence ) self.status |= REQUIRED;
        else self.status &= CLEAR_REQUIRED;
        backup = state_backup( state, stream );
        i0 = 0;
        do {
        token_izer = t_clone( tokens[ i0++ ], is_sequence, modifier, $id );
        style = tokenize( token_izer, stream, state, token );
        // bypass failed but optional tokens in the sequence
        // or successful lookahead tokens
        // and get to the next ones
        } while (/*is_sequence &&*/ i0 < n && (
            ((true === style) && (T_LOOKAHEAD & token_izer.type)) || 
            ((false === style) && !(token_izer.status & REQUIRED/*_OR_ERROR*/))
        ));
        
        self.pos = token_izer.pos;
        if ( false !== style )
        {
            // not empty token
            if ( (true !== style) || (T_EMPTY !== token_izer.type) )
            {
                for (i=n-1; i>=i0; i--)
                    stack_pos = push_at( state, stack_pos, t_clone( tokens[ i ], 1, modifier, $id ) );
            }
            if ( style.subgrammar /*&& !style.next*/ && (i0 < n) )
            {
                // add the nextTokenizer to subgrammar token, from here
                style.next = new tokenizer(T_POSITIVE_LOOKAHEAD, tokens[i0].name, [tokens[i0]]);
                style.required = tokens[i0].status & REQUIRED;
            }
            return style;
        }
        else if ( token_izer.status & ERROR /*&& token_izer.REQ*/ )
        {
            if ( is_sequence ) self.status |= ERROR;
            else self.status &= CLEAR_ERROR;
            state_backup( state, stream, backup );
        }
        else if ( is_sequence && (token_izer.status & REQUIRED) )
        {
            self.status |= ERROR;
        }
        
        if ( self.status && !self.$msg ) self.$msg = t_err( token_izer );
        return false;
    }

    else if ( T_LOOKAHEAD & type )
    {
        // not supported, return success as default
        if ( T_SUBGRAMMAR & tokens[ 0 ].type ) return true;
        backup = state_backup( state, stream, null, false );
        style = tokenize( t_clone( tokens[ 0 ], 0 ), stream, state, token );
        state_backup( state, stream, backup );
        return T_NEGATIVE_LOOKAHEAD === type ? false === style : false !== style;
    }

    else //if ( T_REPEATED & type )
    {
        $id = self.$id || get_id( );
        found = self.found; min = self.min; max = self.max;
        //self.status &= CLEAR_REQUIRED;
        self.status = 0;
        err = [];
        
        backup = state_backup( state, stream );
        for (i=0; i<n; i++)
        {
            token_izer = t_clone( tokens[ i ], 1, modifier, $id );
            style = tokenize( token_izer, stream, state, token );
            self.pos = token_izer.pos;
            
            if ( false !== style )
            {
                ++found;
                if ( found <= max )
                {
                    // push it to the stack for more
                    self.found = found;
                    push_at( state, stack_pos, t_clone( self, 0, 0, get_id( ) ) );
                    self.found = 0;
                    return style;
                }
                break;
            }
            else if ( token_izer.status & REQUIRED )
            {
                tokens_required++;
                err.push( t_err( token_izer ) );
            }
            if ( token_izer.status & ERROR )
            {
                state_backup( state, stream, backup );
            }
        }
        
        if ( found < min ) self.status |= REQUIRED;
        //else self.status &= CLEAR_REQUIRED;
        if ( (found > max) || (found < min && 0 < tokens_required) ) self.status |= ERROR;
        //else self.status &= CLEAR_ERROR;
        if ( self.status && !self.$msg && err.length ) self.$msg = err.join(' | ');
        return false;
    }
}


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
        self.bline = s.bline;
        self.status = s.status;
        self.stack = stack_clone( s.stack, false );
        self.token = s.token;
        self.token2 = s.token2;
        self.block = s.block;
        self.outer = s.outer ? [s.outer[0], s.outer[1], new State(unique, s.outer[2])] : null;
        self.queu = s.queu || null;
        self.symb = s.symb || null;
        self.tabl = s.tabl || null;
        self.ctx = s.ctx ? new Stack({tabl:s.ctx.val.tabl,symb:s.ctx.val.symb,queu:s.ctx.val.queu}, s.ctx.prev) : null;
        self.hctx = s.hctx ? new Stack({tabl:s.hctx.val.tabl,symb:s.hctx.val.symb,queu:s.hctx.val.queu}, s.hctx.prev) : null;
        self.err = s.err || null;
        self.$eol$ = s.$eol$; self.$blank$ = s.$blank$;
    }
    else
    {
        self.line = -1;
        self.bline = -1;
        self.status = s || 0;
        self.stack = null/*[]*/;
        self.token = null;
        self.token2 = null;
        self.block = null;
        self.outer = null;
        self.queu = null;
        self.symb = null;
        self.tabl = {};
        self.ctx = null;
        self.hctx = null;
        self.err = self.status & ERRORS ? {} : null;
        self.$eol$ = true; self.$blank$ = true;
    }
}
// make sure to generate a string which will cover most cases where state needs to be updated by the editor
State.prototype.toString = function( ){
    var self = this;
    return self.id+'_'+self.line+'_'+self.bline+'_'+(self.block?self.block.name:'0');
};

function state_backup( state, stream, backup, with_errors )
{
    if ( backup )
    {
        state.status = backup[0];
        state.block = backup[1];
        state.outer = backup[2];
        state.stack = backup[3];
        if ( stream && (stream.pos > backup[4]) ) stream.bck(backup[4]);
    }
    else
    {
        backup = [
            state.status,
            state.block,
            state.outer,
            state.stack,
            stream ? stream.pos : Infinity
        ];
        if ( false === with_errors ) state.status = 0;
        return backup;
    }
}

function state_dispose( state )
{
    state.id = null;
    state.line = null;
    state.bline = null;
    state.status = null;
    state.stack = null;
    state.token = null;
    state.token2 = null;
    state.block = null;
    state.outer = null;
    state.queu = null;
    state.symb = null;
    state.tabl = null;
    state.ctx = null;
    state.hctx = null;
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
            re_token = re_token || Stream.$NONSPC$;
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
        if ( m = self.slice(self.pos).match( re_space||Stream.$SPC$ ) ) 
        {
            if ( false !== eat ) self.mov( m[0].length );
            return m[0];
        }
    };
    return self;
}
Stream.$SPC$ = /^[\s\u00a0]+/;
Stream.$NONSPC$ = /[^\s\u00a0]/;
Stream.$NOTEMPTY$ = /\S/;
Stream.$SPACE$ = /^\s*/;

// Counts the column offset in a string, taking tabs into account.
// Used mostly to find indentation.
// adapted from codemirror countColumn
function count_column( string, end, tabSize, startIndex, startValue )
{
    var i, n, nextTab;
    if ( null == end )
    {
        end = string.search( Stream.$NONSPC$ );
        if ( -1 == end ) end = string.length;
    }
    for (i=startIndex||0,n=startValue||0 ;;)
    {
        nextTab = string.indexOf( "\t", i );
        if ( nextTab < 0 || nextTab >= end ) return n + (end - i);
        n += nextTab - i;
        n += tabSize - (n % tabSize);
        i = nextTab + 1;
    }
}


// parser factories
var Parser = Class({
    constructor: function Parser( grammar, DEFAULT, ERROR ) {
        var self = this;
        self.$grammar = grammar;
        self.$DEF = DEFAULT || null; self.$ERR = ERROR || null;
        self.DEF = self.$DEF; self.ERR = self.$ERR;
        self.$folders = [];
        self.$matchers = [];
        self.$subgrammars = {};
    }
    
    ,$grammar: null
    ,$subgrammars: null
    ,$folders: null
    ,$matchers: null
    ,$n$: 'name', $t$: 'type', $v$: 'token'
    ,$DEF: null, $ERR: null
    ,DEF: null, ERR: null
    
    ,dispose: function( ) {
        var self = this;
        self.$grammar = self.$subgrammars = null;
        self.$folders = self.$matchers = null;
        self.$n$ = self.$t$ = self.$v$ = null;
        self.$DEF = self.$ERR = self.DEF = self.ERR = null;
        return self;
    }
    
    ,token: function( stream, state, inner ) {
        if ( state.token2 )
        {
            // already parsed token in previous run
            var T = state.token2[0];
            stream.pos = state.token2[1]; stream.sft();
            state.token = state.token2[3];
            state.$eol$ = stream.eol();
            state.$blank$ = state.$blank$ && (state.token2[2] || state.$eol$);
            state.token2 = null;
            return T;
        }
        var self = this, grammar = self.$grammar, Style = grammar.Style, DEFAULT = self.DEF, ERR = self.ERR,
            T = { }, $name$ = self.$n$, $type$ = self.$t$, $value$ = self.$v$, //$pos$ = 'pos',
            interleaved_tokens = grammar.$interleaved, tokens = grammar.$parser, 
            nTokens = tokens.length, niTokens = interleaved_tokens ? interleaved_tokens.length : 0,
            tokenizer, action, token, line, pos, i, ii, stream_pos, stack_pos,
            type, err, notfound, just_space, block_in_progress, outer = state.outer,
            subgrammar, innerParser, innerState, foundInterleaved, aret,
            outerState = outer && outer[2], outerTokenizer = outer && outer[1]
        ;
        
        // state marks a new line
        if ( stream.sol() )
        {
            if ( state.$eol$ )
            {
                // update count of blank lines at start of file
                if ( state.$blank$ ) state.bline = state.line;
                state.$eol$ = false; state.line++;
            }
            state.$blank$ = state.bline+1 === state.line;
        }
        state.$actionerr$ = false; state.token = null;
        line = state.line; pos = stream.pos;
        type = false; notfound = true; err = false; just_space = false;
        //block_in_progress = state.block ? state.block.name : undef;
        
        if ( outer && (self === outer[0]) )
        {
            // use self mode as default passthru INNER mode
            T[$name$] = null; T[$type$] = DEFAULT; T[$value$] = null;
            // check if need to dispatch back to outer parser
            if ( outerTokenizer )
            {
                token = new s_token( );
                if ( tokenize( outerTokenizer, stream, outerState, token ) )
                {
                    state.outer = null;
                    return {parser: self, state: outerState};
                }
                else
                {
                    stream.nxt( 1/*true*/ );
                }
                while ( !stream.eol() )
                {
                    if ( tokenize( outerTokenizer, stream, outerState, token ) )
                    {
                        if ( stream.pos > pos )
                        {
                            // return current token first
                            break;
                        }
                        else
                        {
                            state.outer = null;
                            return {parser: self, state: outerState};
                        }
                    }
                    else
                    {
                        stream.nxt( 1/*true*/ );
                    }
                }
            }
            else
            {
                // pass whole line through
                stream.spc( );
                if ( stream.eol( ) ) just_space = true;
                else stream.end( );
            }
            
            T[$value$] = stream.cur( 1 );
            state.$eol$ = stream.eol();
            state.$blank$ = state.$blank$ && (just_space || state.$eol$);
            
            return T;
        }
        
        // if EOL tokenizer is left on stack, pop it now
        if ( state.stack && (T_EOL === state.stack.val.type) && stream.sol() ) state.stack = state.stack.prev;
        
        // check for non-space tokenizer or partial-block-in-progress, before parsing any space/empty
        if ( (!state.stack 
            || (/*(T_NONSPACE !== state.stack.val.type) &&*/ (null == state.block) /*(block_in_progress !== stack[stack.length-1].name)*/)) 
            && stream.spc() )
        {
            // subgrammar follows, push the spaces back and let subgrammar handle them
            if ( state.stack && (T_SUBGRAMMAR === state.stack.val.type) )
            {
                stream.bck( pos );
                tokenizer = state.stack.val;
                state.stack = state.stack.prev;
                type = tokenize( tokenizer, stream, state, token );
                // subgrammar / submode
                /*if ( type.subgrammar )
                {*/
                // dispatch to inner mode
                subgrammar = ''+type;
                if ( !self.$subgrammars[subgrammar] )
                {
                    // use self as default passthru inner mode
                    innerParser = self;
                    innerState = new State( );
                    outerState = /*new State( 1,*/ state /*)*/;
                }
                else
                {
                    // use actual inner mode
                    innerParser = self.$subgrammars[subgrammar];
                    innerState = new State( 1, inner[subgrammar] ? inner[subgrammar] : state.status );
                    outerState = /*new State( 1,*/ state /*)*/;
                }
                innerState.outer = [self, type.next, outerState];
                return {parser: innerParser, state: innerState, toInner: subgrammar};
                /*}*/
            }
            else
            {
                notfound = true/*false*/;
                just_space = true;
            }
        }
        
        T[$name$] = null; T[$type$] = DEFAULT; T[$value$] = null;
        if ( notfound )
        {
            token = new s_token( );
            // handle space and other token in single run
            if ( just_space ) {token.space = [pos, stream.pos]; stream.sft(); }
            
            i = 0;
            while ( notfound && (state.stack || i<nTokens) && !stream.eol() )
            {
                stream_pos = stream.pos; stack_pos = state.stack;
                
                // check for outer parser interleaved
                if ( outerTokenizer )
                {
                    stream.spc( );
                    if ( tokenize( outerTokenizer, stream, outerState, token ) )
                    {
                        if ( token.space || (stream.pos > stream_pos) )
                        {
                            // match the spaces first
                            if ( token.space )
                            {
                                stream.start = token.space[0];
                                stream.pos = token.space[1];
                            }
                            T[$value$] = stream.cur( 1 );
                            state.$eol$ = stream.eol();
                            state.$blank$ = state.$blank$ && (true || state.$eol$);
                            return T;
                        }
                        else
                        {
                            // dispatch back to outer parser
                            state.outer = null;
                            return {parser: outer[0], state: outerState, fromInner: state};
                        }
                    }
                    stream.bck( stream_pos );
                }
                
                // dont interleave tokens if partial block is in progress
                foundInterleaved = false;
                if ( niTokens && !state.block )
                {
                    for (ii=0; ii<niTokens; ii++)
                    {
                        tokenizer = interleaved_tokens[ii];
                        type = tokenize( tokenizer, stream, state, token );
                        if ( false !== type ) { foundInterleaved = true; break; }
                    }
                    //if ( foundInterleaved || !notfound ) break;
                }
                
                if ( notfound && !foundInterleaved )
                {
                    // seems stack and/or ngrams can ran out while inside the loop !!  ?????
                    if ( !state.stack && i>=nTokens) break;
                    if ( state.stack )
                    {
                        tokenizer = state.stack.val;
                        state.stack = state.stack.prev;
                    }
                    else
                    {
                        tokenizer = tokens[i++];
                    }
                    type = tokenize( tokenizer, stream, state, token );
                }
                
                // match failed
                if ( false === type )
                {
                    // error
                    if ( tokenizer.status & REQUIRED_OR_ERROR )
                    {
                        // keep it for autocompletion, if needed
                        state.token = tokenizer;
                        
                        // error recovery to a valid parse state and stream position, if any
                        just_space = err_recover( state, stream, token, tokenizer ) || just_space;
                        
                        // generate error
                        err = true; notfound = false; break;
                    }
                    // optional
                    /*else
                    {
                        if ( stream.pos > stream_pos ) stream.bck( stream_pos );
                        if ( stack.length > stack_pos ) stack.length = stack_pos;
                        continue;
                    }*/
                }
                // found token
                else
                {
                    // subgrammar inner parser
                    if ( type.subgrammar )
                    {
                        // dispatch to inner sub-parser
                        subgrammar = ''+type;
                        if ( !self.$subgrammars[subgrammar] )
                        {
                            // use self as default passthru inner parser
                            innerParser = self;
                            innerState = new State( );
                            outerState = /*new State( 1,*/ state /*)*/;
                        }
                        else
                        {
                            // use actual inner sub-grammar parser
                            innerParser = self.$subgrammars[subgrammar];
                            innerState = new State( 1, inner[subgrammar] ? inner[subgrammar] : state.status );
                            outerState = /*new State( 1,*/ state /*)*/;
                        }
                        innerState.outer = [self, type.next, outerState];
                        if ( token.space )
                        {
                            // match the spaces first
                            state.token2 = [{parser: innerParser, state: innerState, toInner: subgrammar}, stream.pos, just_space, state.token];
                            state.token = null;
                            stream.start = token.space[0];
                            stream.pos = token.space[1];
                            T[$value$] = stream.cur( 1 );
                            state.$eol$ = stream.eol();
                            state.$blank$ = state.$blank$ && (true || state.$eol$);
                            return T;
                        }
                        else
                        {
                            return {parser: innerParser, state: innerState, toInner: subgrammar};
                        }
                    }
                    
                    // partial block, apply maybe any action(s) following it
                    if ( state.stack && state.stack.prev && stream.eol() &&  
                        (T_BLOCK & state.stack.val.type) && state.block &&
                        state.block.name === state.stack.val.name 
                    )
                    {
                        ii = state.stack.prev;
                        while ( ii && T_ACTION === ii.val.type )
                        {
                            action = ii; ii = ii.prev;
                            aret = t_action( action, stream, state, token );
                            // action error
                            if ( action.status & ERROR ) state.$actionerr$ = true;
                            else if ( aret && (true !== type) && action.modifier ) type = action.modifier;
                        }
                    }
                    // action token(s) follow, execute action(s) on current token
                    else if ( state.stack && (T_ACTION === state.stack.val.type) )
                    {
                        while ( state.stack && (T_ACTION === state.stack.val.type) )
                        {
                            action = state.stack.val;
                            state.stack = state.stack.prev;
                            aret = t_action( action, stream, state, token );
                            // action error
                            if ( action.status & ERROR ) state.$actionerr$ = true;
                            else if ( aret && (true !== type) && action.modifier ) type = action.modifier;
                        }
                    }
                    // not empty
                    if ( true !== type ) { notfound = false; break; }
                }
            }
        }
        
        
        // unknown
        if ( notfound )
        {
            if ( token.space )
            {
                stream.start = token.space[0];
                stream.pos = token.space[1];
                type = false; token.space = null;
            }
            else
            {
                /*
                // check for outer parser
                if ( outerTokenizer && tokenize( outerTokenizer, stream, outerState, token ) )
                {
                    // dispatch back to outer parser
                    //state.outer = null;
                    return {parser: outer[0], state: outerState, fromInner: state};
                }
                */
                // unknown, bypass, next char/token
                stream.nxt( 1/*true*/ ) /*|| stream.spc( )*/;
            }
        }
        
        T[$value$] = stream.cur( 1 );
        if ( false !== type )
        {
            type = type ? (Style[type] || DEFAULT) : DEFAULT;
            T[$name$] = tokenizer ? tokenizer.name : null;
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
        if ( token.space )
        {
            // return the spaces first
            state.token2 = [T, stream.pos, just_space, state.token];
            state.token = null;
            stream.start = token.space[0]; stream.pos = token.space[1];
            T = {}; T[$name$] = null; T[$type$] = DEFAULT; T[$value$] = stream.cur( 1 );
            just_space = true;
        }
        state.$eol$ = stream.eol();
        state.$blank$ = state.$blank$ && (just_space || state.$eol$);
        // update count of blank lines at start of file
        //if ( state.$eol$ && state.$blank$ ) state.bline = state.line;
        
        return T;
    }
    
    // get token via multiplexing inner grammars if needed
    ,get: function( stream, mode ) {
        var ret = mode.parser.token( stream, mode.state, mode.inner );
        while ( ret && ret.parser )
        {
            // multiplex inner grammar/parser/state if given
            // save inner parser current state
            if ( ret.fromInner && (mode.parser !== ret.parser) )
            {
                mode.state.err = ret.fromInner.err;
                if ( mode.name ) mode.inner[mode.name] = ret.fromInner;
            }
            // share some state
            ret.state.err = mode.state.err;
            ret.state.line = mode.state.line;
            ret.state.bline = mode.state.bline;
            ret.state.$blank$ = mode.state.$blank$;
            ret.state.$eol$ = mode.state.$eol$;
            ret.state.$full_parse$ = mode.state.$full_parse$;
            // update parser to current parser and associated state
            mode.state = ret.state;
            mode.parser = ret.parser;
            mode.name = ret.toInner;
            // get new token
            ret = mode.parser.get( stream, mode );
        }
        // return token
        return ret;
    }
    
    ,tokenize: function( stream, mode, row, tokens ) {
        tokens = tokens || [];
        //mode.state.line = row || 0;
        if ( stream.eol() ) { mode.state.line++; if ( mode.state.$blank$ ) mode.state.bline++; }
        else while ( !stream.eol() ) tokens.push( mode.parser.get( stream, mode ) );
        return tokens;
    }
    
    ,parse: function( code, parse_type ) {
        var lines = (code||"").split(newline_re), l = lines.length,
            linetokens = null, state, mode, parse_errors, parse_tokens, err, ret;
        
        parse_type = parse_type || TOKENS;
        parse_errors = !!(parse_type & ERRORS);
        parse_tokens = !!(parse_type & TOKENS);
        mode = {parser: this, state: new State( 0, parse_type ), inner: {}};
        mode.state.$full_parse$ = true;
        
        // add back the newlines removed from split-ting
        iterate(function( i ){ lines[i] += "\n"; }, 0, l-2);
        
        if ( parse_tokens ) 
            linetokens = iterate(parse_type & FLAT
            ? function( i, linetokens ) {
                mode.parser.tokenize( Stream( lines[i] ), mode, i, linetokens );
            }
            : function( i, linetokens ) {
                linetokens.push( mode.parser.tokenize( Stream( lines[i] ), mode, i ) );
            }, 0, l-1, [] );
        
        else 
            iterate(function( i ) {
                var stream = Stream( lines[i] );
                if ( stream.eol() ) { mode.state.line++; if ( mode.state.$blank$ ) mode.state.bline++; }
                else while ( !stream.eol() ) mode.parser.get( stream, mode );
            }, 0, l-1);
        
        state = mode.state;
        
        if ( parse_errors && state.queu /*&& state.queu.length*/ )
        {
            // generate errors for unmatched tokens, if needed
            while( state.queu/*.length*/ )
            {
                err = state.queu.val/*shift()*/; state.queu = state.queu.prev;
                error_( state, err[1], err[2], err[3], err[4], null, err[5] );
            }
        }
        
        ret = parse_tokens && parse_errors
            ? {tokens:linetokens, errors:state.err}
            : (parse_tokens ? linetokens : state.err);
        
        state_dispose( state );
        mode = state = null;
        return ret;
    }

    ,autocompletion: function( state, min_found, dynamic_tokens ) {
        var stack = state.stack, token, type, hash = {},
            follows = generate_autocompletion( [ state.token ], [], hash, dynamic_tokens );
        min_found  = min_found || 0;
        while( stack )
        {
            token = stack.val; type = token.type;
            if ( T_REPEATED & type )
            {
                follows = generate_autocompletion( [ token ], follows, hash, dynamic_tokens );
                if ( (0 < token.min) && (min_found < follows.length) ) break;
            }
            else if ( (T_SIMPLE === type) || (T_ALTERNATION === type) || (T_SEQUENCE_OR_NGRAM & type) )
            {
                follows = generate_autocompletion( [ token ], follows, hash, dynamic_tokens );
                if ( min_found < follows.length ) break;
            }
            stack = stack.prev;
        }
        return dynamic_tokens && dynamic_tokens.length ? dynamic_tokens.concat(follows) : follows;
    }
    
    ,dynamic_autocompletion: function( state ) {
        return state ? generate_dynamic_autocompletion( state ) || null : null;
    }
    
    // overriden
    ,subparser: function( name, parser ) {
        var self = this;
        if ( false === parser )
        {
            // remove
            if ( HAS.call(self.$subgrammars,name) )
                delete self.$subgrammars[name];
        }
        else if ( parser )
        {
            // add
            self.$subgrammars[name] = parser;
        }
        return self;
    }
    ,iterator: function( ) { }
    ,validate: function( ) { }
    ,autocomplete: function( ) { }
    ,indent: function( ) { }
    ,fold: function( ) { }
    ,match: function( ) { }
});


function Type( TYPE, positive )
{
    if ( T_STR_OR_ARRAY & get_type( TYPE ) )
        TYPE = new_re( '\\b(' + map( make_array( TYPE ).sort( by_length ), esc_re ).join( '|' ) + ')\\b' );
    return false === positive
    ? function( type ) { return !type || !TYPE.test( type ); }
    : function( type ) { return !!type && TYPE.test( type ); };
}

function next_tag( iter, T, M, L, R, S )
{
    for (;;)
    {
        M.lastIndex = iter.col;
        var found = M.exec( iter.text ), type;
        if ( !found )
        {
            if ( iter.next( ) )
            {
                iter.text = iter.line( iter.row );
                continue;
            }
            else return;
        }
        if ( !T( iter.token(iter.row, found.index+1) ) )
        {
            iter.col = found.index + 1;
            continue;
        }
        iter.col = found.index + found[0].length;
        return found;
    }
}

/*function prev_tag( iter, T, M, L, R, S )
{
    var gt, lastSlash, selfClose, type;
    for (;;)
    {
        gt = iter.col ? iter.text.lastIndexOf( R, iter.col - 1 ) : -1;
        if ( -1 === gt )
        {
            if ( iter.prev( ) )
            {
                iter.text = iter.line( iter.row );
                continue;
            }
            else return;
        }
        if ( !T( iter.token(iter.row, gt + 1) ) )
        {
            iter.col = gt;
            continue;
        }
        lastSlash = iter.text.lastIndexOf( S, gt );
        selfClose = lastSlash > -1 && !Stream.$NOTEMPTY$.test(iter.text.slice(lastSlash + 1, gt));
        iter.col = gt + 1;
        return selfClose ? "selfClose" : "regular";
    }
}*/

function end_tag( iter, T, M, L, R, S )
{
    var gt, lastSlash, selfClose, type;
    for (;;)
    {
        gt = iter.text.indexOf( R, iter.col );
        if ( -1 === gt )
        {
            if ( iter.next( ) )
            {
                iter.text = iter.line(  iter.row );
                continue;
            }
            else return;
        }
        if ( !T( iter.token(iter.row, gt+1) ) )
        {
            iter.col = gt + 1;
            continue;
        }
        lastSlash = iter.text.lastIndexOf( S, gt );
        selfClose = lastSlash > -1 && !Stream.$NOTEMPTY$.test(iter.text.slice(lastSlash + 1, gt));
        iter.col = gt + 1;
        return selfClose ? "autoclosed" : "regular";
    }
}

/*function start_tag( iter, T, M, L, R, S )
{
    var lt;
    for (;;)
    {
        lt = iter.col ? iter.text.lastIndexOf( L, iter.col - 1 ) : -1;
        if ( -1 === lt )
        {
            if ( iter.prev( ) )
            {
                iter.text = iter.line(  iter.row );
                continue;
            }
            else return;
        }
        if ( !T( iter.token(iter.row, lt+1) ) )
        {
            iter.col = lt + 1;
            continue;
        }
        M.lastIndex = lt;
        iter.col = lt + 1;
        var found = M.exec( iter.text );
        if ( found && lt === found.index ) return found;
    }
}*/

function find_match( dir, iter, row, col, tokenType, S, E, T, folding, commentType )
{
    if ( -1 === dir ) // find start
    {
        var depth = 1, firstLine = iter.first(), i, text, tl, pos,
            nextOpen, nextClose, row0, col0, Sl = S.length, El = E.length,
            unconditional = false === tokenType;
        outer0: for (i=row; i>=firstLine; --i)
        {
            text = iter.line( i ); tl = text.length;
            pos = i===row ? col-1 : tl;
            do{
                if ( pos < 0 ) break;
                nextOpen = text.lastIndexOf( S, pos );
                nextClose = text.lastIndexOf( E, pos );
                if ( (0 > nextOpen) && (0 > nextClose) ) break;
                pos = MAX( nextOpen, nextClose );
                // NOTE: token can fail on some lines that continue e.g blocks
                // since the previous line will have ended the block
                // and the position of the new end delimiter will NOT be recognised as in the block
                // FIXED partialy by semantic iunformation about comments, since this occurs mostly in comment delims
                if ( unconditional || commentType || (iter.token(i, pos+1) == tokenType) )
                {
                    if ( pos === nextClose ) ++depth;
                    else if ( 0 === --depth ) { row0 = i; col0 = pos; break outer0; }
                }
                --pos;
            }while(true);
        }
        // found but failed
        if ( (null == row0) || (folding && (row0 === row) && (col0 === col)) ) return false;
        // found
        return [row0, col0, row, col];
    }
    else //if ( 1 === dir ) // find end
    {
        var depth = 1, lastLine = iter.last(), i, text, tl, pos,
            nextOpen, nextClose, row1, col1, Sl = S.length, El = E.length,
            unconditional = false === tokenType;
        outer1: for (i=row; i<=lastLine; ++i)
        {
            text = iter.line( i ); tl = text.length;
            pos = i===row ? col : 0;
            do{
                if ( pos >= tl ) break;
                nextOpen = text.indexOf( S, pos );
                nextClose = text.indexOf( E, pos );
                if ( (0 > nextOpen) && (0 > nextClose) ) break;
                if ( 0 > nextOpen ) nextOpen = tl;
                if ( 0 > nextClose ) nextClose = tl;
                pos = MIN( nextOpen, nextClose );
                // NOTE: token can fail on some lines that continue e.g blocks
                // since the previous line will have ended the block
                // and the position of the new end delimiter will NOT be recognised as in the block
                // FIXED partialy by semantic information about comments, since this occurs mostly in comment delims
                if ( unconditional || commentType || (iter.token(i, pos+1) == tokenType) )
                {
                    if ( pos === nextOpen ) ++depth;
                    else if ( 0 === --depth ) { row1 = i; col1 = pos; break outer1; }
                }
                ++pos;
            }while(true);
        }
        // found but failed
        if ( (null == row1) || (folding && (row === row1) && (col1 === col)) ) return false;
        // found
        return [row, col, row1, col1];
    }
}

// folder factories
var Folder = {
    // adapted from codemirror
    
     Pattern: function( S, E, T ) {
        // TODO
        return function fold_pattern( ){ };
    }
    
    ,Indented: function( NOTEMPTY ) {
        NOTEMPTY = NOTEMPTY || Stream.$NOTEMPTY$;
        
        return function fold_indentation( iter ) {
            var first_line, first_indentation, cur_line, cur_indentation,
                start_line = iter.row, start_pos, last_line_in_fold, end_pos, i, end;
            
            first_line = iter.line( start_line );
            if ( !NOTEMPTY.test( first_line ) ) return;
            first_indentation = iter.indentation( first_line );
            last_line_in_fold = null; start_pos = first_line.length;
            for (i=start_line+1,end=iter.last( ); i<=end; ++i)
            {
                cur_line = iter.line( i ); cur_indentation = iter.indentation( cur_line );
                if ( cur_indentation > first_indentation )
                {
                    // Lines with a greater indent are considered part of the block.
                    last_line_in_fold = i;
                    end_pos = cur_line.length;
                }
                else if ( !NOTEMPTY.test( cur_line ) )
                {
                    // Empty lines might be breaks within the block we're trying to fold.
                }
                else
                {
                    // A non-empty line at an indent equal to or less than ours marks the
                    // start of another block.
                    break;
                }
            }
            // return a range
            if ( last_line_in_fold ) return [start_line, start_pos, last_line_in_fold, end_pos];
            //return false;
        };
    }

    ,Delimited: function( S, E, T, commentType ) {
        if ( !S || !E || !S.length || !E.length ) return function( ){ };
        T = T || TRUE;

        return function fold_delimiter( iter ) {
            var line = iter.row, col = iter.col,
                lineText, startCh, at, pass, found, tokenType;
            
            lineText = iter.line( line );
            for (at=col,pass=0 ;;)
            {
                var found = at<=0 ? -1 : lineText.lastIndexOf( S, at-1 );
                if ( -1 === found )
                {
                    // not found
                    if ( 1 === pass ) return;
                    pass = 1;
                    at = lineText.length;
                    continue;
                }
                // not found
                if ( 1 === pass && found < col ) return;
                if ( T( tokenType = iter.token( line, found+1 ) ) )
                {
                    startCh = found + S.length;
                    break;
                }
                at = found-1;
            }
            // find end match
            return find_match(1, iter, line, startCh, tokenType, S, E, T, true, commentType);
        };
    }
    
    ,MarkedUp: function( T, L, R, S, M ) {
        T = T || TRUE;
        L = L || "<"; R = R || ">"; S = S || "/";
        M = M || new_re( esc_re(L) + "(" + esc_re(S) + "?)([a-zA-Z_\\-][a-zA-Z0-9_\\-:]*)", {g:1} );

        return function fold_markup( iter ) {
            iter.col = 0; iter.min = iter.first( ); iter.max = iter.last( );
            iter.text = iter.line( iter.row );
            var openTag, end, start, close, tagName, startLine = iter.row,
                stack, next, startCh, i;
            for (;;)
            {
                openTag = next_tag(iter, T, M, L, R, S);
                // not found
                if ( !openTag || iter.row !== startLine || !(end = end_tag(iter, T, M, L, R, S)) ) return;
                if ( !openTag[1] && "autoclosed" !== end  )
                {
                    start = [iter.row, iter.col]; tagName = openTag[2]; close = null;
                    // start find_matching_close
                    stack = [];
                    for (;;)
                    {
                        next = next_tag(iter, T, M, L, R, S);
                        startLine = iter.row; startCh = iter.col - (next ? next[0].length : 0);
                        // found but failed
                        if ( !next || !(end = end_tag(iter, T, M, L, R, S)) ) return false;
                        if ( "autoclosed" === end  ) continue;
                        if ( next[1] )
                        {
                            // closing tag
                            for (i=stack.length-1; i>=0; --i)
                            {
                                if ( stack[i] === next[2] )
                                {
                                    stack.length = i;
                                    break;
                                }
                            }
                            if ( i < 0 && (!tagName || tagName === next[2]) )
                            {
                                /*close = {
                                    tag: next[2],
                                    pos: [startLine, startCh, iter.row, iter.col]
                                };
                                break;*/
                                // found
                                return [start[0], start[1], startLine, startCh];
                            }
                        }
                        else
                        {
                            // opening tag
                            stack.push( next[2] );
                        }
                    }
                    // end find_matching_close
                    /*if ( close )
                    {
                        return [start[0], start[1], close.pos[0], close.pos[1]];
                    }*/
                }
            }
        };
    }

};


// token matching factories
var Matcher = {
    // adapted from ace
    
     Pattern: function( S, E, T ) {
        // TODO
        return function( ){ };
    }
    
     ,Delimited: function( S, E, T, commentType ) {
        if ( !S || !E || !S.length || !E.length ) return function( ){ };
        T = T || TRUE;
        
        return function( iter ) {
            var col = iter.col, row = iter.row, line = iter.line( row ),
                range, tokenType=false, Sl = S.length, El = E.length;
            if ( (col >= Sl) && 
                ((1 === Sl && S === line.charAt(col-1)) || (S === line.slice(col-Sl, col))) /*&& 
                T( tokenType = iter.token( row, col-Sl ) )*/
            )
            {
                // find end
                range = find_match(1, iter, row, col, tokenType, S, E, T, false, commentType);
                if ( range )
                {
                    range = [range[0], range[1]-Sl, range[0], range[1], range[2], range[3], range[2], range[3]+El];
                    range.match = 'end';
                }
                else
                {
                    range = [row, col-Sl, row, col];
                    range.match = false;
                }
                return range;
            }
            else if ( (col >= El) && 
                ((1 === El && E === line.charAt(col-1)) || (E === line.slice(col-El, col))) /*&& 
                T( tokenType = iter.token( row, col-El ) )*/
            )
            {
                // find start
                range = find_match(-1, iter, row, col-El, tokenType, S, E, T, false, commentType);
                if ( range )
                {
                    range = [range[0], range[1], range[0], range[1]+Sl, range[2], range[3], range[2], range[3]+El];
                    range.match = 'start';
                }
                else
                {
                    range = [row, col-El, row, col];
                    range.match = false;
                }
                return range;
            }
            // not found
        };
    }
    
    ,MarkedUp: function( T, L, R, S, M ) {
        // TODO
        return function( ){ };
    }
     
};
/**
*
*   CodeMirrorGrammar
*   @version: 4.2.1
*
*   Transform a grammar specification in JSON format, into a syntax-highlight parser mode for CodeMirror
*   https://github.com/foo123/codemirror-grammar
*   https://github.com/foo123/editor-grammar
*
**/


// codemirror supposed to be available
var $CodeMirror$ = 'undefined' !== typeof CodeMirror ? CodeMirror : { Pass : { toString: function(){return "CodeMirror.Pass";} } },
    // used for autocompletion
    RE_W = /[\w$]/, by_score = function( a, b ) { return b.score-a.score }
;

//
// parser factories
var CodeMirrorParser = Class(Parser, {
    constructor: function CodeMirrorParser( grammar, DEFAULT ) {
        var self = this, FOLD = null, MATCH = null, TYPE;
        
        Parser.call(self, grammar, null, "error");
        self.DEF = DEFAULT || self.$DEF;
        self.ERR = grammar.Style.error || self.$ERR;
        
        // support comments toggle functionality
        self.LC = grammar.$comments.line ? grammar.$comments.line[0] : null;
        self.BCS = grammar.$comments.block ? grammar.$comments.block[0][0] : null;
        self.BCE = grammar.$comments.block ? grammar.$comments.block[0][1] : null;
        self.BCC = self.BCL = grammar.$comments.block ? grammar.$comments.block[0][2] : null;

        // comment-block folding
        if ( grammar.$comments.block && grammar.$comments.block.length )
        {
            TYPE = CodeMirrorParser.Type('comment');
            for(var i=0,l=grammar.$comments.block.length; i<l; i++)
            {
                self.$folders.push(CodeMirrorParser.Fold.Delimited(
                    grammar.$comments.block[i][0],
                    grammar.$comments.block[i][1],
                    TYPE, 'comment'
                ));
            }
        }
        // user-defined folding
        if ( grammar.Fold && (T_STR & get_type(grammar.Fold)) ) FOLD = grammar.Fold[LOWER]();
        else if ( grammar.$extra.fold ) FOLD = grammar.$extra.fold[LOWER]();
        // user-defined matching
        if ( grammar.Match && (T_STR & get_type(grammar.Match)) ) MATCH = grammar.Match[LOWER]();
        else if ( grammar.$extra.match ) MATCH = grammar.$extra.match[LOWER]();
        else MATCH = FOLD;
        var blocks = get_block_types( grammar, 1 );
        TYPE = blocks.length ? CodeMirrorParser.Type(blocks, false) : TRUE;
        if ( FOLD )
        {
            FOLD = FOLD.split('+');  // can use multiple folders, separated by '+'
            iterate(function( i, FOLDER ) {
            var FOLD = trim(FOLDER[i]), p;
            if ( 'braces' === FOLD )
            {
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '{', '}', TYPE ) );
            }
            else if ( 'brackets' === FOLD )
            {
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '[', ']', TYPE ) );
            }
            else if ( 'parens' === FOLD || 'parentheses' === FOLD )
            {
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '(', ')', TYPE ) );
            }
            else if ( 'brace' === FOLD || 'cstyle' === FOLD || 'c' === FOLD )
            {
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '{', '}', TYPE ) );
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '[', ']', TYPE ) );
            }
            else if ( 'indent' === FOLD || 'indentation' === FOLD )
            {
                self.$folders.push( CodeMirrorParser.Fold.Indented( ) );
            }
            else if ( 'tags' === FOLD || 'markup' === FOLD || 'html' === FOLD || 'xml' === FOLD )
            {
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '<![CDATA[', ']]>', CodeMirrorParser.Type(['comment','tag'], false) ) );
                self.$folders.push( CodeMirrorParser.Fold.MarkedUp( CodeMirrorParser.Type('tag'), '<', '>', '/' ) );
            }
            else if ( -1 < (p=FOLD.indexOf(',')) )
            {
                self.$folders.push( CodeMirrorParser.Fold.Delimited( FOLD.slice(0,p), FOLD.slice(p+1), TYPE ) );
            }
            }, 0, FOLD.length-1, FOLD);
        }
        // user-defined matching
        if ( MATCH )
        {
            MATCH = MATCH.split('+');  // can use multiple matchers, separated by '+'
            iterate(function( i, MATCHER ) {
            var MATCH = trim(MATCHER[i]), p;
            if ( 'braces' === MATCH )
            {
                self.$matchers.push( CodeMirrorParser.Match.Delimited( '{', '}' ) );
            }
            else if ( 'brackets' === MATCH )
            {
                self.$matchers.push( CodeMirrorParser.Match.Delimited( '[', ']' ) );
            }
            else if ( 'parens' === MATCH || 'parentheses' === MATCH )
            {
                self.$matchers.push( CodeMirrorParser.Match.Delimited( '(', ')' ) );
            }
            else if ( 'brace' === MATCH || 'cstyle' === MATCH || 'c' === MATCH )
            {
                self.$matchers.push( CodeMirrorParser.Match.Delimited( '{', '}' ) );
                self.$matchers.push( CodeMirrorParser.Match.Delimited( '[', ']' ) );
                self.$matchers.push( CodeMirrorParser.Match.Delimited( '(', ')' ) );
            }
            else if ( 'tags' === MATCH || 'markup' === MATCH || 'html' === MATCH || 'xml' === MATCH )
            {
                self.$matchers.push( CodeMirrorParser.Match.MarkedUp( CodeMirrorParser.Type('tag'), '<', '>', '/' ) );
            }
            else if ( -1 < (p=MATCH.indexOf(',')) )
            {
                self.$matchers.push( CodeMirrorParser.Match.Delimited( MATCH.slice(0,p), MATCH.slice(p+1) ) );
            }
            }, 0, MATCH.length-1, MATCH);
        }
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
    
    ,validate: function( code, options, CodeMirror )  {
        if ( !code || !code.length ) return [];
        var parser = this, errors = [], err, msg, error,
            err_type, err_msg, code_errors = parser.parse( code, ERRORS );
        if ( !code_errors ) return errors;
        
        options = options || {};
        err_type = HAS.call(options,'type') ? options.type : "error";
        err_msg = HAS.call(options,'msg') ? options.msg : "Syntax Error";
        
        for (err in code_errors)
        {
            if ( !HAS.call(code_errors,err) ) continue;
            error = code_errors[err];
            errors.push({
                message: error[4] || err_msg,
                severity: err_type,
                from: CodeMirror.Pos( error[0], error[1] ),
                to: CodeMirror.Pos( error[2], error[3] )
            });
        }
        return errors;
    }
    
    // adapted from codemirror anyword-hint helper
    ,autocomplete: function( cm, options, CodeMirror ) {
            options = options || {};
        var parser = this, state, list = [],
            prefix_match = HAS.call(options,'prefixMatch') ? !!options.prefixMatch : true,
            in_context = HAS.call(options,'inContext')? !!options.inContext : false,
            dynamic = HAS.call(options,'dynamic')? !!options.dynamic : false,
            case_insensitive_match = HAS.call(options,'caseInsensitiveMatch') ? !!options.caseInsensitiveMatch : false,
            cur = cm.getCursor(), curLine,
            start0 = cur.ch, start = start0, end0 = start0, end = end0,
            token, token_i, len, maxlen = 0, word_re, renderer, sort_by_score, score,
            grammar_tokens = parser.$grammar.$autocomplete && parser.$grammar.$autocomplete.length ? parser.$grammar.$autocomplete : null,
            dynamic_tokens
        ;
        if ( dynamic || grammar_tokens )
        {
            word_re = options.word || RE_W; curLine = cm.getLine(cur.line);
            while (start && word_re.test(curLine[CHAR](start - 1))) --start;
            // operate similar to current ACE autocompleter equivalent
            if ( !prefix_match ) while (end < curLine.length && word_re.test(curLine[CHAR](end))) ++end;
            token = curLine.slice(start, end); token_i = token[LOWER](); len = token.length;
            renderer = options.renderer || null;
            sort_by_score = false; score = 1000;
            
            state = cm.getTokenAt( CodeMirror.Pos( cur.line, start ), true ).state.state;
            
            var suggest = function suggest( list, word ){
                var w = word.word, wl = w.length, 
                    wm, case_insensitive_word,
                    pos, pos_i, m1, m2, case_insensitive;
                if ( len )
                {
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
                }
                else
                {
                    wm = word.meta;
                    if ( wl+wm.length > maxlen ) maxlen = wl+wm.length;
                    list.push({
                        text: w, name: w, meta: wm,
                        start: 0, end: 0, match: '',
                        displayText: w + "\t\t["+wm+"]",
                        render: renderer,
                        // longer matches have lower match score
                        score: sort_by_score ? 1000 - 10*(wl) : score--
                    });
                }
                return list;
            };
            
            dynamic_tokens = dynamic ? parser.dynamic_autocompletion( state ) : null;
            
            if ( in_context )
            {
                sort_by_score = false;
                list = operate(parser.autocompletion( state, null, dynamic_tokens ), suggest, list);
            }
            if ( dynamic_tokens && !dynamic_tokens.length ) dynamic_tokens = null;
            if ( !list.length && (dynamic_tokens || grammar_tokens) )
            {
                sort_by_score = true;
                list = operate((dynamic_tokens || []).concat(grammar_tokens || []), suggest, list);
            }
            if ( list.length ) list = list.sort( by_score );
            list.maxlen = maxlen; 
        }
        return {
            list: list,
            from: CodeMirror.Pos( cur.line, start ),
            to: CodeMirror.Pos( cur.line, end )
        };
    }
    
    // adapted from codemirror
    ,indent: function( state, textAfter, fullLine, conf, parserConf, CodeMirror ) {
        //var indentUnit = conf.indentUnit || 4;
        // TODO
        return CodeMirror.Pass;
    }
    
    ,iterator: function( cm, CodeMirror ) {
        // adapted from codemirror
        var tabSize = cm.getOption("tabSize");
        return {
         row: 0, col: 0, min: 0, max: 0
        ,line: function( row ) { return cm.getLine( row ); }
        //,nlines: function( ) { return cm.lineCount( ); }
        ,first: function( ) { return cm.firstLine( ); }
        ,last: function( ) { return cm.lastLine( ); }
        ,next: function( ) {
            var iter = this;
            if ( iter.row >= iter.max ) return;
            iter.col = 0; iter.row++;
            return true;
        }
        ,prev: function( ) {
            var iter = this;
            if ( iter.row <= iter.min ) return;
            iter.col = 0; iter.row--;
            return true;
        }
        ,indentation: function( line ) { return count_column( line, null, tabSize ); }
        ,state: function( row, col ) { var s = cm.getTokenAt( CodeMirror.Pos( row, col||0 ) ).state; return s.state || s; }
        ,token: function( row, col ) { return cm.getTokenTypeAt( CodeMirror.Pos( row, col||0 ) ); }
        ,tokens: function( row ) { return cm.getLineTokens( row ); }
        };
    }
    
    ,fold: function( cm, start, CodeMirror ) {
        // adapted from codemirror
        var self = this, folders = self.$folders, i, l = folders.length, iter, fold;
        if ( l )
        {
            iter = self.iterator( cm, CodeMirror );
            iter.row = start.line; iter.col = start.ch||0;
            for (i=0; i<l; i++)
                if ( (fold = folders[ i ]( iter )) || (false === fold) )
                    return fold;
        }
    }
    
    ,match: function( cm, start, CodeMirror ) {
        // adapted from codemirror
        var self = this, matchers = self.$matchers, i, l = matchers.length, iter, match;
        if ( l )
        {
            iter = self.iterator( cm, CodeMirror );
            iter.row = start.line; iter.col = start.ch||0;
            for (i=0; i<l; i++)
                if ( (match = matchers[ i ]( iter )) || (false === match) )
                    return match;
        }
    }
});
CodeMirrorParser.Type = Type;
CodeMirrorParser.Fold = Folder;
CodeMirrorParser.Match = Matcher;


function autocomplete_renderer( elt, data, cmpl )
{
    var word = cmpl.text, type = cmpl.meta, p1 = cmpl.start, p2 = cmpl.end,
        padding = data.list.maxlen-word.length-type.length+5;
    elt.innerHTML = [
        '<span class="cmg-autocomplete-keyword">', esc_html( word.slice(0,p1) ),
        '<strong class="cmg-autocomplete-keyword-match">', esc_html( word.slice(p1,p2) ), '</strong>',
        esc_html( word.slice(p2) ), '</span>',
        new Array(1+padding).join('&nbsp;'),
        '<strong class="cmg-autocomplete-keyword-meta">', esc_html( type ), '</strong>',
        '&nbsp;'
    ].join('');
    // adjust to fit keywords
    elt.className = (elt.className&&elt.className.length ? elt.className+' ' : '') + 'cmg-autocomplete-keyword-hint';
    elt.style.position = 'relative'; //elt.style.boxSizing = 'border-box';
    elt.style.width = '100%'; elt.style.maxWidth = '120%';
}

function get_mode( grammar, DEFAULT, CodeMirror ) 
{
    // Codemirror-compatible Mode
    CodeMirror = CodeMirror || $CodeMirror$; /* pass CodeMirror reference if not already available */
    function CMode( conf, parserConf )
    {
        // this is a generic multiplexing mode
        // since it supports multiple inner sub-grammar parsers
        // this means all folding/matching/autocompletion/comments multiplexing and so on..
        // should be handled by the mode itself taking account any sub-modes
        // and NOT by Codemirror!!
        var mode;
        mode = {
        Mode: CMode
        
        ,startState: function( ) { 
            return {parser: CMode.$parser, state: new State( ), inner: {}, name: null};
        }
        
        ,copyState: function( state ) { 
            return {parser: state.parser, state: new State( 0, state.state ), inner: state.inner, name: state.name};
        }
        
        ,token: function( stream, state ) { 
            var pstream = Stream( stream.string, stream.start, stream.pos ), 
                token = state.parser.get( pstream, state ).type;
            stream.pos = pstream.pos;
            return token;
        }
        
        ,indent: function( state, textAfter, fullLine ) { 
            return state.parser.indent( state.state, textAfter, fullLine, conf, parserConf, CodeMirror ); 
        }
        
        ,fold: CMode.foldType
        
        // support comments toggle functionality
        ,lineComment: CMode.$parser.LC
        ,blockCommentStart: CMode.$parser.BCS
        ,blockCommentEnd: CMode.$parser.BCE
        ,blockCommentContinue: CMode.$parser.BCC
        ,blockCommentLead: CMode.$parser.BCL
        // support extra functionality defined in grammar
        // eg. code folding, electriChars etc..
        ,electricInput: CMode.$parser.$grammar.$extra.electricInput || false
        ,electricChars: CMode.$parser.$grammar.$extra.electricChars || false
        };
        // store a reference to mode here
        CMode.mode = mode;
        return mode;
    }
    CMode.$id = uuid("codemirror_grammar_mode");
    CMode.$parser = new CodeMirrorGrammar.Parser( parse_grammar( grammar ), DEFAULT );
    // store a reference to Mode here
    CMode.$parser.Mode = CMode;
    CMode.options = function( cm, pos, options ) {
        options = options || {};
        var s = cm.getTokenAt( pos ).state, parser = (s && s.parser) || CMode.$parser;
        options.lineComment = parser.LC;
        options.blockCommentStart = parser.BCS;
        options.blockCommentEnd = parser.BCE;
        options.blockCommentContinue = parser.BCC;
        options.blockCommentLead = parser.BCL;
        options.electricInput = parser.$grammar.$extra.electricInput || false;
        options.electricChars = parser.$grammar.$extra.electricChars || false;
        return options;
    };
    
    // custom, user-defined, syntax lint-like validation/annotations generated from grammar
    CMode.supportGrammarAnnotations = false;
    CMode.validator = function validator( code, options )  {
        return CMode.supportGrammarAnnotations && CMode.$parser && code && code.length
        ? CMode.$parser.validate( code, validator.options||options||{}, CodeMirror )
        : [];
    };
    // alias
    CMode.linter = CMode.validator;
    
    // custom, user-defined, (multiplexed) autocompletions generated from grammar
    CMode.supportAutoCompletion = true;
    CMode.autocompleter = function autocompleter( cm, options ) {
        if ( CMode.supportAutoCompletion )
        {
            var s = cm.getTokenAt( cm.getCursor() ).state, parser = (s && s.parser) || CMode.$parser;
            options = autocompleter.options /*|| Mode.autocompleter.options*/ || options || {};
            if ( !HAS.call(options,'renderer') ) options.renderer = autocompleter.renderer /*|| Mode.autocompleter.renderer*/ || autocomplete_renderer;
            return parser.autocomplete( cm, options, CodeMirror );
        }
    };
    CMode.autocompleter.renderer = autocomplete_renderer;
    // alias, deprecated for compatibility
    //CMode.autocomplete = CMode.autocompleter;
    
    // custom, user-defined, code (multiplexed) folding generated from grammar
    CMode.supportCodeFolding = true;
    CMode.foldType = "fold_"+CMode.$id;
    CMode.folder = function folder( cm, start ) {
        if ( CMode.supportCodeFolding )
        {
            var s = cm.getTokenAt( start ).state, parser = (s && s.parser) || CMode.$parser, fold;
            if ( fold = parser.fold( cm, start, CodeMirror ) )
            return {
                from: CodeMirror.Pos( fold[0], fold[1] ),
                to: CodeMirror.Pos( fold[2], fold[3] )
            };
        }
    };
    
    // custom, user-defined, code (multiplexed) matching generated from grammar
    CMode.supportCodeMatching = true;
    CMode.matchType = "match_"+CMode.$id;
    CMode.matcher = function matcher( cm ) {
        if ( CMode.supportCodeMatching )
        {
            matcher.clear( cm );
            if ( cm.state.$highlightPending ) return;
            var s = cm.getTokenAt( cm.getCursor() ).state, parser = (s && s.parser) || CMode.$parser;

            // perform highlight async to not block the browser during navigation
            cm.state.$highlightPending = true;
            setTimeout(function( ) {
            cm.operation(function( ) {
                cm.state.$highlightPending = false;
                // Disable matching in long lines, since it'll cause hugely slow updates
                var options =matcher.options /*|| Mode.matcher.options*/ || {}, maxHighlightLen = options.maxHighlightLineLength || 1000;
                var marks = [], ranges = cm.listSelections( ), range,
                    matched = "CodeMirror-matchingtag"/*"CodeMirror-matchingbracket"*/, unmatched = "CodeMirror-nonmatchingbracket";
                for (var i=0,l=ranges.length; i<1; i++)
                {
                    range = /*ranges[i].empty() &&*/ parser.match( cm, ranges[i].to(), CodeMirror );
                    if ( null == range ) continue;
                    if ( false === range )
                    {
                        if ( ranges[i].empty() )
                        {
                            range = ranges[i].to();
                            range = [CodeMirror.Pos(range.line, range.ch-1), range];
                        }
                        else
                        {
                            range = [ranges[i].from(), ranges[i].to()];
                        }
                        marks.push( cm.markText( range[0], range[1], {className: unmatched} ) );
                    }
                    else if ( false === range.match )
                    {
                        marks.push( cm.markText( CodeMirror.Pos(range[0], range[1]), CodeMirror.Pos(range[2], range[3]), {className: unmatched} ) );
                    }
                    else if ( ('end' === range.match) && (cm.getLine(range[0]).length <= maxHighlightLen) )
                    {
                        marks.push( cm.markText( CodeMirror.Pos(range[0], range[1]), CodeMirror.Pos(range[2], range[3]), {className: matched} ) );
                        if ( cm.getLine(range[4]).length <= maxHighlightLen )
                        marks.push( cm.markText( CodeMirror.Pos(range[4], range[5]), CodeMirror.Pos(range[6], range[7]), {className: matched} ) );
                    }
                    else if ( ('start' === range.match) && (cm.getLine(range[4]).length <= maxHighlightLen) )
                    {
                        marks.push( cm.markText( CodeMirror.Pos(range[4], range[5]), CodeMirror.Pos(range[6], range[7]), {className: matched} ) );
                        if ( cm.getLine(range[0]).length <= maxHighlightLen )
                        marks.push( cm.markText( CodeMirror.Pos(range[0], range[1]), CodeMirror.Pos(range[2], range[3]), {className: matched} ) );
                    }
                }
                cm.state[ CMode.matchType ] = marks;
            });
            }, 50);
        }
    };
    CMode.matcher.clear = function( cm ) {
        cm.operation(function( ){
            var marks = cm.state[ CMode.matchType ];
            cm.state[ CMode.matchType ] = null;
            if ( marks && marks.length )
                for(var i=0,l=marks.length; i<l; i++) marks[i].clear( );
        });
    };
    
    CMode.submode = function( lang, mode ) {
        CMode.$parser.subparser( lang, mode.Mode.$parser );
    };
    
    CMode.dispose = function( ) {
        if ( CMode.$parser ) CMode.$parser.dispose( );
        CMode.$parser = CMode.validator = CMode.linter = CMode.autocompleter = CMode.folder = CMode.matcher = CMode.mode = null;
    };
    
    return CMode;
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
* CodeMirrorGrammar = require('build/codemirror_grammar.js');
* ```
*
* __For browser:__
*
* ```html
* <script src="build/codemirror_grammar.js"></script>
* ```
*
[/DOC_MARKDOWN]**/
var CodeMirrorGrammar = {
    
    VERSION: "4.2.1",
    
    // clone a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `clone`
    *
    * ```javascript
    * cloned_grammar = CodeMirrorGrammar.clone( grammar [, deep=true] );
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
    * extended_grammar = CodeMirrorGrammar.extend( grammar, basegrammar1 [, basegrammar2, ..] );
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
    * pre_processed_grammar = CodeMirrorGrammar.pre_process( grammar );
    * ```
    *
    * This is used internally by the `CodeMirrorGrammar` Class `parse` method
    * In order to pre-process a `JSON grammar` (in-place) to transform any shorthand configurations to full object configurations and provide defaults.
    * It also parses `PEG`/`BNF` (syntax) notations into full (syntax) configuration objects, so merging with other grammars can be easier, if needed.
    [/DOC_MARKDOWN]**/
    pre_process: preprocess_and_parse_grammar,
    
    // parse a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `parse`
    *
    * ```javascript
    * parsed_grammar = CodeMirrorGrammar.parse( grammar );
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
    * mode = CodeMirrorGrammar.getMode( grammar [, DEFAULT, CodeMirror] );
    * ```
    *
    * This is the main method which transforms a `JSON grammar` into a `CodeMirror` syntax-highlight parser.
    * `DEFAULT` is the default return value (`null` by default) for things that are skipped or not styled
    * In general there is no need to set this value, unless you need to return something else
    * The `CodeMirror` reference can also be passed as parameter, for example,
    * if `CodeMirror` is not already available when the add-on is first loaded (e.g via an `async` callback)
    [/DOC_MARKDOWN]**/
    getMode: get_mode,
    
    // make Parser class available
    /**[DOC_MARKDOWN]
    * __Parser Class__: `Parser`
    *
    * ```javascript
    * Parser = CodeMirrorGrammar.Parser;
    * ```
    *
    * The Parser Class used to instantiate a highlight parser, is available.
    * The `getMode` method will instantiate this parser class, which can be overriden/extended if needed, as needed.
    * In general there is no need to override/extend the parser, unless you definately need to.
    [/DOC_MARKDOWN]**/
    Parser: CodeMirrorParser
};

/* main code ends here */
/* export the module */
return CodeMirrorGrammar;
});