
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
    
