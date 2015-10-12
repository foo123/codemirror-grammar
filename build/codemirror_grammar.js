/**
*
*   CodeMirrorGrammar
*   @version: 2.0.0
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
    DEFAULTSTYLE,
    DEFAULTERROR,
    
    TOKENS = 1, ERRORS = 2,
    REQUIRED = 4, ERROR = 8,
    CLEAR_REQUIRED = ~REQUIRED, CLEAR_ERROR = ~ERROR,
    REQUIRED_OR_ERROR = REQUIRED | ERROR,
    
    //
    // javascript variable types
    INF = Infinity,
    
    //
    // action types
    A_ERROR = 4,
    A_UNIQUE = 8,
    A_PUSH = 16,
    A_POP = 32,
    A_EMPTY = 64,
    A_INDENT = 128,
    A_OUTDENT = 256,
    A_BLOCKINDENT = 512,
    
    //
    // pattern types
    P_SIMPLE = 2,
    P_COMPOSITE = 4,
    P_BLOCK = 8,
    
    //
    // token types
    T_SPACE = 0,
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
    T_SEQUENCE = 128,
    T_ALL = T_SEQUENCE,
    T_REPEATED = 256,
    T_ZEROORONE = 257,
    T_ZEROORMORE = 258,
    T_ONEORMORE = 259,
    T_GROUP = 512,
    T_NGRAM = 1024,
    T_SEQUENCE_OR_NGRAM = T_SEQUENCE | T_NGRAM,
    T_ACTION = 2048,
    
    //
    // tokenizer types
    groupTypes = {
    EITHER: T_EITHER,
    ALL: T_ALL,
    SEQUENCE: T_SEQUENCE,
    ZEROORONE: T_ZEROORONE,
    ZEROORMORE: T_ZEROORMORE,
    ONEORMORE: T_ONEORMORE,
    REPEATED: T_REPEATED
    },
    
    tokenTypes = {
    ACTION: T_ACTION,
    BLOCK: T_BLOCK,
    COMMENT: T_COMMENT,
    ESCAPEDBLOCK: T_ESCBLOCK,
    SIMPLE: T_SIMPLE,
    GROUP: T_GROUP,
    NGRAM: T_NGRAM
    },
    
    actionTypes = {
    ERROR: A_ERROR,
    UNIQUE: A_UNIQUE,
    PUSH: A_PUSH,
    POP: A_POP,
    EMPTY: A_EMPTY,
    INDENT: A_INDENT,
    OUTDENT: A_OUTDENT,
    BLOCKINDENT: A_BLOCKINDENT
    }
;

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
                else if ( T_DATE & T2 )     co[k] = new Date(o[k]);
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
                else if ( T_DATE & T2 )     co[k] = new Date(o[k]);
                else if ( T_STR & T2 )      co[k] = o[k].slice();
                else if ( T_NUM & T2 )      co[k] = 0 + o[k];
                else                        co[k] = o[k]; 
            }
        }
        else if ( T_DATE & T )
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
    
    group_replace = function( pattern, token, raw ) {
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
    },
    
    get_combined_re = function(tokens, boundary)  {
        var b = "", combined;
        if ( T_STR & get_type(boundary) ) b = boundary;
        combined = tokens.sort( by_length ).map( esc_re ).join( "|" );
        return [ new RegExp("^(" + combined + ")"+b), 1 ];
    },
    
    _id_ = 0, 
    get_id = function( ) { return ++_id_; },
    uuid = function( ns ) { return [ns||'uuid', ++_id_, new Date().getTime()].join('_'); }
;

//
// Stream Class
var Max = Math.max, spcRegex = /^[\s\u00a0]+/, spc = /[^\s\u00a0]/;

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
        if ( 0 > n ) self.pos = Max(0, self.pos - n);
        else self.pos += n;
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
    
    // next char
    ,nxt: function( ) {
        var self = this, c, s = self.s;
        if ( self.pos < s.length )
        {
            c = s.charAt(self.pos++) || null;
            return c;
        }
    }
    
    // current stream selection
    ,cur: function( shift ) {
        var self = this, ret = self.s.slice(self.start, self.pos);
        if ( shift ) self.start = self.pos;
        return ret;
    }
    
    ,upd: function( ) {
        var self = this;
        if ( self._ ) self._.pos = self.pos;
        return self;
    }
    
    // eat space
    ,spc: function( eat ) {
        var self = this, m, start = self.pos, s = self.s.slice(start);
        if ( m = s.match( spcRegex ) ) 
        {
            if ( false !== eat ) self.mov( m[0].length );
            return 1;
        }
        return 0;
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

// Counts the column offset in a string, taking tabs into account.
// Used mostly to find indentation.
// adapted from CodeMirror
Stream.col = function( string, end, tabSize, startIndex, startValue ) {
    var i, n;
    if ( null === end ) 
    {
        end = string.search( spc );
        if ( -1 == end ) end = string.length;
    }
    for (i = startIndex || 0, n = startValue || 0; i < end; ++i) 
        n += ( "\t" == string.charAt(i) ) ? (tabSize - (n % tabSize)) : 1;
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
// Stack Class
var Stack = Class({
    constructor: function Stack( array ) {
        this._ = array || [];
    }
    
    // abbreviations used for optimal minification
    ,_: null
    
    ,dispose: function( ) {
        var self = this;
        self._ = null;
        return self;
    }
    
    ,toString: function( ) { 
        return this._.slice( ).reverse( ).join( "\n" ); 
    }
    
    ,clone: function( ) {
        return new Stack( this._.slice( ) );
    }
    
    ,isEmpty: function( ) {
        return 0 >= this._.length;
    }
    
    ,pos: function( ) {
        return this._.length;
    }
    
    ,peek: function( index ) {
        var self = this, stack = self._;
        index = !arguments.length ? -1 : index;
        if ( stack.length )
        {
            if ( (0 > index) && (0 <= stack.length+index) )
                return stack[ stack.length + index ];
            else if ( 0 <= index && index < stack.length )
                return stack[ index ];
        }
        return null;
    }
    
    ,pop: function( ) {
        return this._.pop( );
    }
    
    ,shift: function( ) {
        return this._.shift( );
    }
    
    ,push: function( i ) {
        var self = this;
        self._.push( i );
        return self;
    }
    
    ,unshift: function( i ) {
        var self = this;
        self._.unshift( i );
        return self;
    }
    
    ,pushAt: function( pos, token, idProp, id ) {
        var self = this, stack = self._;
        if ( idProp && id ) token[idProp] = id;
        if ( pos < stack.length ) stack.splice( pos, 0, token );
        else stack.push( token );
        return self;
    }
    
    ,empty: function( $id, id ) {
        var self = this, stack = self._;
        if ( $id && id )
            while ( stack.length && stack[stack.length-1] && stack[stack.length-1][$id] === id ) stack.pop();
        else
            stack.length = 0;
        return self;
    }
});

//
// State Class
var State = Class({
    constructor: function State( s, unique, with_errors ) {
        var self = this;
        // this enables unique state "names"
        // thus forces highlight to update
        // however updates also occur when no update necessary ??
        self.id = unique ? uuid("state") : "state";
        if ( s instanceof State )
        {
            // clone
            self.line = s.line;
            self.column = s.column;
            self.indent = s.indent;
            self.stack = s.stack.clone();
            self.queu = s.queu.slice();
            self.symb = clone( s.symb, 1 );
            self.token = s.token;
            self.block = s.block;
            self.errors = s.errors;
            self.err = s.err;
        }
        else
        {
            self.line = s || 0;
            self.column = 0;
            self.indent = null;
            self.token = null;
            self.block = null;
            self.stack = new Stack();
            self.queu = [];
            self.symb = {};
            self.errors = !!with_errors;
            self.err = self.errors ? {} : null;
        }
    }
    
    ,id: null
    ,line: 0
    ,column: 0
    ,indent: 0
    ,stack: null
    ,queu: null
    ,symb: null
    ,err: null
    ,errors: false
    ,token: null
    ,block: null
    
    ,dispose: function( ) {
        var self = this;
        self.id = null;
        self.line = null;
        self.column = null;
        self.indent = null;
        self.token = null;
        self.block = null;
        self.symb = null;
        self.errors = null;
        self.err = null;
        self.queu = null;
        if ( self.stack ) self.stack.dispose( );
        self.stack = null;
        return self;
    }
    
    ,clone: function( unique ) {
        return new State( this, unique );
    }
    
    // used mostly for ACE which treats states as strings, 
    // make sure to generate a string which will cover most cases where state needs to be updated by the editor
    ,toString: function() {
        var self = this;
        return ['', self.id, self.line, self.token ? self.token.name : '0', self.block ? self.block.name : '0'].join('_');
    }
});

//
// pattern factories

var Pattern, BlockPattern, CompositePattern,
    Token, ActionToken, BlockToken, CompositeToken;

function match_char( stream, eat ) 
{
    var self = this, p = self.pattern, c = stream.s.charAt(stream.pos) || null;
    if ( c && p === c ) 
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
    if ( false !== eat ) stream.mov( m[ 0 ].length );
    return [ self.key, m ];
}

function match_null( stream, eat ) 
{
    var self = this;
    // matches end-of-line
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
    
    ,toString: function() {
        var self = this;
        return [
            '[', 'Pattern: ', self.name, ', ', 
            (self.pattern ? self.pattern.toString() : null), 
            ']'
        ].join('');
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
        l2 = (l>>1) + 1;
        // check if tokens can be combined in one regular expression
        // if they do not contain sub-arrays or regular expressions
        for (i=0; i<=l2; i++)
        {
            T1 = get_type( tmp[i] );
            T2 = get_type( tmp[l-1-i] );
            
            if ( (T_CHAR !== T1) || (T_CHAR !== T2) ) 
            {
                is_char_list = 0;
            }
            
            if ( (T_ARRAY & T1) || (T_ARRAY & T2) ) 
            {
                array_of_arrays = 1;
                //break;
            }
            else if ( has_prefix( tmp[i], RegExpID ) || has_prefix( tmp[l-1-i], RegExpID ) )
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
        else
        {
            for (i=0; i<l; i++)
            {
                if ( T_ARRAY & get_type( tmp[i] ) )
                    tmp[i] = get_compositematcher( name + '_' + i, tmp[i], RegExpID, combined, cachedRegexes, cachedMatchers );
                else
                    tmp[i] = get_simplematcher( name + '_' + i, get_re( tmp[i], RegExpID, cachedRegexes ), i, cachedMatchers );
            }
            
            matcher = (l > 1) ? new CompositePattern( name, tmp ) : tmp[0];
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
        var self = this, token = self.token, 
            type = self.type, tokenID = self.name, t = null;
        
        self.$msg = null;
        state.token = null;
        //self.pos = null;
        //lin = state.line; col = stream.pos;
        // match EMPTY token
        if ( T_EMPTY === type ) 
        { 
            self.status = 0;
            //self.pos = [[lin, col], [lin, col]];
            return true;
        }
        // match EOL ( with possible leading spaces )
        else if ( T_EOL === type ) 
        { 
            stream.spc();
            if ( stream.eol() )
            {
                //self.pos = [[lin, col], [lin, stream.pos]];
                return tokenID;
            }
        }
        // match non-space
        else if ( T_NONSPACE === type ) 
        { 
            if ( (self.status&REQUIRED) && stream.spc() && !stream.eol() ) self.status |= ERROR;
            self.status &= CLEAR_REQUIRED;
            //self.pos = [[lin, col], [lin, col]];
        }
        // else match a simple token
        else if ( t = token.match(stream) ) 
        { 
            state.token = {name:tokenID, value:stream.cur(), token:t[1]};
            //self.pos = [[lin, col], [lin, stream.pos]];
            return tokenID; 
        }
        return false;
    }
    
    ,req: function( bool ) { 
        var self = this;
        if ( !bool ) self.status &= CLEAR_REQUIRED;
        else self.status |= REQUIRED;
        return self;
    }
    
    ,err: function( state, l1, c1, l2, c2 ) {
        var t = this, m, tok = t.name;
        if ( t.$msg ) m = t.$msg;
        else if ( t.status&REQUIRED ) m = 'Token "'+tok+'" Expected';
        else m = 'Syntax Error: "'+tok+'"';
        if ( state && state.errors )
        {
            state.err[l1+'_'+c1+'_'+l2+'_'+c2+'_'+tok] = [l1, c1, l2, c2, m];
        }
        return m;
    }
    
    ,toString: function( ) {
        var self = this;
        return [
            '[', 'Token: ',self.name, ', ',
            self.token ? self.tok.toString() : null,
            ']'
        ].join('');
    }
});

// extends Token
ActionToken = Class(Token, {
    constructor: function ActionToken( type, name, action, msg ) {
        var self = this;
        self.type = type || T_ACTION;
        self.name = name;
        self.token = action;
        //self.pos = null;
        self.status = 0;
        self.msg = msg || null;
        self.$msg = null;
        self.$clone = null;
    }
     
    ,get: function( stream, state ) {
        var self = this, action_def = self.token || null, action, 
        t, t0, ns, msg, queu = state.queu, symb = state.symb, token = state.token,
        lin, col1, col2, err = state.err, error, emsg, with_errors = state.errors;
        
        self.status = 0;
        self.$msg = null;
        if ( action_def )
        {
            msg = self.msg;
            action = action_def[ 0 ]; t = action_def[ 1 ];
            lin = state.line; col2 = stream.pos; col1 = token&&token.value ? col2-token.value.length : col1-1;
            
            if ( A_ERROR === action )
            {
                if ( with_errors )
                {
                    if ( msg ) self.$msg = msg;
                    else self.$msg = 'Error';
                    error = lin+'_'+col1+'_'+lin+'_'+col2+'_'+self.name;
                    err[error] = [lin,col1,lin,col2,self.err()];
                }
                self.status |= ERROR;
                return false;
            }
            
            else if ( A_EMPTY === action )
            {
                queu.length = 0;
            }
            
            /*else if ( A_BLOCKINDENT === action )
            {
                // TODO
            }
            
            else if ( A_INDENT === action )
            {
                // TODO
            }
            
            else if ( A_OUTDENT === action )
            {
                // TODO
            }*/
            
            else if ( A_UNIQUE === action )
            {
                if ( token )
                {
                    t0 = t[1]; ns = t[0];
                    t0 = T_NUM === get_type( t0 ) ? token.token[ t0 ] : group_replace( t0, token.token, true );
                    if ( !symb[HAS](ns) ) symb[ns] = { };
                    if ( symb[ns][HAS](t0) )
                    {
                        // duplicate
                        if ( with_errors )
                        {
                            if ( msg ) self.$msg = group_replace( msg, t0, true );
                            else self.$msg = 'Duplicate "'+t0+'"';
                            emsg = self.err( );
                            error = symb[ns][t0][0]+'_'+symb[ns][t0][1]+'_'+symb[ns][t0][2]+'_'+symb[ns][t0][3]+'_'+self.name;
                            err[error] = [symb[ns][t0][0],symb[ns][t0][1],symb[ns][t0][2],symb[ns][t0][3],emsg];
                            error = lin+'_'+col1+'_'+lin+'_'+col2+'_'+self.name;
                            err[error] = [lin,col1,lin,col2,emsg];
                        }
                        self.status |= ERROR;
                        return false;
                    }
                    else
                    {
                        symb[ns][t0] = [lin,col1,lin,col2];
                    }
                }
            }
            
            else if ( A_POP === action )
            {
                if ( t )
                {
                    if ( token )
                        t = T_NUM === get_type( t ) ? token.token[ t ] : group_replace( t, token.token );
                    
                    if ( !queu.length || t !== queu[0][0] ) 
                    {
                        // no match
                        if ( with_errors )
                        {
                            if ( queu.length )
                            {
                                if ( msg ) self.$msg = group_replace( msg, [queu[0][0],t], true );
                                else self.$msg = 'Tokens do not match "'+queu[0][0]+'","'+t+'"';
                                emsg = self.err( );
                                error = queu[0][1]+'_'+queu[0][2]+'_'+queu[0][3]+'_'+queu[0][4]+'_'+self.name;
                                err[error] = [queu[0][1],queu[0][2],queu[0][3],queu[0][4],emsg];
                                error = lin+'_'+col1+'_'+lin+'_'+col2+'_'+self.name;
                                err[error] = [lin,col1,lin,col2,emsg];
                            }
                            else
                            {
                                if ( msg ) self.$msg = group_replace( msg, ['',t], true );
                                else self.$msg = 'Token does not match "'+t+'"';
                                emsg = self.err( );
                                error = lin+'_'+col1+'_'+lin+'_'+col2+'_'+self.name;
                                err[error] = [lin,col1,lin,col2,emsg];
                            }
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
                if ( token )
                    t = T_NUM === get_type( t ) ? token.token[ t ] : group_replace( t, token.token );
                queu.unshift( [t, lin, col1, lin, col2] );
            }
        }
        return true;
    }
});
            
// extends Token
BlockToken = Class(Token, {
    constructor: function BlockToken( type, name, token, msg, allowMultiline, escChar, hasInterior ) {
        var self = this;
        self.type = type;
        self.name = name;
        self.token = token;
        //self.pos = null;
        self.status = 0;
        self.msg = msg || null;
        // a block is multiline by default
        self.mline = 'undefined' === typeof(allowMultiline) ? 1 : allowMultiline;
        self.esc = escChar || "\\";
        self.inter = hasInterior;
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
            charIsEscaped = 0, isEscapedBlock = T_ESCBLOCK === type, escChar = self.esc,
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
            //self.pos = state.block.pos;
            alreadyIn = 1;
            ret = thisBlockInterior;
            b_s = state.block.s;
            b_i = state.block.i;
            b_e = state.block.e;
            b_1 = state.block._s;
            b_2 = state.block._i;
            b_21 = '';
        }    
        else if ( !state.block && (endBlock = startBlock.match(stream)) )
        {
            found = 1;
            //self.pos = [[lin, col],[lin, stream.pos]];
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
            stackPos = stack.pos( );
            
            isEOLBlock = T_NULL === endBlock.type;
            
            if ( hasInterior )
            {
                if ( alreadyIn && isEOLBlock && stream.sol( ) )
                {
                    self.status &= CLEAR_REQUIRED;
                    // ?????
                    state.current = null;
                    state.block = null;
                    return false;
                }
                
                if ( !alreadyIn )
                {
                    stack.pushAt( stackPos, self.clone( ), '$id', thisBlock );
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
                //self.pos[1] = [lin, stream.pos];
            }
            else
            {
                //self.pos[1] = [lin, stream.pos];
                //state.block.pos = self.pos;
                state.block.i = b_i;
                state.block.e = b_e;
                state.block._i += b_21;
                state.block._e = b_3;
                state.stack.pushAt( stackPos, self.clone( ), '$id', thisBlock );
            }
            state.token = {name:thisBlock, value:stream.cur(), token:[b_1+b_2+b_21+b_3, b_2+b_21]};
            return ret;
        }
        
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
                
                if ( token.status&REQUIRED )
                {
                    tokensRequired++;
                    err.push(token.err());
                }
                
                if ( false !== style )
                {
                    return style;
                }
                else if ( token.status&ERROR )
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
            stackPos = stack.pos();
            token = tokens[ 0 ].clone().req( match_all );
            style = token.get(stream, state);
            stackId = self.name+'_'+get_id();
            
            if ( false !== style )
            {
                // not empty token
                if ( true !== style )
                {
                    for (i=n-1; i>0; i--)
                        stack.pushAt( stackPos+n-i-1, tokens[ i ].clone().req( 1 ), '$id', stackId );
                }
                    
                return style;
            }
            else if ( token.status&ERROR /*&& token.REQ*/ )
            {
                if ( match_all ) self.status |= ERROR;
                else self.status &= CLEAR_ERROR;
                stream.bck( streamPos );
            }
            else if ( match_all && (token.status&REQUIRED) )
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
            stackPos = stack.pos( );
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
                        stack.pushAt( stackPos, self.clone( ), '$id', stackId );
                        self.found = 0;
                        return style;
                    }
                    break;
                }
                else if ( token.status&REQUIRED )
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

function parse_peg_bnf_notation( tok, Lex, Syntax )
{
    var alternation, sequence, token, literal, repeat, 
        t, q, c, prev_token, curr_token, stack, tmp;
    
    t = new String( trim(tok) );
    t.pos = 0;
    
    if ( 1 === t.length )
    {
        curr_token = '' + tok;
        if ( !Lex[ curr_token ] ) Lex[ curr_token ] = { type:"simple", tokens:tok };
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
                    if ( !Lex[token] && !Syntax[token] )
                    {
                        Lex[ token ] = {
                            type: 'simple',
                            tokens: token
                        };
                    }
                    sequence.push( token );
                    token = '';
                }
            
                if ( '"' === c || "'" === c )
                {
                    // literal token, quoted
                    q = c; literal = '';
                    while ( t.pos < t.length && q !== (c=t.charAt(t.pos++)) ) literal += c;
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
                        // interpret as empty tokenizer
                        sequence.push( 0 );
                    }
                }
                
                else if ( '*' === c || '+' === c || '?' === c )
                {
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
                    // literal repeat modifier, applies to token that comes before
                    repeat = '';
                    while ( t.pos < t.length && '}' !== (c=t.charAt(t.pos++)) ) repeat += c;
                    
                    repeat = repeat.split( ',' ).map( trim );
                    
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
                    // literal repeat end modifier, should be handled in previous case
                    // added here just for completeness
                    continue;
                }
                
                else if ( '[' === c )
                {
                    // start of character select
                    literal = '';
                    while ( t.pos < t.length && ']' !== (c=t.charAt(t.pos++)) ) literal += c;
                    curr_token = '[' + literal + ']';
                    if ( !Lex[curr_token] )
                    {
                        Lex[curr_token] = {
                            type: 'simple',
                            tokens: literal.split('')
                        };
                    }
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

function get_tokenizer( tokenID, RegExpID, Lex, Syntax, Style, 
                    cachedRegexes, cachedMatchers, cachedTokens, 
                    commentTokens, comments, keywords ) 
{
    var tok, token = null, type, combine, tokenAction, matchType, tokens, subTokenizers,
        ngrams, ngram, i, l, j, l2, xtends, xtendedTok, t, MSG;
    
    MSG = null;
    
    if ( null === tokenID )
    {
        // EOL Token
        return new Token( T_EOL, 'EOL', tokenID, MSG );
    }
    
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
    
    if ( Lex[ tokenID ] )
    {
        tok = Lex[ tokenID ];
        if ( T_STR_OR_ARRAY & get_type( tok ) )
        {
            // simple token given as literal token, wrap it
            tok = Lex[ tokenID ] = { type:"simple", tokens:tok };
        }
    }
    else if ( Syntax[ tokenID ] )
    {
        tok = Syntax[ tokenID ];
    }
    else
    {
        tok = tokenID;
    }
    
    if ( T_STR & get_type( tok ) ) 
    {
        tok = parse_peg_bnf_notation( tok, Lex, Syntax );
        tok = Lex[ tok ] || Syntax[ tok ];
    }
    
    // allow tokens to extend / reference other tokens
    while ( tok['extend'] )
    {
        xtends = tok['extend']; 
        xtendedTok = Lex[ xtends ] || Syntax[ xtends ];
        delete tok['extend'];
        if ( xtendedTok ) 
        {
            // tokens given directly, no token configuration object, wrap it
            if ( T_STR_OR_ARRAY & get_type( xtendedTok ) )
            {
                xtendedTok = { type:"simple", tokens:xtendedTok };
            }
            tok = extend( xtendedTok, tok );
        }
        // xtendedTok may in itself extend another tok and so on,
        // loop and get all references
    }
    
    if ( 'undefined' === typeof tok.type )
    {
        // provide some defaults
        if ( tok[HAS]('error') )
        {
            tok.type = "action";
            tok.action = [ 'error', tok.error ];
            delete tok.error;
        }
        else if ( tok[HAS]('empty') )
        {
            tok.type = "action";
            tok.action = [ 'empty', tok.empty ];
            delete tok.empty;
        }
        else if ( tok[HAS]('block-indent') )
        {
            tok.type = "action";
            tok.action = [ 'block-indent', tok['block-indent'] ];
            delete tok['block-indent'];
        }
        else if ( tok[HAS]('indent') )
        {
            tok.type = "action";
            tok.action = [ 'indent', tok.indent ];
            delete tok.indent;
        }
        else if ( tok[HAS]('outdent') )
        {
            tok.type = "action";
            tok.action = [ 'outdent', tok.outdent ];
            delete tok.outdent;
        }
        else if ( tok[HAS]('unique') )
        {
            tok.type = "action";
            tok.action = [ 'unique', T_STR&get_type(tok.unique) ? ['_DEFAULT_', tok.unique] : tok.unique ];
            delete tok.unique;
        }
        else if ( tok[HAS]('push') )
        {
            tok.type = "action";
            tok.action = [ 'push', tok.push ];
            delete tok.push;
        }
        else if ( tok[HAS]('pop') )
        {
            tok.type = "action";
            tok.action = [ 'pop', tok.pop ];
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
        else if ( tok['escaped-block'] )
        {
            tok.type = "escaped-block";
            tok.tokens = tok['escaped-block'];
            delete tok['escaped-block'];
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
    type = tok.type ? tokenTypes[ tok.type.toUpperCase( ).replace( dashes_re, '' ) ] : T_SIMPLE;
    
    MSG = tok.msg || null;
    
    if ( T_SIMPLE & type )
    {
        if ( "" === tok.tokens )
        {
            // NONSPACE Token
            token = new Token( T_NONSPACE, tokenID, tokenID, MSG );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        else if ( null === tok.tokens )
        {
            // EOL Token
            token = new Token( T_EOL, tokenID, tokenID, MSG );
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
    }

    if ( !(T_ACTION & type) ) tok.tokens = make_array( tok.tokens );
    
    if ( T_ACTION & type )
    {
        if ( !tok[HAS]('action') )
        {
            if ( tok[HAS]('error') ) tok.action = [A_ERROR, tok.error];
            else if ( tok[HAS]('empty') ) tok.action = [A_EMPTY, tok.empty];
            else if ( tok[HAS]('block-indent') ) tok.action = [A_BLOCKINDENT, tok['block-indent']];
            else if ( tok[HAS]('indent') ) tok.action = [A_INDENT, tok.indent];
            else if ( tok[HAS]('outdent') ) tok.action = [A_OUTDENT, tok.outdent];
            else if ( tok[HAS]('unique') ) tok.action = [A_UNIQUE, T_STR&get_type(tok.unique)?['_DEFAULT_',tok.unique]:tok.unique];
            else if ( tok[HAS]('push') ) tok.action = [A_PUSH, tok.push];
            else if ( tok[HAS]('pop') ) tok.action = [A_POP, tok.pop];
        }
        else
        {
            if ( 'error' === tok.action[0] ) tok.action[0] = A_ERROR;
            else if ( 'empty' === tok.action[0] ) tok.action[0] = A_EMPTY;
            else if ( 'block-indent' === tok.action[0] ) tok.action[0] = A_BLOCKINDENT;
            else if ( 'indent' === tok.action[0] ) tok.action[0] = A_INDENT;
            else if ( 'outdent' === tok.action[0] ) tok.action[0] = A_OUTDENT;
            else if ( 'unique' === tok.action[0] ) tok.action[0] = A_UNIQUE;
            else if ( 'push' === tok.action[0] ) tok.action[0] = A_PUSH;
            else if ( 'pop' === tok.action[0] ) tok.action[0] = A_POP;
        }
        tokenAction = tok.action.slice();
        token = new ActionToken( T_ACTION, tokenID, tokenAction, MSG );
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
    }
    
    else if ( T_SIMPLE & type )
    {
        if ( tok.autocomplete ) get_autocomplete( tok, tokenID, keywords );
        
        // combine by default if possible using word-boundary delimiter
        combine = ( 'undefined' === typeof(tok.combine) ) ? "\\b" : tok.combine;
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
                    Style[ tokenID + '.inside' ] ? 1 : 0
                );
        
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
        if ( tok.interleave ) commentTokens.push( token.clone( ) );
    }
    
    else if ( T_GROUP & type )
    {
        tokens = tok.tokens.slice( );
        if ( T_ARRAY & get_type( tok.match ) )
        {
            token = new CompositeToken( T_REPEATED, tokenID, null, MSG, tok.match[0], tok.match[1] );
        }
        else
        {
            matchType = groupTypes[ tok.match.toUpperCase() ]; 
            
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
        
        subTokenizers = [];
        for (i=0, l=tokens.length; i<l; i++)
            subTokenizers = subTokenizers.concat( get_tokenizer( tokens[i], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) );
        
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
            token[i] = new CompositeToken( T_NGRAM, tokenID + '_NGRAM_' + i, null, MSG );
        }
        
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
        
        for (i=0, l=token.length; i<l; i++)
        {
            ngram = ngrams[i];
            
            subTokenizers = [];
            for (j=0, l2=ngram.length; j<l2; j++)
                subTokenizers = subTokenizers.concat( get_tokenizer( ngram[j], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens,  comments, keywords ) );
            
            // get tokenizer for whole ngram
            token[i].set( subTokenizers );
        }
    }
    return cachedTokens[ tokenID ];
}

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
    var kws = [].concat(make_array(tok.tokens)).map(function(word) { return { word: word, meta: type }; });
    keywords.autocomplete = (keywords.autocomplete || []).concat( kws );
}

function parse_grammar( grammar ) 
{
    var RegExpID, tokens, numTokens, _tokens, 
        Style, Lex, Syntax, t, tokenID, token, tok,
        cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords;
    
    // grammar is parsed, return it
    // avoid reparsing already parsed grammars
    if ( grammar.__parsed ) return grammar;
    
    cachedRegexes = { }; cachedMatchers = { }; cachedTokens = { }; 
    comments = { }; keywords = { }; commentTokens = [ ];
    grammar = clone( grammar );
    
    RegExpID = grammar.RegExpID || null;
    grammar.RegExpID = null;
    delete grammar.RegExpID;
    
    Lex = grammar.Lex || { };
    grammar.Lex = null;
    delete grammar.Lex;
    
    Syntax = grammar.Syntax || { };
    grammar.Syntax = null;
    delete grammar.Syntax;
    
    Style = grammar.Style || { };
    
    _tokens = grammar.Parser || [ ];
    numTokens = _tokens.length;
    tokens = [ ];
    
    
    // build tokens
    for (t=0; t<numTokens; t++)
    {
        tokenID = _tokens[ t ];
        
        token = get_tokenizer( tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) || null;
        
        if ( token )
        {
            if ( T_ARRAY & get_type( token ) ) tokens = tokens.concat( token );
            else tokens.push( token );
        }
    }
    
    grammar.Parser = tokens;
    grammar.cTokens = commentTokens;
    grammar.Style = Style;
    grammar.Comments = comments;
    grammar.Keywords = keywords;
    grammar.Extra = grammar.Extra || { };
    
    // this grammar is parsed
    grammar.__parsed = 1;
    return grammar;
}

/**
*
*   CodeMirrorGrammar
*   @version: 2.0.0
*
*   Transform a grammar specification in JSON format, into a syntax-highlight parser mode for CodeMirror
*   https://github.com/foo123/codemirror-grammar
*
**/


// codemirror supposed to be available
var _CodeMirror = CodeMirror || { Pass : { toString: function(){return "CodeMirror.Pass";} } };

//
// parser factories
DEFAULTSTYLE = null;
DEFAULTERROR = "error";
var Parser = Class({
    constructor: function Parser( grammar, LOC ) {
        var self = this;
        
        // support extra functionality
        self.Extra = grammar.Extra || {};
        
        // support comments toggle functionality
        self.LC = (grammar.Comments.line) ? grammar.Comments.line[0] : null,
        self.BCS = (grammar.Comments.block) ? grammar.Comments.block[0][0] : null,
        self.BCE = (grammar.Comments.block) ? grammar.Comments.block[0][1] : null,
        self.BCC = self.BCL = (grammar.Comments.block) ? grammar.Comments.block[0][2] : null,
        self.DEF = LOC.DEFAULT;
        self.ERR = grammar.Style.error || LOC.ERROR;
        
        // support keyword autocompletion
        self.Keywords = grammar.Keywords.autocomplete || null;
        
        self.Tokens = grammar.Parser || [];
        self.cTokens = grammar.cTokens.length ? grammar.cTokens : null;
        self.Style = grammar.Style;
    }
    
    ,Extra: null
    ,LC: null
    ,BCS: null
    ,BCE: null
    ,BCL: null
    ,BCC: null
    ,ERR: null
    ,DEF: null
    ,Keywords: null
    ,cTokens: null
    ,Tokens: null
    ,Style: null
    
    ,dispose: function( ) {
        var self = this;
        self.Extra = null;
        self.LC = null;
        self.BCS = null;
        self.BCE = null;
        self.BCL = null;
        self.BCC = null;
        self.ERR = null;
        self.DEF = null;
        self.Keywords = null;
        self.cTokens = null;
        self.Tokens = null;
        self.Style = null;
        return self;
    }
    
    ,parse: function( code, parse_type ) {
        code = code || "";
        var self = this, lines = code.split(newline_re), l = lines.length, i,
            linetokens, tokens, state, stream, ret, parse_errors, parse_tokens;
        
        parse_type = parse_type || TOKENS;
        parse_errors = !!(parse_type&ERRORS);
        parse_tokens = !!(parse_type&TOKENS);
        
        state = new State( 0, 0, parse_errors );
        state.parseAll = 1;
        
        if ( parse_tokens )
        {
            linetokens = [];
            for (i=0; i<l; i++)
            {
                state.line = i; stream = new Stream( lines[i] );
                tokens = [];
                while ( !stream.eol() ) tokens.push( self.getToken( stream, state ) );
                linetokens.push( tokens );
            }
        }
        else //if ( parse_errors )
        {
            for (i=0; i<l; i++)
            {
                state.line = i; stream = new Stream( lines[i] );
                while ( !stream.eol() ) self.getToken( stream, state );
            }
        }
        if ( parse_tokens && parse_errors ) ret = {tokens:linetokens, errors:state.err};
        else if ( parse_tokens ) ret = linetokens;
        else ret = state.err;
        stream.dispose(); state.dispose();
        return ret;
    }
    
    // Codemirror Tokenizer compatible
    ,getToken: function( stream, state ) {
        var self = this, i, ci, type, tokenizer, action,
            interleavedCommentTokens = self.cTokens, tokens = self.Tokens, numTokens = tokens.length, 
            parseAll = !!state.parseAll, stack, pos, line,
            Style = self.Style, DEFAULT = self.DEF, ERR = self.ERR
        ;
        
        stream = parseAll ? stream : Stream._( stream );
        stack = state.stack;
        
        // if EOL tokenizer is left on stack, pop it now
        if ( stream.sol() && !stack.isEmpty() && T_EOL === stack.peek().type ) 
        {
            stack.pop();
        }
        
        // check for non-space tokenizer before parsing space
        if ( (stack.isEmpty() || (T_NONSPACE !== stack.peek().type)) && stream.spc() )
        {
            return parseAll ? {value:stream.cur(1), type:DEFAULT} : (stream.upd()&&DEFAULT);
        }
        
        line = state.line;
        while ( !stack.isEmpty() && !stream.eol() )
        {
            if ( interleavedCommentTokens )
            {
                ci = 0;
                while ( ci < interleavedCommentTokens.length )
                {
                    tokenizer = interleavedCommentTokens[ci++];
                    type = tokenizer.get( stream, state );
                    if ( false !== type )
                    {
                        type = Style[type] || DEFAULT;
                        return parseAll ? {value:stream.cur(1), type:type} : (stream.upd()&&type);
                    }
                }
            }
            
            pos = stream.pos;
            tokenizer = stack.pop();
            type = tokenizer.get(stream, state);
            
            // match failed
            if ( false === type )
            {
                // error
                if ( tokenizer.status&REQUIRED_OR_ERROR )
                {
                    // empty the stack
                    stack.empty('$id', tokenizer.$id);
                    // skip this character
                    stream.nxt();
                    // generate error
                    type = ERR;
                    tokenizer.err(state, line, pos, line, stream.pos);
                    return parseAll ? {value:stream.cur(1), type:type} : (stream.upd()&&type);
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
                type = T_SPACE === type ? DEFAULT : Style[type] || DEFAULT;
                // action token follows, execute action on current token
                while ( !stack.isEmpty() && T_ACTION === stack.peek().type )
                {
                    action = stack.pop();
                    action.get(stream, state);
                    // action error
                    if ( action.status&ERROR )
                    {
                        // empty the stack
                        //stack.empty('$id', /*action*/tokenizer.$id);
                        // generate error
                        //type = ERR;
                        //action.err(state, line, pos, line, stream.pos);
                        return parseAll ? {value:stream.cur(1), type:type} : (stream.upd()&&type);
                    }
                }
                return parseAll ? {value:stream.cur(1), type:type} : (stream.upd()&&type);
            }
        }
        
        for (i=0; i<numTokens; i++)
        {
            pos = stream.pos;
            tokenizer = tokens[i];
            type = tokenizer.get(stream, state);
            
            // match failed
            if ( false === type )
            {
                // error
                if ( tokenizer.status&REQUIRED_OR_ERROR )
                {
                    // empty the stack
                    stack.empty('$id', tokenizer.$id);
                    // skip this character
                    stream.nxt();
                    // generate error
                    type = ERR;
                    tokenizer.err(state, line, pos, line, stream.pos);
                    return parseAll ? {value:stream.cur(1), type:type} : (stream.upd()&&type);
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
                type = T_SPACE === type ? DEFAULT : Style[type] || DEFAULT;
                // action token follows, execute action on current token
                while ( !stack.isEmpty() && T_ACTION === stack.peek().type )
                {
                    action = stack.pop();
                    action.get(stream, state);
                    // action error
                    if ( action.status&ERROR )
                    {
                        // empty the stack
                        //stack.empty('$id', tokenizer.$id);
                        // generate error
                        //type = ERR;
                        //action.err(state, line, pos, line, stream.pos);
                        return parseAll ? {value:stream.cur(1), type:type} : (stream.upd()&&type);
                    }
                }
                return parseAll ? {value: stream.cur(1), type: type} : (stream.upd()&&type);
            }
        }
        
        // unknown, bypass
        stream.nxt();
        return parseAll ? {value:stream.cur(1), type:DEFAULT} : (stream.upd()&&DEFAULT);
    }
    
    ,indent: function(state, textAfter, fullLine, conf, parserConf) {
        var indentUnit = conf.indentUnit || 4, Pass = _CodeMirror.Pass;
        return Pass;
    }
});

function get_mode( grammar, DEFAULT ) 
{
    var parser = new Parser( parse_grammar( grammar ), { 
        // default return code for skipped or not-styled tokens
        // 'null' should be used in most cases
        DEFAULT: DEFAULT || DEFAULTSTYLE,
        ERROR: DEFAULTERROR
    });
    
    // Codemirror-compatible Mode
    var cm_mode = function cm_mode( conf, parserConf ) {
        
        // return the (codemirror) parser mode for the grammar
        return {
            /*
            // maybe needed in later versions..
            
            blankLine: function( state ) { },
            
            innerMode: function( state ) { },
            */
            
            startState: function( ) { 
                return new State( ); 
            },
            
            copyState: function( state ) { 
                state = state.clone( ); state.line++;
                return state;
            },
            
            token: function( stream, state ) { 
                return parser.getToken( stream, state ); 
            },
            
            indent: function( state, textAfter, fullLine ) { 
                return parser.indent( state, textAfter, fullLine, conf, parserConf ); 
            },
            
            // support comments toggle functionality
            lineComment: parser.LC,
            blockCommentStart: parser.BCS,
            blockCommentEnd: parser.BCE,
            blockCommentContinue: parser.BCC,
            blockCommentLead: parser.BCL,
            // support extra functionality defined in grammar
            // eg. code folding, electriChars etc..
            electricChars: parser.Extra.electricChars || false,
            fold: parser.Extra.fold || false
        };
    };
    cm_mode.supportGrammarAnnotations = false;
    // syntax, lint-like validator generated from grammar
    // maybe use this as a worker (a-la ACE) ??
    cm_mode.validator = function( code, options )  {
        if ( !cm_mode.supportGrammarAnnotations || !code || !code.length ) return [];
        
        var errors = [], err, msg, error,
            code_errors = parser.parse( code, ERRORS );
        if ( !code_errors ) return errors;
        
        for (err in code_errors)
        {
            if ( !code_errors.hasOwnProperty(err) ) continue;
            error = code_errors[err];
            errors.push({
                message: error[4] || "Syntax Error",
                severity: "error",
                from: CodeMirror.Pos(error[0], error[1]),
                to: CodeMirror.Pos(error[2], error[3])
            });
        }
        return errors;
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
    
    VERSION: "2.0.0",
    
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