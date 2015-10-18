/**
*
*   CodeMirrorGrammar
*   @version: 2.3.0
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
// parser types
var    
    DEFAULTSTYLE, DEFAULTERROR,
    
    TOKENS = 1, ERRORS = 2, FLAT = 32, REQUIRED = 4, ERROR = 8,
    CLEAR_REQUIRED = ~REQUIRED, CLEAR_ERROR = ~ERROR,
    REQUIRED_OR_ERROR = REQUIRED | ERROR,
    
    // action types
    A_ERROR = 4,
    A_UNIQUE = 8,
    A_PUSH = 16,
    A_POP = 32,
    A_EMPTY = 64,
    A_INDENT = 128,
    A_OUTDENT = 256,
    A_CTXSTART = 512,
    A_CTXEND = 1024,
    A_OVERWR = 2048,
    
    // pattern types
    P_SIMPLE = 2,
    P_COMPOSITE = 4,
    P_BLOCK = 8,
    
    // token types
    T_ACTION = 4,
    T_SOF = 8, T_EOF = 16, T_SOL = 32, T_EOL = 64,
    T_SOF_OR_SOL = T_SOF|T_SOL,
    T_EMPTY = 128, T_NONSPACE = 256,
    T_SIMPLE = 512,
    T_BLOCK = 1024, T_COMMENT = 1025,
    T_EITHER = 2048,
    T_SEQUENCE = 4096,
    T_REPEATED = 8192,
    T_ZEROORONE = 8193, T_ZEROORMORE = 8194, T_ONEORMORE = 8195,
    T_GROUP = 16384, T_NGRAM = 32768,
    T_SEQUENCE_OR_NGRAM = T_SEQUENCE|T_NGRAM,
    
    // tokenizer types
    groupTypes = {
    either: T_EITHER,
    sequence: T_SEQUENCE, ALL: T_SEQUENCE,
    zeroorone: T_ZEROORONE,
    zeroormore: T_ZEROORMORE,
    oneormore: T_ONEORMORE,
    repeated: T_REPEATED
    },
    
    tokenTypes = {
    action: T_ACTION,
    simple: T_SIMPLE,
    block: T_BLOCK,
    comment: T_COMMENT,
    group: T_GROUP,
    ngram: T_NGRAM
    }
;

var undef = undefined, 
    PROTO = 'prototype', HAS = 'hasOwnProperty', IS_ENUM = 'propertyIsEnumerable',
    OP = Object[PROTO], toString = OP.toString, Extend = Object.create,
    Max = Math.max, Min = Math.min, LOWER = 'toLowerCase',
    
    // types
    INF = Infinity,
    T_UNKNOWN = 4, T_UNDEF = 8, T_NULL = 16,
    T_NUM = 32, T_INF = 33, T_NAN = 34, T_BOOL = 64,
    T_STR = 128, T_CHAR = 129, T_CHARLIST = 130,
    T_ARRAY = 256, T_OBJ = 512, T_FUNC = 1024,  T_REGEX = 2048, T_DATE = 4096,
    T_STR_OR_ARRAY = T_STR|T_ARRAY, T_OBJ_OR_ARRAY = T_OBJ|T_ARRAY, T_STR_OR_ARRAY_OR_REGEX = T_STR|T_ARRAY|T_REGEX,
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
    
    escaped_re = /([.*+?^${}()|[\]\/\\\-])/g,
    newline_re = /\r\n|\r|\n/g, dashes_re = /[\-_]/g, 
    peg_bnf_notation_re = /^([.\[\]{}()*+?\/|'"]|\s)/,
    _id_ = 0
;

function get_type( v )
{
    if      ( null === v )                return T_NULL;
    else if ( true === v || false === v || 
                   v instanceof Boolean ) return T_BOOL;
    else if ( undef === v )               return T_UNDEF;
    var TYPE = TYPE_STRING[ toString.call( v ) ] || T_UNKNOWN;
    if      ( T_NUM === TYPE   || v instanceof Number )   return isNaN(v) ? T_NAN : (isFinite(v) ? T_NUM : T_INF);
    else if ( T_STR === TYPE   || v instanceof String )   return 1 === v.length ? T_CHAR : T_STR;
    else if ( T_ARRAY === TYPE || v instanceof Array )    return T_ARRAY;
    else if ( T_REGEX === TYPE || v instanceof RegExp )   return T_REGEX;
    else if ( T_DATE === TYPE  || v instanceof Date )     return T_DATE;
    else if ( T_FUNC === TYPE  || v instanceof Function ) return T_FUNC;
    else if ( T_OBJ === TYPE )                            return T_OBJ;
                                                          return T_UNKNOWN;
}
    
function map( x, F, i0, i1 )
{
    var len = x.length;
    if ( arguments.length < 4 ) i1 = len-1;
    if ( 0 > i1 ) i1 += len;
    if ( arguments.length < 3 ) i0 = 0;
    if ( i0 > i1 ) return [];
    var i, k, l=i1-i0+1, r=l&15, q=r&1, Fx=new Array(l);
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
    var len = x.length;
    if ( arguments.length < 5 ) i1 = len-1;
    if ( 0 > i1 ) i1 += len;
    if ( arguments.length < 4 ) i0 = 0;
    if ( i0 > i1 ) return F0;
    var i, k, l=i1-i0+1, r=l&15, q=r&1, Fv=q?F(F0,x[i0],i0):F0;
    for (i=q; i<r; i+=2)  { k = i0+i; Fv = F(F(Fv,x[k],k),x[k+1],k+1); }
    for (i=r; i<l; i+=16) { k = i0+i; Fv = F(F(F(F(F(F(F(F(F(F(F(F(F(F(F(F(Fv,x[k],k),x[k+1],k+1),x[k+2],k+2),x[k+3],k+3),x[k+4],k+4),x[k+5],k+5),x[k+6],k+6),x[k+7],k+7),x[k+8],k+8),x[k+9],k+9),x[k+10],k+10),x[k+11],k+11),x[k+12],k+12),x[k+13],k+13),x[k+14],k+14),x[k+15],k+15); }
    return Fv;
}

function iterate( F, i0, i1 )
{
    if ( i0 > i1 ) return;
    var io, i, l=i1-i0+1, r=l&15, q=r&1;
    if ( q ) F(i0, i0, i1);
    for (io=q; io<r; io+=2)
    { 
        i = i0+io;
        F(  i, i0, i1);
        F(++i, i0, i1);
    }
    for (io=r; io<l; io+=16)
    {
        i = i0+io;
        F(  i, i0, i1);
        F(++i, i0, i1);
        F(++i, i0, i1);
        F(++i, i0, i1);
        F(++i, i0, i1);
        F(++i, i0, i1);
        F(++i, i0, i1);
        F(++i, i0, i1);
        F(++i, i0, i1);
        F(++i, i0, i1);
        F(++i, i0, i1);
        F(++i, i0, i1);
        F(++i, i0, i1);
        F(++i, i0, i1);
        F(++i, i0, i1);
        F(++i, i0, i1);
    }
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

function esc_re( s ) { return s.replace(escaped_re, '\\$1'); }

function group_replace( pattern, token, raw )
{
    var i, l, c, g, replaced, offset = true === raw ? 0 : 1;
    if ( T_STR & get_type(token) ) { token = [token, token]; offset = 0; }
    l = pattern.length; replaced = ''; i = 0;
    while ( i<l )
    {
        c = pattern.charAt(i);
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

function has_prefix( s, p )
{
    return (
        (T_STR & get_type(p)) && (T_STR & get_type(s)) && p.length &&
        p.length <= s.length && p === s.substr(0, p.length)
    );
}

function peek( stack, index )
{
    index = 2 > arguments.length ? -1 : index;
    if ( stack.length )
    {
        if ( (0 > index) && (0 <= stack.length+index) )
            return stack[ stack.length + index ];
        else if ( 0 <= index && index < stack.length )
            return stack[ index ];
    }
}

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
// Stream Class
// a wrapper-class to manipulate a string as a stream, based on Codemirror's StringStream
var Stream = Class({
    constructor: function Stream( line ) {
        var self = this;
        self._ = null;
        self.s = line ? ''+line : '';
        self.start = self.pos = 0;
        self.lCP = self.lCV = 0;
        self.lS = 0;
    }

    // abbreviations used for optimal minification
    ,_: null
    ,s: ''
    ,start: 0
    ,pos: 0
    // last column pos
    ,lCP: 0
    // last column value
    ,lCV: 0
    // line start
    ,lS: 0
    
    ,dispose: function( ) {
        var self = this;
        self._ = null;
        self.s = null;
        self.start = null;
        self.pos = null;
        self.lCP = null;
        self.lCV = null;
        self.lS = null;
        return self;
    }
    
    ,toString: function( ) { 
        return this.s; 
    }
    
    // string start-of-line?
    ,sol: function( ) { 
        return 0 === this.pos; 
    }
    
    // string end-of-line?
    ,eol: function( ) { 
        return this.pos >= this.s.length; 
    }
    
    // skip to end
    ,end: function( ) {
        var self = this;
        self.pos = self.s.length;
        return self;
    }

    // move pointer forward/backward n steps
    ,mov: function( n ) {
        var self = this;
        self.pos = 0 > n ? Max(0, self.pos+n) : Min(self.s.length, self.pos+n);
        return self;
    }
    
    // move pointer back to pos
    ,bck: function( pos ) {
        var self = this;
        self.pos = Max(0, pos);
        return self;
    }
    
    // move/shift stream
    ,sft: function( ) {
        var self = this;
        self.start = self.pos;
        return self;
    }
    
    // next char(s) or whole token
    ,nxt: function( num, re_token ) {
        var self = this, c, s = self.s, token = '', n;
        if ( true === num )
        {
            re_token = re_token || Stream.$RE_NONSPC$;
            while ( self.pos<s.length && re_token.test(c=s.charAt(self.pos++)) ) token += c;
        }
        else
        {
            num = num||1; n = 0;
            while ( n++ < num && self.pos<s.length ) token += s.charAt(self.pos++);
        }
        return token;
    }
    
    // current stream selection
    ,cur: function( shift ) {
        var self = this, ret = self.s.slice(self.start, self.pos);
        if ( shift ) self.start = self.pos;
        return ret;
    }
    
    // eat "space"
    ,spc: function( eat, re_space ) {
        var self = this, m, start = self.pos, s = self.s.slice(start);
        if ( m = s.match( re_space||Stream.$RE_SPC$ ) ) 
        {
            if ( false !== eat ) self.mov( m[0].length );
            return m[0];
        }
        return null;
    }
    
    // get current column including tabs
    ,col: function( tabSize ) {
        var self = this;
        tabSize = tabSize || 1;
        if (self.lCP < self.start) 
        {
            self.lCV = Stream.col(self.s, self.start, tabSize, self.lCP, self.lCV);
            self.lCP = self.start;
            if ( self._ )
            {
                self._.start = self.start;
                self._.lastColumnPos = self.lCP;
                self._.lastColumnValue = self.lCV;
                self._.lineStart = self.lS;
            }
        }
        return self.lCV - (self.lS ? Stream.col(self.s, self.lS, tabSize) : 0);
    }
    
    // get current indentation including tabs
    ,ind: function( tabSize ) {
        var self = this;
        tabSize = tabSize || 1;
        return Stream.col(self.s, null, tabSize) - (self.lS ? Stream.col(self.s, self.lS, tabSize) : 0);
    }
});

Stream.$RE_SPC$ = /^[\s\u00a0]+/;
Stream.$RE_NONSPC$ = /[^\s\u00a0]/;

// Counts the column offset in a string, taking tabs into account.
// Used mostly to find indentation.
// adapted from CodeMirror
Stream.col = function( string, end, tabSize, startIndex, startValue ) {
    var i, n;
    if ( null === end ) 
    {
        end = string.search( Stream.$RE_NONSPC$ );
        if ( -1 === end ) end = string.length;
    }
    for (i = startIndex || 0, n = startValue || 0; i < end; ++i) 
        n += ( "\t" === string.charAt(i) ) ? (tabSize - (n % tabSize)) : 1;
    return n;
};
    
// new Stream from another stream
Stream._ = function( _ ) {
    var stream = new Stream( );
    stream._ = _;
    stream.s = ''+_.string;
    stream.start = _.start;
    stream.pos = _.pos;
    stream.lCP = _.lastColumnPos;
    stream.lCV = _.lastColumnValue;
    stream.lS = _.lineStart;
    return stream;
};

//
// State Class
var State = Class({
    constructor: function State( unique, s ) {
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
            self.token = s.token;
            self.block = s.block;
            // keep extra state only if error handling is enabled
            if ( self.status & ERRORS )
            {
                self.queu = s.queu/*.slice()*/;
                self.symb = /*clone(*/ s.symb/*, 1 )*/;
                self.ctx = s.ctx/*.slice()*/;
                self.err = s.err;
            }
            // else dont use-up more space and clutter
            else
            {
                self.queu = null;
                self.symb = null;
                self.ctx = null;
                self.err = null;
            }
        }
        else
        {
            self.line = -1;
            self.status = s || 0;
            self.stack = [];
            self.token = null;
            self.block = null;
            // keep extra state only if error handling is enabled
            if ( self.status & ERRORS )
            {
                self.queu = [];
                self.symb = {};
                self.ctx = [];
                self.err = {};
            }
            // else dont use-up more space and clutter
            else
            {
                self.queu = null;
                self.symb = null;
                self.ctx = null;
                self.err = null;
            }
        }
    }
    
    ,id: null
    ,line: 0
    ,status: 0
    ,token: null
    ,block: null
    ,stack: null
    ,queu: null
    ,symb: null
    ,ctx: null
    ,err: null
    
    ,dispose: function( ) {
        var self = this;
        self.id = null;
        self.line = null;
        self.status = null;
        self.stack = null;
        self.token = null;
        self.block = null;
        self.queu = null;
        self.symb = null;
        self.ctx = null;
        self.err = null;
        return self;
    }
    
    // make sure to generate a string which will cover most cases where state needs to be updated by the editor
    ,toString: function() {
        var self = this;
        return self.id+'_'+self.line+'_'+(self.token?self.token.name:'0')+'_'+(self.block?self.block.name:'0');
    }
});

//
// pattern factories

var Pattern, BlockPattern, CompositePattern,
    Token, ActionToken, BlockToken, CompositeToken;

function match_char( stream, eat ) 
{
    var self = this, p = self.pattern, c = stream.s.charAt(stream.pos) || null;
    if ( p === c ) 
    {
        if ( false !== eat ) stream.mov( 1 );
        return [ self.key, c ];
    }
    return false;
}

function match_charlist( stream, eat ) 
{
    var self = this, p = self.pattern, c = stream.s.charAt(stream.pos) || null;
    if ( c && (-1 < p.indexOf( c )) ) 
    {
        if ( false !== eat ) stream.mov( 1 );
        return [ self.key, c ];
    }
    return false;
}

function match_str( stream, eat ) 
{
    var self = this, p = self.pattern, n = p.length, s = stream.s;
    if ( p === s.substr(stream.pos, n) ) 
    {
        if ( false !== eat ) stream.mov( n );
        return [ self.key, p ];
    }
    return false;
}

function match_re( stream, eat ) 
{
    var self = this, p = self.pattern, s = stream.s, m;
    m = s.slice( stream.pos ).match( p[0] );
    if ( !m || m.index > 0 ) return false;
    if ( false !== eat ) stream.mov( m[ p[1]||0 ].length );
    return [ self.key, p[1] > 0 ? m[p[1]] : m ];
}

function match_null( stream, eat ) 
{
    var self = this;
    // up to end-of-line
    if ( false !== eat ) stream.end( ); // skipToEnd
    return [ self.key, "" ];
} 
    
Pattern = Class({
    constructor: function Pattern( name, pattern, type, key ) {
        var self = this;
        self.type = P_SIMPLE;
        self.name = name;
        self.pattern = null;
        self.ptype = type || T_STR;
        self.key = key || 0;
        
        // get a fast customized matcher for < pattern >
        switch ( self.ptype )
        {
            case T_NULL:
                self.pattern = null;
                self.match = match_null;
                break;
            case T_REGEX:
                self.pattern = T_REGEX&get_type(pattern) ? [pattern, 0] : [pattern[0], pattern[1]||0];
                self.match = match_re;
                break;
            case T_CHAR: case T_CHARLIST:
                self.pattern = pattern;
                self.match = T_CHARLIST === self.ptype ? match_charlist : match_char;
                break;
            case T_STR:
            default:
                self.pattern = pattern;
                self.match = match_str;
                break;
        }
    }
    
    // type
    ,type: null
    // pattern name
    ,name: null
    // pattern
    ,pattern: null
    // pattern type
    ,ptype: null
    // key
    ,key: 0
    
    ,dispose: function( ) {
        var self = this;
        self.type = null;
        self.name = null;
        self.pattern = null;
        self.ptype = null;
        self.key = null;
        return self;
    }
    
    ,match: function( stream, eat ) {
        return false;
    }
});
    
// extends Pattern
CompositePattern = Class(Pattern, {
    constructor: function CompositePattern( name, pattern, useOwnKey ) {
        var self = this;
        self.type = P_COMPOSITE;
        self.name = name;
        self.pattern = pattern;
        self.key = false!==useOwnKey;
    }
    
    ,match: function( stream, eat ) {
        var self = this, i, m, pattern = self.pattern, l = pattern.length, useOwnKey = self.key;
        for (i=0; i<l; i++)
        {
            // each one is a matcher in its own
            m = pattern[ i ].match( stream, eat );
            if ( m ) return useOwnKey ? [ i, m[1] ] : m;
        }
        return false;
    }
});
    
// extends Pattern
BlockPattern = Class(Pattern, {
    constructor: function BlockPattern( name, pattern ) {
        var self = this;
        self.type = P_BLOCK;
        self.name = name;
        self.pattern = pattern;
        self.pattern[0] = new CompositePattern( self.name + '_Start', self.pattern[0], false );
    }
    
    ,match: function( stream, eat ) {
        var self = this, pattern = self.pattern, 
            start = pattern[0], ends = pattern[1], end, 
            match, m, T, T0;
        
        // matches start of block using startMatcher
        // and returns the associated endBlock matcher
        if ( match = start.match( stream, eat ) )
        {
            // use the token key to get the associated endMatcher
            end = ends[ match[0] ];
            T = get_type( end ); T0 = start.pattern[ match[0] ].ptype;
            
            if ( T_REGEX === T0 )
            {
                // regex group number given, get the matched group pattern for the ending of this block
                if ( T_NUM === T )
                {
                    // the regex is wrapped in an additional group, 
                    // add 1 to the requested regex group transparently
                    m = match[1][ end+1 ];
                    end = new Pattern( self.name + '_End', m, m.length > 1 ? T_STR : T_CHAR );
                }
                // string replacement pattern given, get the proper pattern for the ending of this block
                else if ( T_STR === T )
                {
                    // the regex is wrapped in an additional group, 
                    // add 1 to the requested regex group transparently
                    m = group_replace( end, match[1] );
                    end = new Pattern( self.name + '_End', m, m.length > 1 ? T_STR : T_CHAR );
                }
            }
            return end;
        }
        
        return false;
    }
});



function get_re( r, rid, cachedRegexes )
{
    if ( !r || ((T_NUM|T_REGEX) & get_type(r)) ) return r;
    
    var l = rid ? (rid.length||0) : 0, i;
    
    if ( l && rid === r.substr(0, l) ) 
    {
        var regexSource = r.substr(l), delim = regexSource.charAt(0), flags = '',
            regexBody, regexID, regex, i, ch
        ;
        
        // allow regex to have delimiters and flags
        // delimiter is defined as the first character after the regexID
        i = regexSource.length;
        while ( i-- )
        {
            ch = regexSource.charAt(i);
            if ( delim === ch ) break;
            else if ('i' === ch.toLowerCase() ) flags = 'i';
        }
        regexBody = regexSource.substring(1, i);
        regexID = "^(" + regexBody + ")";
        
        if ( !cachedRegexes[ regexID ] )
        {
            regex = new RegExp( regexID, flags );
            
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

function get_combined_re( tokens, boundary )
{
    var b = "", combined;
    if ( T_STR & get_type(boundary) ) b = boundary;
    combined = map( tokens.sort( by_length ), esc_re ).join( "|" );
    return [ new RegExp("^(" + combined + ")"+b), 1 ];
}

function get_simplematcher( name, pattern, key, cachedMatchers ) 
{
    var T = get_type( pattern );
    
    if ( T_NUM === T ) return pattern;
    if ( cachedMatchers[ name ] ) return cachedMatchers[ name ];
    
    key = key || 0;
    var matcher, is_char_list = 0;
    
    if ( pattern && pattern.isCharList )
    {
        is_char_list = 1;
        delete pattern.isCharList;
    }
    
    // get a fast customized matcher for < pattern >
    if ( T_NULL & T ) matcher = new Pattern( name, pattern, T_NULL, key );
    
    else if ( T_CHAR === T ) matcher = new Pattern( name, pattern, T_CHAR, key );
    
    else if ( T_STR & T ) matcher = new Pattern( name, pattern, is_char_list ? T_CHARLIST : T_STR, key );
    
    else if ( (T_REGEX|T_ARRAY) & T ) matcher = new Pattern( name, pattern, T_REGEX, key );
    
    // unknown
    else matcher = pattern;
    
    return cachedMatchers[ name ] = matcher;
}

function get_compositematcher( name, tokens, RegExpID, combined, cachedRegexes, cachedMatchers ) 
{
    if ( cachedMatchers[ name ] ) return cachedMatchers[ name ];
    
    var tmp, i, l, l2, array_of_arrays = 0, 
        has_regexs = 0, is_char_list = 1, 
        T1, T2, matcher
    ;
    
    tmp = make_array( tokens );
    l = tmp.length;
    
    if ( 1 === l )
    {
        matcher = get_simplematcher( name, get_re( tmp[0], RegExpID, cachedRegexes ), 0, cachedMatchers );
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
            matcher = get_simplematcher( name, tmp, 0, cachedMatchers );
        }
        else if ( combined && !(array_of_arrays || has_regexs) )
        {   
            matcher = get_simplematcher( name, get_combined_re( tmp, combined ), 0, cachedMatchers );
        }
        else if ( array_of_arrays || has_regexs )
        {
            for (i=0; i<l; i++)
            {
                if ( T_ARRAY & get_type( tmp[i] ) )
                    tmp[i] = get_compositematcher( name + '_' + i, tmp[i], RegExpID, combined, cachedRegexes, cachedMatchers );
                else
                    tmp[i] = get_simplematcher( name + '_' + i, get_re( tmp[i], RegExpID, cachedRegexes ), i, cachedMatchers );
            }
            
            matcher = l > 1 ? new CompositePattern( name, tmp ) : tmp[0];
        }
        else /* strings */
        {
            tmp = tmp.sort( by_length );
            for (i=0; i<l; i++)
            {
                tmp[i] = get_simplematcher( name + '_' + i, get_re( tmp[i], RegExpID, cachedRegexes ), i, cachedMatchers );
            }
            
            matcher = l > 1 ? new CompositePattern( name, tmp ) : tmp[0];
        }
    }
    return cachedMatchers[ name ] = matcher;
}

function get_blockmatcher( name, tokens, RegExpID, cachedRegexes, cachedMatchers ) 
{
    if ( cachedMatchers[ name ] ) return cachedMatchers[ name ];

    var tmp, i, l, start, end, t1, t2;
    
    // build start/end mappings
    start = []; end = [];
    tmp = make_array_2( tokens ); // array of arrays
    for (i=0, l=tmp.length; i<l; i++)
    {
        t1 = get_simplematcher( name + '_0_' + i, get_re( tmp[i][0], RegExpID, cachedRegexes ), i, cachedMatchers );
        if (tmp[i].length>1)
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
    }
    return cachedMatchers[ name ] = new BlockPattern( name, [start, end] );
}


//
// Token factories
    
Token = Class({
    constructor: function Token( type, name, token, msg ) {
        var self = this;
        self.type = type || T_SIMPLE;
        self.name = name;
        self.token = token;
        //self.pos = null;
        self.status = 0;
        self.msg = msg || null;
        self.$msg = null;
        self.$clone = null;
        if ( T_SOF === self.name ) self.name = '<start-of-file>';
        else if ( T_SOL === self.name ) self.name = '<start-of-line>';
        else if ( T_EOL === self.name ) self.name = '<end-of-line>';
        //else if ( T_EOF === self.name ) self.name = '<end-of-file>';
        else if ( T_EMPTY === self.name ) self.name = '<empty>';
        else if ( T_NONSPACE === self.name ) self.name = '<nonspace>';
    }
    
    // tokenizer/token name/id
    ,name: null
    // tokenizer type
    ,type: null
    // tokenizer token matcher
    ,token: null
    // tokenizer token position
    //,pos: null
    // tokenizer status
    ,status: 0
    // tokenizer err message
    ,msg: null
    ,$msg: null
    ,$clone: null
    ,$id: null
    
    ,dispose: function( ) {
        var self = this;
        self.type = null;
        self.name = null;
        self.token = null;
        //self.pos = null;
        self.status = null;
        self.msg = null;
        self.$msg = null;
        self.$clone = null;
        self.$id = null;
        return self;
    }

    ,clone: function( ) {
        var self = this, t, i, l, $clone = self.$clone;
        
        t = new self.constructor( );
        t.type = self.type;
        t.name = self.name;
        t.token = self.token;
        t.msg = self.msg;
        
        if ( $clone && $clone.length )
        {
            for (i=0,l=$clone.length; i<l; i++)   
                t[ $clone[i] ] = self[ $clone[i] ];
        }
        return t;
    }
    
    ,get: function( stream, state ) {
        var self = this, token = self.token, line, pos,
            type = self.type, tokenID = self.name, t = null;
        
        self.$msg = self.msg || null;
        state.token = null;
        //self.pos = null;
        line = state.line, pos = stream.pos;
        // match SOF (start-of-file)
        if ( T_SOF === type ) 
        { 
            if ( 0 === state.line ) return true;
        }
        // match SOL (start-of-line)
        else if ( T_SOL === type ) 
        { 
            if ( stream.sol() ) return true;
        }
        // match EOL (end-of-line) ( with possible leading spaces )
        else if ( T_EOL === type ) 
        { 
            stream.spc();
            if ( stream.eol() ) return tokenID;
        }
        /*// match EOF (end-of-file) ( with possible leading spaces )
        else if ( T_EOF === type ) 
        { 
            stream.spc();
            if ( stream.eol() ) return true;
        }*/
        // match EMPTY token
        else if ( T_EMPTY === type ) 
        { 
            self.status = 0;
            return true;
        }
        // match non-space
        else if ( T_NONSPACE === type ) 
        { 
            if ( (self.status & REQUIRED) && stream.spc() && !stream.eol() ) self.status |= ERROR;
            self.status &= CLEAR_REQUIRED;
        }
        // else match a simple token
        else if ( t = token.match(stream) ) 
        { 
            state.token = {
                name: tokenID,
                type: tokenID,
                value: stream.cur(),
                token: t[1],
                pos: [line,pos,line,stream.pos]
            };
            return tokenID; 
        }
        if ( self.status && self.$msg ) self.$msg = group_replace( self.$msg, tokenID, true );
        return false;
    }
    
    ,req: function( bool ) { 
        var self = this;
        if ( !bool ) self.status &= CLEAR_REQUIRED;
        else self.status |= REQUIRED;
        return self;
    }
    
    ,err: function( state, l1, c1, l2, c2 ) {
        var t = this, m, token = t.name;
        if ( t.$msg ) m = t.$msg;
        else if ( t.status & REQUIRED ) m = 'Token "'+token+'" Expected';
        else m = 'Syntax Error: "'+token+'"';
        if ( state && (state.status & ERRORS) )
        {
            state.err[l1+'_'+c1+'_'+l2+'_'+c2+'_'+token] = [l1, c1, l2, c2, m];
        }
        return m;
    }
});

// extends Token
ActionToken = Class(Token, {
    constructor: function ActionToken( type, name, action, msg, case_insensitive ) {
        var self = this;
        self.type = type || T_ACTION;
        self.name = name;
        self.token = action;
        //self.pos = null;
        self.status = 0;
        self.msg = msg || null;
        self.$msg = null;
        self.ci = !!case_insensitive;
        self.$clone = ['ci'];
    }
     
    ,ci: 0
    
    ,get: function( stream, state ) {
        var self = this, action_def = self.token || null, action, 
        t, t0, ns, msg, queu = state.queu, symb = state.symb, ctx = state.ctx, token = state.token,
        l1, c1, l2, c2, in_ctx, err = state.err, error, emsg, with_errors = !!(state.status&ERRORS),
        case_insensitive = self.ci;
        
        self.status = 0; self.$msg = null;
        
        // do action only if state.status handles (action) errors, else dont clutter
        if ( !action_def || (!with_errors && ((~A_OVERWR) & action_def[ 0 ])) ) return true;
        
        action = action_def[ 0 ]; t = action_def[ 1 ]; in_ctx = !!action_def[ 2 ];
        
        if ( A_OVERWR === action )
        {
            //if ( state.token ) state.token.type = t;
            state.$replace$ = t;
            return true;
        }
        
        msg = self.msg;
        if ( token && token.pos )
        {
            l1 = token.pos[0];
            c1 = token.pos[1];
            l2 = token.pos[2];
            c2 = token.pos[3];
        }
        else
        {
            l1 = l2 = state.line;
            c2 = stream.pos;
            c1 = token.value ? c2-token.value.length : c2-1;
        }
        
        if ( A_ERROR === action )
        {
            if ( msg ) self.$msg = token ? group_replace( msg, token.token, true ) : msg;
            else self.$msg = 'Error';
            error = l1+'_'+c1+'_'+l2+'_'+c2+'_'+self.name;
            err[error] = [l1,c1,l2,c2,self.err()];
            self.status |= ERROR;
            return false;
        }
        
        else if ( A_CTXSTART === action )
        {
            ctx.unshift({symb:{},queu:[]});
        }
        
        else if ( A_CTXEND === action )
        {
            if ( ctx.length ) ctx.shift();
        }
        
        else if ( A_EMPTY === action )
        {
            if ( in_ctx )
            {
                if ( ctx.length ) ctx[0].queu.length = 0;
            }
            else
            {
                queu.length = 0;
            }
        }
        
        /*else if ( A_INDENT === action )
        {
            // TODO
        }
        
        else if ( A_OUTDENT === action )
        {
            // TODO
        }*/
        
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
                t0 = T_NUM === get_type( t0 ) ? token.token[ t0 ] : group_replace( t0, token.token, true );
                if ( case_insensitive ) t0 = t0[LOWER]();
                if ( !symb[HAS](ns) ) symb[ns] = { };
                if ( symb[ns][HAS](t0) )
                {
                    // duplicate
                    if ( msg ) self.$msg = group_replace( msg, t0, true );
                    else self.$msg = 'Duplicate "'+t0+'"';
                    emsg = self.err( );
                    error = symb[ns][t0][0]+'_'+symb[ns][t0][1]+'_'+symb[ns][t0][2]+'_'+symb[ns][t0][3]+'_'+self.name;
                    err[error] = [symb[ns][t0][0],symb[ns][t0][1],symb[ns][t0][2],symb[ns][t0][3],emsg];
                    error = l1+'_'+c1+'_'+l2+'_'+c2+'_'+self.name;
                    err[error] = [l1,c1,l2,c2,emsg];
                    self.status |= ERROR;
                    return false;
                }
                else
                {
                    symb[ns][t0] = [l1,c1,l2,c2];
                }
            }
        }
        
        else if ( A_POP === action )
        {
            if ( in_ctx )
            {
                if ( ctx.length ) queu = ctx[0].queu;
                else return true;
            }
            if ( t )
            {
                if ( token )
                    t = T_NUM === get_type( t ) ? token.token[ t ] : group_replace( t, token.token );
                
                if ( case_insensitive ) t = t[LOWER]();
                
                if ( !queu.length || t !== queu[0][0] ) 
                {
                    // no match
                    if ( queu.length )
                    {
                        if ( msg ) self.$msg = group_replace( msg, [queu[0][0],t], true );
                        else self.$msg = 'Tokens do not match "'+queu[0][0]+'","'+t+'"';
                        emsg = self.err( );
                        error = queu[0][1]+'_'+queu[0][2]+'_'+queu[0][3]+'_'+queu[0][4]+'_'+self.name;
                        err[error] = [queu[0][1],queu[0][2],queu[0][3],queu[0][4],emsg];
                        error = l1+'_'+c1+'_'+l2+'_'+c2+'_'+self.name;
                        err[error] = [l1,c1,l2,c2,emsg];
                    }
                    else
                    {
                        if ( msg ) self.$msg = group_replace( msg, ['',t], true );
                        else self.$msg = 'Token does not match "'+t+'"';
                        emsg = self.err( );
                        error = l1+'_'+c1+'_'+l2+'_'+c2+'_'+self.name;
                        err[error] = [l1,c1,l2,c2,emsg];
                    }
                    queu.shift( );
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
        
        else if ( (A_PUSH === action) && t )
        {
            if ( in_ctx )
            {
                if ( ctx.length ) queu = ctx[0].queu;
                else return true;
            }
            if ( token )
                t = T_NUM === get_type( t ) ? token.token[ t ] : group_replace( t, token.token );
            if ( case_insensitive ) t = t[LOWER]();
            queu.unshift( [t, l1, c1, l2, c2] );
        }
        return true;
    }
});
            
// extends Token
BlockToken = Class(Token, {
    constructor: function BlockToken( type, name, token, msg, multiline, escaped, has_interior ) {
        var self = this;
        self.type = type;
        self.name = name;
        self.token = token;
        //self.pos = null;
        self.status = 0;
        self.msg = msg || null;
        // a block is multiline by default
        self.mline = 'undefined' === typeof(multiline) ? true : !!multiline;
        self.esc = escaped;
        self.inter = has_interior;
        self.$msg = null;
        self.$clone = ['mline', 'esc', 'inter'];
    }
     
    ,inter: 0
    ,mline: 0
    ,esc: null
    
    ,get: function( stream, state ) {
        var self = this, ended = 0, found = 0, endBlock, next = "", continueToNextLine, stackPos, 
            allowMultiline = self.mline, startBlock = self.token, thisBlock = self.name, type = self.type,
            hasInterior = self.inter, thisBlockInterior = hasInterior ? (thisBlock+'.inside') : thisBlock,
            charIsEscaped = 0, escChar = self.esc, isEscapedBlock = !!escChar,
            isEOLBlock, alreadyIn, ret, streamPos, streamPos0, continueBlock,
            b_s, b_e, b_i, b_1='', b_2='', b_3='', b_21='', lin, col, stack = state.stack
        ;
        
        /*
            This tokenizer class handles many different block types ( BLOCK, COMMENT, ESC_BLOCK, SINGLE_LINE_BLOCK ),
            having different styles ( DIFFERENT BLOCK DELIMS/INTERIOR ) etc..
            So logic can become somewhat complex,
            descriptive names and logic used here for clarity as far as possible
        */
        
        self.$msg = self.msg || null;
        //self.pos = null;
        lin = state.line; col = stream.pos;
        // comments in general are not required tokens
        if ( T_COMMENT === type ) self.status &= CLEAR_REQUIRED;
        
        alreadyIn = 0;
        if ( state.block && state.block.name === thisBlock )
        {
            found = 1;
            endBlock = state.block.end;
            alreadyIn = 1;
            ret = thisBlockInterior;
            b_s = state.block.s;
            b_i = state.block.i;
            b_e = state.block.e;
            b_1 = state.block._s;
            b_2 = state.block._i;
            b_21 = '';
        }    
        else if ( (!state.block||!state.block.name) && (endBlock = startBlock.match(stream)) )
        {
            found = 1;
            b_s = [lin,col];
            b_i = [[lin,stream.pos],[lin,stream.pos]];
            b_e = [lin,stream.pos];
            b_1 = stream.cur( );
            b_2 = '';
            b_21 = '';
            b_3 = '';
            state.block = {name:thisBlock, end:endBlock, s:b_s, i:b_i, e:b_e, _s:b_1, _i:b_2, _e:b_3};
            ret = thisBlock;
        }    
        
        if ( found )
        {
            stackPos = stack.length;
            
            isEOLBlock = T_NULL === endBlock.type;
            
            if ( hasInterior )
            {
                if ( alreadyIn && isEOLBlock && stream.sol( ) )
                {
                    self.status &= CLEAR_REQUIRED;
                    // ?????
                    state.token = null;
                    state.block = null;
                    return false;
                }
                
                if ( !alreadyIn )
                {
                    push_at( stack, stackPos, self.clone( ), '$id', thisBlock );
                    return ret;
                }
            }
            
            ended = endBlock.match( stream );
            continueToNextLine = allowMultiline;
            continueBlock = 0;
            
            if ( !ended )
            {
                streamPos0 = stream.pos;
                while ( !stream.eol( ) ) 
                {
                    streamPos = stream.pos;
                    if ( !(isEscapedBlock && charIsEscaped) && endBlock.match(stream) ) 
                    {
                        if ( hasInterior )
                        {
                            if ( stream.pos > streamPos && streamPos > streamPos0 )
                            {
                                ret = thisBlockInterior;
                                stream.bck(streamPos);
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
                        b_3 = stream.cur().slice(b_21.length);
                        break;
                    }
                    else
                    {
                        next = stream.nxt( );
                        b_21 += next;
                    }
                    charIsEscaped = !charIsEscaped && next === escChar;
                }
            }
            else
            {
                ret = isEOLBlock ? thisBlockInterior : thisBlock;
                b_3 = stream.cur().slice(b_21.length);
            }
            continueToNextLine = allowMultiline || (isEscapedBlock && charIsEscaped);
            
            b_i[1] = [lin, streamPos];
            b_e = [lin, stream.pos];
            if ( ended || (!continueToNextLine && !continueBlock) )
            {
                state.block = null;
            }
            else
            {
                state.block.i = b_i;
                state.block.e = b_e;
                state.block._i += b_21;
                state.block._e = b_3;
                push_at( stack, stackPos, self.clone( ), '$id', thisBlock );
            }
            state.token = {
                name: thisBlock,
                type: ret,
                value: stream.cur(),
                token: [b_1+b_2+b_21+b_3, b_2+b_21, b_1, b_3],
                pos: [b_s[0],b_s[1],b_e[0],b_e[1]]
            };
            return ret;
        }
        if ( self.status && self.$msg ) self.$msg = group_replace( self.$msg, thisBlock, true );
        return false;
    }
});
            
// extends Token
CompositeToken = Class(Token, {
    constructor: function CompositeToken( type, name, tokens, msg, min, max ) {
        var self = this;
        self.type = type ? type : T_REPEATED;
        self.name = name || null;
        self.token = null;
        //self.pos = null;
        self.status = 0;
        self.msg = msg || null;
        self.min = min || 0;
        self.max = max || INF;
        self.found = 0;
        self.$msg = null;
        self.$clone = ['min', 'max', 'found'];
        if ( tokens ) self.set( tokens );
    }
     
    ,min: 0
    ,max: 1
    ,found: 0
    
    ,set: function( tokens ) {
        if ( tokens ) this.token = make_array( tokens );
        return this;
    }
    
    ,get: function( stream, state ) {
        var self = this, i, i0, type = self.type, token, action, style, 
            tokens = self.token, n = tokens.length, t, pos, stack, err,
            found, min, max, tokensRequired, tokensErr, streamPos, stackPos, stackId, match_all;
        
        self.$msg = self.msg || null;
        self.status &= CLEAR_ERROR;
        streamPos = stream.pos;
        stack = state.stack;
        if ( T_EITHER === type )
        {
            tokensRequired = 0; tokensErr = 0;
            self.status |= REQUIRED;
            err = [];
            
            for (i=0; i<n; i++)
            {
                token = tokens[i].clone().req( 1 );
                style = token.get(stream, state);
                
                if ( token.status & REQUIRED )
                {
                    tokensRequired++;
                    err.push(token.err());
                }
                
                if ( false !== style )
                {
                    return style;
                }
                else if ( token.status & ERROR )
                {
                    tokensErr++;
                    stream.bck( streamPos );
                }
            }
            
            if ( tokensRequired > 0 ) self.status |= REQUIRED;
            else self.status &= CLEAR_REQUIRED;
            if ( (n === tokensErr) && (tokensRequired > 0) ) self.status |= ERROR;
            else self.status &= CLEAR_ERROR;
            if ( self.status && !self.$msg && err.length ) self.$msg = err.join(' | ');
            return false;
        }
        else if ( T_SEQUENCE_OR_NGRAM & type )
        {
            match_all = type & T_SEQUENCE ? 1 : 0;
            if ( match_all ) self.status |= REQUIRED;
            else self.status &= CLEAR_REQUIRED;
            stackPos = stack.length;
            stackId = self.name+'_'+get_id();
            i0 = 0;
            token = tokens[ i0 ].clone().req( match_all );
            style = token.get(stream, state);
            
            if ( false !== style )
            {
                // not empty token
                if ( true !== style || T_EMPTY !== token.type )
                {
                    for (i=n-1; i>i0; i--)
                        push_at( stack, stackPos+n-i-1, tokens[ i ].clone().req( 1 ), '$id', stackId );
                }
                    
                return style;
            }
            else if ( token.status & ERROR /*&& token.REQ*/ )
            {
                if ( match_all ) self.status |= ERROR;
                else self.status &= CLEAR_ERROR;
                stream.bck( streamPos );
            }
            else if ( match_all && (token.status & REQUIRED) )
            {
                self.status |= ERROR;
            }
            
            if ( self.status && !self.$msg ) self.$msg = token.err();
            return false;
        }
        else
        {
            tokensRequired = 0;
            found = self.found; min = self.min; max = self.max;
            self.status &= CLEAR_REQUIRED;
            stackPos = stack.length;
            stackId = self.name+'_'+get_id( );
            err = [];
            
            for (i=0; i<n; i++)
            {
                token = tokens[i].clone( ).req( 1 );
                style = token.get( stream, state );
                
                if ( false !== style )
                {
                    ++found;
                    if ( found <= max )
                    {
                        // push it to the stack for more
                        self.found = found;
                        push_at( stack, stackPos, self.clone( ), '$id', stackId );
                        self.found = 0;
                        return style;
                    }
                    break;
                }
                else if ( token.status & REQUIRED )
                {
                    tokensRequired++;
                    err.push(token.err());
                }
                if ( token.status&ERROR ) stream.bck( streamPos );
            }
            
            if ( found < min ) self.status |= REQUIRED;
            else self.status &= CLEAR_REQUIRED;
            if ( (found > max) || (found < min && 0 < tokensRequired) ) self.status |= ERROR;
            else self.status &= CLEAR_ERROR;
            if ( self.status && !self.$msg && err.length ) self.$msg = err.join(' | ');
            return false;
        }
    }
});

    
function get_comments( tok, comments ) 
{
    // build start/end mappings
    var tmp = make_array_2(tok.tokens.slice()); // array of arrays
    var start, end, lead, i, l;
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
}

function get_autocomplete( tok, type, keywords ) 
{
    var meta = tok.meta || type,
        kws = map(make_array(tok.tokens), function(word){return {word:word, meta:meta};});
    keywords.autocomplete = (keywords.autocomplete || []).concat( kws );
}

function get_delimited( src, delim, esc, collapse_esc )
{
    var c, i=src.pos, l=src.length, s='', escaped, is_esc, esc_cnt, can_be_escaped=!!esc;
    if ( can_be_escaped )
    {
        collapse_esc = !!collapse_esc; escaped = false; esc_cnt = 0;
        while ( i<l )
        {
            c = src.charAt(i++);
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
        src.pos = i;
        return s;
    }
    while ( i<l )
    {
        c = src.charAt(i++);
        if ( delim === c ) break;
        s += c;
    }
    src.pos = i;
    return s;
}

function parse_peg_bnf_notation( tok, Lex, Syntax )
{
    var alternation, sequence, token, literal, repeat, 
        t, c, fl, prev_token, curr_token, stack, tmp, overwrite = false;
    
    t = new String( trim(tok) );
    t.pos = 0;
    
    if ( 1 === t.length )
    {
        curr_token = '' + tok;
        if ( !Lex[ curr_token ] ) Lex[ curr_token ] = {type:"simple", tokens:tok};
        tok = curr_token;
    }
    else
    {
        // parse PEG/BNF-like shorthand notations for syntax groups
        alternation = [ ];
        sequence = [ ];
        token = '';
        stack = [];
        while ( t.pos < t.length )
        {
            c = t.charAt( t.pos++ );
            
            if ( peg_bnf_notation_re.test( c ) )
            {
                if ( token.length )
                {
                    if ( overwrite )
                    {
                        // interpret as overwrite action
                        curr_token = 'overwrite_$' + token + '$';
                        if ( !Lex[curr_token] )
                        {
                            Lex[ curr_token ] = {
                                type: 'action',
                                overwrite: token
                            };
                        }
                        sequence.push( curr_token );
                        overwrite = false;
                    }
                    else if ( '0' === token )
                    {
                        // interpret as empty tokenizer
                        sequence.push( T_EMPTY );
                    }
                    else if ( '^^' === token )
                    {
                        // interpret as SOF tokenizer
                        sequence.push( T_SOF );
                    }
                    else if ( '^' === token )
                    {
                        // interpret as SOL tokenizer
                        sequence.push( T_SOL );
                    }
                    else if ( '$' === token )
                    {
                        // interpret as EOL tokenizer
                        sequence.push( T_EOL );
                    }
                    /*else if ( '$$' === token )
                    {
                        // interpret as EOF tokenizer
                        sequence.push( T_EOF );
                    }*/
                    else
                    {
                        if ( !Lex[token] && !Syntax[token] )
                        {
                            Lex[ token ] = {
                                type: 'simple',
                                tokens: token
                            };
                        }
                        sequence.push( token );
                    }
                    token = '';
                }
            
                if ( '.' === c )
                {
                    overwrite = true;
                }
                
                else if ( '"' === c || "'" === c )
                {
                    overwrite = false;
                    // literal token, quoted
                    literal = get_delimited( t, c, false );
                    if ( literal.length )
                    {
                        curr_token = '' + literal;
                        if ( !Lex[curr_token] )
                        {
                            Lex[curr_token] = {
                                type: 'simple',
                                tokens: literal
                            };
                        }
                        sequence.push( curr_token );
                    }
                    else
                    {
                        // interpret as non-space tokenizer
                        sequence.push( '' );
                    }
                }
                
                else if ( '/' === c )
                {
                    overwrite = false;
                    // literal regex token
                    literal = get_delimited( t, c, '\\', true ); fl = '';
                    if ( literal.length )
                    {
                        if ( t.pos < t.length && 'i' === t.charAt(t.pos) ) { t.pos++; fl = 'i'; }
                        curr_token = '/' + literal + '/' + fl;
                        if ( !Lex[curr_token] )
                        {
                            Lex[curr_token] = {
                                type: 'simple',
                                tokens: new RegExp("^(" + literal + ")",fl)
                            };
                        }
                        sequence.push( curr_token );
                    }
                }
                
                else if ( '*' === c || '+' === c || '?' === c )
                {
                    overwrite = false;
                    // repeat modifier, applies to token that comes before
                    prev_token = sequence.pop( );
                    curr_token = '' + prev_token + c;
                    if ( !Syntax[ curr_token ] )
                    {
                        Syntax[ curr_token ] = {
                            type: 'group',
                            match: '*' === c ? 'zeroOrMore' : ('+' === c ? 'oneOrMore' : 'zeroOrOne'),
                            tokens: [prev_token]
                        }
                    }
                    sequence.push( curr_token );
                }
                
                else if ( '{' === c )
                {
                    overwrite = false;
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
                    
                    prev_token = sequence.pop( );
                    curr_token = '' + prev_token + [
                        '{',
                        repeat[0],
                        ',',
                        isFinite(repeat[1]) ? repeat[1] : '',
                        '}'
                    ].join('');
                    if ( !Syntax[ curr_token ] )
                    {
                        Syntax[ curr_token ] = {
                            type: 'group',
                            match: [repeat[0], repeat[1]],
                            tokens: [prev_token]
                        }
                    }
                    sequence.push( curr_token );
                }
                
                else if ( '}' === c )
                {
                    overwrite = false;
                    // literal repeat end modifier, should be handled in previous case
                    // added here just for completeness
                    continue;
                }
                
                else if ( '[' === c )
                {
                    overwrite = false;
                    // start of character select
                    literal = get_delimited( t, ']', false );
                    curr_token = '[' + literal + ']';
                    if ( !Lex[curr_token] )
                    {
                        Lex[curr_token] = {
                            type: 'simple',
                            tokens: literal.split('')/*new RegExp("^([" + literal + "])",'')*/
                        };
                    }
                    sequence.push( curr_token );
                }
                
                else if ( ']' === c )
                {
                    overwrite = false;
                    // end of character select, should be handled in previous case
                    // added here just for completeness
                    continue;
                }
                
                else if ( '|' === c )
                {
                    overwrite = false;
                    // alternation
                    if ( sequence.length > 1 )
                    {
                        curr_token = '' + sequence.join( " " );
                        if ( !Syntax[curr_token] )
                        {
                            Syntax[curr_token] = {
                                type: 'group',
                                match: 'sequence',
                                tokens: sequence
                            };
                        }
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
                    overwrite = false;
                    // start of grouped sub-sequence
                    stack.push([sequence, alternation, token, overwrite]);
                    sequence = []; alternation = []; token = '';
                }
                
                else if ( ')' === c )
                {
                    overwrite = false;
                    // end of grouped sub-sequence
                    if ( sequence.length > 1 )
                    {
                        curr_token = '' + sequence.join( " " );
                        if ( !Syntax[curr_token] )
                        {
                            Syntax[curr_token] = {
                                type: 'group',
                                match: 'sequence',
                                tokens: sequence
                            };
                        }
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
                        if ( !Syntax[curr_token] )
                        {
                            Syntax[curr_token] = {
                                type: 'group',
                                match: 'either',
                                tokens: alternation
                            };
                        }
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
                    if ( !Syntax[curr_token] ) Syntax[curr_token] = clone( Lex[prev_token] || Syntax[prev_token] );
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
            if ( overwrite )
            {
                // interpret as overwrite action
                curr_token = 'overwrite_$' + token + '$';
                if ( !Lex[curr_token] )
                {
                    Lex[ curr_token ] = {
                        type: 'action',
                        overwrite: token
                    };
                }
                sequence.push( curr_token );
                overwrite = false;
            }
            else if ( '0' === token )
            {
                // interpret as empty tokenizer
                sequence.push( T_EMPTY );
            }
            else if ( '^^' === token )
            {
                // interpret as SOF tokenizer
                sequence.push( T_SOF );
            }
            else if ( '^' === token )
            {
                // interpret as SOL tokenizer
                sequence.push( T_SOL );
            }
            else if ( '$' === token )
            {
                // interpret as EOL tokenizer
                sequence.push( T_EOL );
            }
            /*else if ( '$$' === token )
            {
                // interpret as EOF tokenizer
                sequence.push( T_EOF );
            }*/
            else
            {
                if ( !Lex[token] && !Syntax[token] )
                {
                    Lex[ token ] = {
                        type: 'simple',
                        tokens: token
                    };
                }
                sequence.push( token );
            }
        }
        token = '';
        
        if ( sequence.length > 1 )
        {
            curr_token = '' + sequence.join( " " );
            if ( !Syntax[curr_token] )
            {
                Syntax[curr_token] = {
                    type: 'group',
                    match: 'sequence',
                    tokens: sequence
                };
            }
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
            if ( !Syntax[curr_token] )
            {
                Syntax[curr_token] = {
                    type: 'group',
                    match: 'either',
                    tokens: alternation
                };
            }
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
    return tok;
}

function pre_process_grammar( grammar )
{
    if ( !grammar.Lex ) grammar.Lex = {};
    if ( !grammar.Syntax ) grammar.Syntax = {};
    var id, type, t, tok, T, xtends, xtok,
        Lex = grammar.Lex, Syntax = grammar.Syntax, 
        conf = [Lex, Syntax], nG = conf.length, G, i, i1, i2, T1;
    
    // fix shorthand token-type annotations in token_ID
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
                G[id] = G[t]; delete G[t];
                if ( type )
                {
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
                            G[id].error = true;
                            G[id].msg = tok;
                        }
                        else if ( 'action' === type && T_STR === T ) G[id][tok] = true;
                        else G[id].tokens = tok;
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
                // shorthands for single-line/escaped block tokens
                if ( 'line-block' === G[id].type[LOWER]() )
                {
                    G[id].type = 'block';
                    G[id].multiline = false;
                }
                else if ( 'escaped-line-block' === G[id].type[LOWER]() )
                {
                    G[id].type = 'block';
                    G[id].escape = '\\';
                    G[id].multiline = false;
                }
                else if ( 'escaped-block' === G[id].type[LOWER]() )
                {
                    G[id].type = 'block';
                    G[id].escape = '\\';
                    G[id].multiline = true;
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
            xtends = tok['extend']; 
            xtok = Lex[ xtends ]/* || Syntax[ xtends ]*/;
            delete tok['extend'];
            if ( xtok ) 
            {
                // tokens given directly, no token configuration object, wrap it
                if ( T_STR_OR_ARRAY_OR_REGEX & get_type( xtok ) )
                {
                    xtok = Lex[ xtends ] = {type:"simple", tokens:xtok};
                }
                tok = extend( xtok, tok );
            }
            // xtok may in itself extend another tok and so on,
            // loop and get all references
        }
    }
    
    // fix shorthand configurations and provide defaults
    i = 0;
    while ( i < nG )
    {
        G = conf[i++];
        for (id in G)
        {
            if ( !G[HAS](id) ) continue;
            tok = G[id];
            // provide some defaults
            if ( T_OBJ === get_type(tok) && 'undefined' === typeof tok.type )
            {
                if ( tok[HAS]('overwrite') )
                {
                    tok.type = "action";
                    tok.action = [ 'overwrite', tok.overwrite, !!tok['in-context'] ];
                    delete tok.overwrite;
                }
                else if ( tok[HAS]('error') )
                {
                    tok.type = "action";
                    tok.action = [ 'error', tok.error, !!tok['in-context'] ];
                    delete tok.error;
                }
                else if ( tok[HAS]('context-start') )
                {
                    tok.type = "action";
                    tok.action = [ 'context-start', tok['context-start'], !!tok['in-context'] ];
                    delete tok['context-start'];
                }
                else if ( tok[HAS]('context-end') )
                {
                    tok.type = "action";
                    tok.action = [ 'context-end', tok['context-end'], !!tok['in-context'] ];
                    delete tok['context-end'];
                }
                else if ( tok[HAS]('empty') )
                {
                    tok.type = "action";
                    tok.action = [ 'empty', tok.empty, !!tok['in-context'] ];
                    delete tok.empty;
                }
                else if ( tok[HAS]('indent') )
                {
                    tok.type = "action";
                    tok.action = [ 'indent', tok.indent, !!tok['in-context'] ];
                    delete tok.indent;
                }
                else if ( tok[HAS]('outdent') )
                {
                    tok.type = "action";
                    tok.action = [ 'outdent', tok.outdent, !!tok['in-context'] ];
                    delete tok.outdent;
                }
                else if ( tok[HAS]('unique') )
                {
                    tok.type = "action";
                    tok.action = [ 'unique', T_STR&get_type(tok.unique) ? ['_DEFAULT_', tok.unique] : tok.unique, !!tok['in-context'] ];
                    delete tok.unique;
                }
                else if ( tok[HAS]('push') )
                {
                    tok.type = "action";
                    tok.action = [ 'push', tok.push, !!tok['in-context'] ];
                    delete tok.push;
                }
                else if ( tok[HAS]('pop') )
                {
                    tok.type = "action";
                    tok.action = [ 'pop', tok.pop, !!tok['in-context'] ];
                    delete tok.pop;
                }
                else if ( tok['sequence'] || tok['all']  )
                {
                    tok.type = "group";
                    tok.match = "sequence";
                    tok.tokens = tok['sequence'] || tok['all'];
                    if ( tok['all'] ) delete tok['all'];
                    else delete tok['sequence'];
                }
                else if ( tok['either'] )
                {
                    tok.type = "group";
                    tok.match = "either";
                    tok.tokens = tok['either'];
                    delete tok['either'];
                }
                else if ( tok['zeroOrMore'] )
                {
                    tok.type = "group";
                    tok.match = "zeroOrMore";
                    tok.tokens = tok['zeroOrMore'];
                    delete tok['zeroOrMore'];
                }
                else if ( tok['oneOrMore'] )
                {
                    tok.type = "group";
                    tok.match = "oneOrMore";
                    tok.tokens = tok['oneOrMore'];
                    delete tok['oneOrMore'];
                }
                else if ( tok['zeroOrOne'] )
                {
                    tok.type = "group";
                    tok.match = "zeroOrOne";
                    tok.tokens = tok['zeroOrOne'];
                    delete tok['zeroOrOne'];
                }
                else if ( tok['escaped-line-block'] )
                {
                    tok.type = "block";
                    if ( !tok.escape ) tok.escape = '\\';
                    tok.multiline = false;
                    tok.tokens = tok['escaped-line-block'];
                    delete tok['escaped-line-block'];
                }
                else if ( tok['escaped-block'] )
                {
                    tok.type = "block";
                    if ( !tok.escape ) tok.escape = '\\';
                    tok.tokens = tok['escaped-block'];
                    delete tok['escaped-block'];
                }
                else if ( tok['line-block'] )
                {
                    tok.type = "block";
                    tok.escape = false;
                    tok.multiline = false;
                    tok.tokens = tok['line-block'];
                    delete tok['line-block'];
                }
                else if ( tok['comment'] )
                {
                    tok.type = "comment";
                    tok.tokens = tok['comment'];
                    delete tok['comment'];
                }
                else if ( tok['block'] )
                {
                    tok.type = "block";
                    tok.tokens = tok['block'];
                    delete tok['block'];
                }
                else if ( tok['simple'] )
                {
                    tok.type = "simple";
                    tok.tokens = tok['simple'];
                    delete tok['simple'];
                }
                else
                {
                    tok.type = "simple";
                }
            }
            if ( 'simple' === tok.type )
            {
                tok.autocomplete = !!tok.autocomplete;
                tok.meta = tok.autocomplete && (T_STR & get_type(tok.meta)) ? tok.meta : null;
            }
            else if ( 'block' === tok.type || 'comment' === tok.type )
            {
                tok.multiline = tok[HAS]('multiline') ? !!tok.multiline : true;
                if ( !(T_STR & get_type(tok.escape)) ) tok.escape = false;
            }
        }
    }
    return grammar;
}

function get_tokenizer( tokenID, RegExpID, Lex, Syntax, Style, 
                    cachedRegexes, cachedMatchers, cachedTokens, 
                    interleavedTokens, comments, keywords ) 
{
    var t, tok, token = null, tokens, type, combine, matchType, MSG = null;
    
    if ( T_SOF === tokenID )
    {
        // SOF Token
        return new Token( T_SOF, T_SOF, tokenID, MSG );
    }
    
    else if ( T_SOL === tokenID )
    {
        // SOL Token
        return new Token( T_SOL, T_SOL, tokenID, MSG );
    }
    
    else if ( T_EOL === tokenID || null === tokenID )
    {
        // EOL Token
        return new Token( T_EOL, T_EOL, tokenID, MSG );
    }
    
    /*else if ( T_EOF === tokenID )
    {
        // EOF Token
        return new Token( T_EOF, T_EOF, tokenID, MSG );
    }*/
    
    else if ( "" === tokenID )
    {
        // NONSPACE Token
        return new Token( T_NONSPACE, 'NONSPACE', tokenID, MSG );
    }
    
    else if ( false === tokenID || 0 === tokenID )
    {
        // EMPTY Token
        return new Token( T_EMPTY, 'EMPTY', tokenID, MSG );
    }
    
    else if ( T_ARRAY & get_type( tokenID ) )
    {
        // literal n-gram as array
        t = tokenID;
        tokenID = "NGRAM_" + t.join("_");
        if ( !Syntax[ tokenID ] )
        {
            Syntax[ tokenID ] = {
                type: "ngram",
                tokens: t
            };
        }
    }
    
    tokenID = '' + tokenID;
    if ( cachedTokens[ tokenID ] ) return cachedTokens[ tokenID ];
    
    tok = Lex[ tokenID ] || Syntax[ tokenID ] || tokenID;
    if ( T_STR & get_type(tok) )
    {
        tok = parse_peg_bnf_notation( tok, Lex, Syntax );
        tok = Lex[ tok ] || Syntax[ tok ] || null;
    }
    if ( !tok ) return null;
    
    type = tok.type ? tokenTypes[ tok.type[LOWER]( ).replace( dashes_re, '' ) ] || T_SIMPLE : T_SIMPLE;
    MSG = tok.msg || null;
    
    if ( T_SIMPLE & type )
    {
        if ( T_SOF === tok.tokens )
        {
            // SOF Token
            token = new Token( T_SOF, tokenID, tokenID, MSG );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        
        else if ( T_SOL === tok.tokens )
        {
            // SOL Token
            token = new Token( T_SOL, tokenID, tokenID, MSG );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        
        else if ( T_EOL === tok.tokens || null === tok.tokens )
        {
            // EOL Token
            token = new Token( T_EOL, tokenID, tokenID, MSG );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        
        /*else if ( T_EOF === tok.tokens )
        {
            // EOF Token
            token = new Token( T_EOF, tokenID, tokenID, MSG );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }*/
        
        else if ( "" === tok.tokens )
        {
            // NONSPACE Token
            token = new Token( T_NONSPACE, tokenID, tokenID, MSG );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        
        else if ( false === tok.tokens || 0 === tok.tokens )
        {
            // EMPTY Token
            token = new Token( T_EMPTY, tokenID, tokenID, MSG );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        
        else if ( !tok.tokens )
        {
            return null;
        }
    }

    if ( !(T_ACTION & type) ) tok.tokens = make_array( tok.tokens );
    
    if ( T_ACTION & type )
    {
        if ( !tok[HAS]('action') )
        {
            if ( tok[HAS]('overwrite') ) tok.action = [A_OVERWR, tok.overwrite, !!tok['in-context']];
            else if ( tok[HAS]('error') ) tok.action = [A_ERROR, tok.error, !!tok['in-context']];
            else if ( tok[HAS]('context-start') ) tok.action = [A_CTXSTART, tok['context-start'], !!tok['in-context']];
            else if ( tok[HAS]('context-end') ) tok.action = [A_CTXEND, tok['context-end'], !!tok['in-context']];
            else if ( tok[HAS]('empty') ) tok.action = [A_EMPTY, tok.empty, !!tok['in-context']];
            else if ( tok[HAS]('indent') ) tok.action = [A_INDENT, tok.indent, !!tok['in-context']];
            else if ( tok[HAS]('outdent') ) tok.action = [A_OUTDENT, tok.outdent, !!tok['in-context']];
            else if ( tok[HAS]('unique') ) tok.action = [A_UNIQUE, T_STR&get_type(tok.unique)?['_DEFAULT_',tok.unique]:tok.unique, !!tok['in-context']];
            else if ( tok[HAS]('push') ) tok.action = [A_PUSH, tok.push, !!tok['in-context']];
            else if ( tok[HAS]('pop') ) tok.action = [A_POP, tok.pop, !!tok['in-context']];
        }
        else
        {
            if ( 'overwrite' === tok.action[0] ) tok.action[0] = A_OVERWR;
            else if ( 'error' === tok.action[0] ) tok.action[0] = A_ERROR;
            else if ( 'context-start' === tok.action[0] ) tok.action[0] = A_CTXSTART;
            else if ( 'context-end' === tok.action[0] ) tok.action[0] = A_CTXEND;
            else if ( 'empty' === tok.action[0] ) tok.action[0] = A_EMPTY;
            else if ( 'indent' === tok.action[0] ) tok.action[0] = A_INDENT;
            else if ( 'outdent' === tok.action[0] ) tok.action[0] = A_OUTDENT;
            else if ( 'unique' === tok.action[0] ) tok.action[0] = A_UNIQUE;
            else if ( 'push' === tok.action[0] ) tok.action[0] = A_PUSH;
            else if ( 'pop' === tok.action[0] ) tok.action[0] = A_POP;
        }
        token = new ActionToken( T_ACTION, tokenID, tok.action.slice(), MSG, tok.caseInsensitive||tok.ci );
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
    }
    
    else if ( T_SIMPLE & type )
    {
        if ( tok.autocomplete ) get_autocomplete( tok, tokenID, keywords );
        
        // combine by default if possible using word-boundary delimiter
        combine = 'undefined' === typeof(tok.combine) ? "\\b" : tok.combine;
        token = new Token( T_SIMPLE, tokenID,
                    get_compositematcher( tokenID, tok.tokens.slice(), RegExpID, combine, cachedRegexes, cachedMatchers ), 
                    MSG
                );
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
    }
    
    else if ( T_BLOCK & type )
    {
        if ( T_COMMENT & type ) get_comments( tok, comments );

        token = new BlockToken( type, tokenID,
                    get_blockmatcher( tokenID, tok.tokens.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
                    MSG,
                    tok.multiline,
                    tok.escape,
                    // allow block delims / block interior to have different styles
                    !!Style[ tokenID + '.inside' ]
                );
        
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
        if ( (T_COMMENT & type) && tok.interleave ) interleavedTokens.push( token/*.clone( )*/ );
    }
    
    else if ( T_GROUP & type )
    {
        if ( T_ARRAY & get_type( tok.match ) )
        {
            token = new CompositeToken( T_REPEATED, tokenID, null, MSG, tok.match[0], tok.match[1] );
        }
        else
        {
            matchType = groupTypes[ tok.match[LOWER]() ]; 
            
            if ( T_ZEROORONE === matchType ) 
                token = new CompositeToken( T_ZEROORONE, tokenID, null, MSG, 0, 1 );
            
            else if ( T_ZEROORMORE === matchType ) 
                token = new CompositeToken( T_ZEROORMORE, tokenID, null, MSG, 0, INF );
            
            else if ( T_ONEORMORE === matchType ) 
                token = new CompositeToken( T_ONEORMORE, tokenID, null, MSG, 1, INF );
            
            else if ( T_EITHER & matchType ) 
                token = new CompositeToken( T_EITHER, tokenID, null, MSG );
            
            else //if (T_SEQUENCE === matchType)
                token = new CompositeToken( T_SEQUENCE, tokenID, null, MSG );
        }
        
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
        
        token.set( operate( tok.tokens, function( subTokenizers, t ){
            return subTokenizers.concat( get_tokenizer( t, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, interleavedTokens, comments, keywords ) );
        }, [] ) );
        
    }
    
    else if ( T_NGRAM & type )
    {
        // get n-gram tokenizer
        tokens = make_array_2( tok.tokens ); // array of arrays
        
        token = map( tokens, function( t, i ) {
            // get tokenizer for whole ngram
            return new CompositeToken( T_NGRAM, tokenID+'_NGRAM_'+i, null, MSG );
        } );
        
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
        
        iterate( function( i ) {
            // get tokenizer for whole ngram
            token[i].set( operate( tokens[i], function( subTokenizers, t ){
                return subTokenizers.concat( get_tokenizer( t, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, interleavedTokens,  comments, keywords ) );
            }, [] ) );
        }, 0, tokens.length-1 );
    }
    return cachedTokens[ tokenID ];
}

function parse_grammar( grammar ) 
{
    var RegExpID, tokens,
        Extra, Style, Lex, Syntax, 
        cachedRegexes, cachedMatchers, cachedTokens, 
        interleavedTokens, comments, keywords;
    
    // grammar is parsed, return it
    // avoid reparsing already parsed grammars
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
    
    grammar = {
        Style           : Style,
        Lex             : Lex,
        Syntax          : Syntax,
        $parser         : null,
        $interleaved    : null,
        $comments       : null,
        $autocomplete   : null,
        $extra          : Extra,
        __parsed        : 0
    };
    pre_process_grammar( grammar );
    
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
// parser factory

var Parser = Class({
    constructor: function Parser( grammar, LOC ) {
        var self = this;
        self.$grammar = grammar;
        self.DEF = LOC.DEFAULT;
        self.ERR = grammar.Style.error || LOC.ERROR;
        self.TOK = LOC.TOKEN || 'token';
        self.TYP = LOC.TYPE || 'type';
    }
    
    ,$grammar: null
    ,DEF: null
    ,ERR: null
    ,TOK: null
    ,TYP: null
    
    ,dispose: function( ) {
        var self = this;
        self.$grammar = null;
        self.DEF = null;
        self.ERR = null;
        self.TOK = null;
        self.TYP = null;
        return self;
    }
    
    ,state: function( unique, s ) { 
        var state;
        if ( arguments.length > 1 && s instanceof State )
        {
            // copy state
            state = new State( unique, s );
            state.$eol$ = s.$eol$;
        }
        else
        {
            // start state
            state = new State( unique, s );
            state.$eol$ = true;
        }
        return state;
    }
    
    ,token: function( stream, state ) {
        var self = this, grammar = self.$grammar, Style = grammar.Style, DEFAULT = self.DEF, ERR = self.ERR,
            T = { }, $token$ = self.TOK, $type$ = self.TYP, $name$ = 'name',
            interleaved_tokens = grammar.$interleaved, tokens = grammar.$parser, nTokens = tokens.length, 
            tokenizer, action, type, stack, line, pos, i, ci, ret
        ;
        
        T[$name$] = null; T[$type$] = null; T[$token$] = null; ret = false;
        
        if ( state.$eol$ && stream.sol() )
        {
            // state marks a new line
            state.$eol$ = false;
            state.line++;
        }
        state.$actionerr$ = false;
        stack = state.stack;
        line = state.line;
        
        // if EOL tokenizer is left on stack, pop it now
        if ( stack.length && stream.sol() && T_EOL === peek(stack).type ) stack.pop();
        
        // check for non-space tokenizer before parsing space
        if ( (!stack.length || (T_NONSPACE !== peek(stack).type)) && stream.spc() )
        {
            T[$type$] = DEFAULT;
            ret = true;
        }
        
        i = 0;
        while ( !ret && (stack.length || i<nTokens) && !stream.eol() )
        {
            if ( interleaved_tokens )
            {
                for (ci=0; ci<interleaved_tokens.length; ci++)
                {
                    tokenizer = interleaved_tokens[ci];
                    type = tokenizer.get( stream, state );
                    if ( false !== type )
                    {
                        T[$name$] = tokenizer.name;
                        T[$type$] = Style[type] || DEFAULT;
                        ret = true; break;
                    }
                }
                
                if ( ret ) break;
            }
            
            pos = stream.pos;
            tokenizer = stack.length ? stack.pop() : tokens[i++];
            type = tokenizer.get(stream, state);
            
            // match failed
            if ( false === type )
            {
                // error
                if ( tokenizer.status & REQUIRED_OR_ERROR )
                {
                    // empty the stack
                    empty(stack, '$id', tokenizer.$id);
                    // skip this character/token
                    stream.nxt( true );
                    // generate error
                    //type = ERR;
                    tokenizer.err( state, line, pos, line, stream.pos );
                    //T[$name$] = tokenizer.name;
                    T[$type$] = ERR;
                    ret = true; break;
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
                state.$replace$ = type;
                // action token follows, execute action on current token
                while ( stack.length && T_ACTION === peek(stack).type )
                {
                    action = stack.pop();
                    action.get(stream, state);
                    // action error
                    if ( action.status & ERROR )
                    {
                        // empty the stack
                        //empty(stack, '$id', tokenizer.$id);
                        // generate error
                        //action.err( state, line, pos, line, stream.pos );
                        state.$actionerr$ = true;
                    }
                }
                // not empty
                if ( true !== type )
                {
                    T[$name$] = tokenizer.name;
                    T[$type$] = Style[state.$replace$] || DEFAULT;
                    ret = true; break;
                }
            }
        }
        
        
        if ( !ret )
        {
            // unknown, bypass, next default token
            stream.nxt(true);
            T[$type$] = DEFAULT;
        }
        else if ( stack.length > 1 && stream.eol() &&  
            (T_BLOCK & stack[stack.length-1].type) && 
            state.block.name === stack[stack.length-1].name 
        )
        {
            // apply any needed action(s) on partial block
            ci = stack.length-2;
            while ( ci >= 0 && T_ACTION === stack[ci].type )
            {
                action = stack[ci--]; action.get(stream, state);
                if ( action.status & ERROR ) state.$actionerr$ = true;
            }
            T[$type$] = Style[state.$replace$] || DEFAULT;
        }
        
        T[$token$] = stream.cur(1); state.$eol$ = stream.eol();
        return T;
    }
    
    ,tokenize: function( line, state, row ) {
        var self = this, tokens = [], stream = new Stream( line );
        //state.line = row || 0;
        if ( stream.eol() ) state.line++;
        while ( !stream.eol() ) tokens.push( self.token( stream, state ) );
        stream.dispose();
        return tokens;
    }
    
    ,parse: function( code, parse_type ) {
        var self = this, lines = (code||"").split(newline_re), l = lines.length,
            linetokens = null, state, parse_errors, parse_tokens, ret;
        
        parse_type = parse_type || TOKENS;
        parse_errors = !!(parse_type & ERRORS);
        parse_tokens = !!(parse_type & TOKENS);
        state = self.state( 0, parse_type );
        state.$full_parse$ = true;
        
        if ( parse_tokens )
        {
            linetokens = [];
            iterate(parse_type & FLAT
            ? function( i ) {
                linetokens = linetokens.concat( self.tokenize( lines[i], state, i ) );
                if ( i+1<l ) linetokens.push("\r\n");
            }
            : function( i ) {
                linetokens.push( self.tokenize( lines[i], state, i ) );
            }, 0, l-1);
        }
        
        else iterate(function( i ) {
            var stream = new Stream(lines[i]);
            //state.line = i;
            if ( stream.eol() ) state.line++;
            while ( !stream.eol() ) self.token( stream, state );
            stream.dispose( );
        }, 0, l-1);
        
        ret = parse_tokens && parse_errors
            ? {tokens:linetokens, errors:state.err}
            : (parse_tokens ? linetokens : state.err);
        
        state.dispose();
        return ret;
    }
    
    ,indent: function( ) { }
});

/**
*
*   CodeMirrorGrammar
*   @version: 2.3.0
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

DEFAULTSTYLE = null; DEFAULTERROR = "error";
var CodeMirrorParser = Class(Parser, {
    constructor: function CodeMirrorParser( grammar, LOC ) {
        var self = this;
        
        Parser.call(self, grammar, LOC);
        
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
        self.LC = null;
        self.BCS = null;
        self.BCE = null;
        self.BCL = null;
        self.BCC = null;
        return Parser[PROTO].dispose.call( self );
    }
    
    ,indent: function( state, textAfter, fullLine, conf, parserConf ) {
        var indentUnit = conf.indentUnit || 4, Pass = $CodeMirror$.Pass;
        return Pass;
    }
});

function get_mode( grammar, DEFAULT ) 
{
    var parser = new CodeMirrorParser(parse_grammar( grammar ), { 
        // default return code for skipped or not-styled tokens
        // 'null' should be used in most cases
        DEFAULT: DEFAULT || DEFAULTSTYLE,
        ERROR: DEFAULTERROR
    }), cm_mode;
    
    // Codemirror-compatible Mode
    cm_mode = function cm_mode( conf, parserConf ) {
        
        // return the (codemirror) parser mode for the grammar
        return {
            /*
            // maybe needed in later versions..?
            
            blankLine: function( state ) { }
            
            ,innerMode: function( state ) { }
            */
            
            startState: function( ) { 
                return cm_mode.$parser.state( );
            }
            
            ,copyState: function( state ) { 
                return cm_mode.$parser.state( 0, state );
            }
            
            ,token: function( stream, state ) { 
                var pstream = Stream._( stream ), 
                    token = cm_mode.$parser.token( pstream, state ).type;
                stream.pos = pstream.pos; pstream.dispose();
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
    cm_mode.$parser = parser;
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
        elt.style.position = 'relative';
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
            while (end < curLine.length && word_re.test(curLine.charAt(end))) ++end;
            while (start && word_re.test(curLine.charAt(start - 1))) --start;
            if ( start < end )
            {
                prefix_match = options[HAS]('prefixMatch') ? !!options.prefixMatch : end0 === end;
                case_insensitive_match = options[HAS]('caseInsensitiveMatch') ? !!options.caseInsensitiveMatch : true;
                renderer = options.renderer || cm_mode.autocomplete_renderer;
                token = curLine.slice(start, end); token_i = token[LOWER](); len = token.length;
                operate(cm_mode.$parser.$grammar.$autocomplete, function( list, word ){
                    var w = word.word, wm = word.meta, wl = w.length, pos, pos_i, m1, m2;
                    if ( wl >= len )
                    {
                        if ( case_insensitive_match )
                        {
                            m1 = w[LOWER]();
                            m2 = token_i;
                        }
                        else
                        {
                            m1 = w;
                            m2 = token;
                        }
                        if ( ((pos_i = m1.indexOf( m2 )) >= 0) && (!prefix_match || (0 === pos_i)) )
                        {
                            pos = case_insensitive_match ? w.indexOf( token ) : pos_i;
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
    
    VERSION: "2.3.0",
    
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
    pre_process: pre_process_grammar,
    
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