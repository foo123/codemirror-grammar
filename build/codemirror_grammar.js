/**
*
*   CodeMirrorGrammar
*   @version: 1.0.2
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
    
    ACTION_PUSH = 1, ACTION_POP = 2,
    
    //
    // javascript variable types
    INF = Infinity,
    
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
    T_SEQUENCE = T_ALL,
    T_REPEATED = 256,
    T_ZEROORONE = 257,
    T_ZEROORMORE = 258,
    T_ONEORMORE = 259,
    T_GROUP = 512,
    T_NGRAM = 1024,
    T_SEQUENCE_OR_NGRAM = T_SEQUENCE | T_NGRAM,
    T_INDENT = 2048,
    T_DEDENT = 4096,
    
    //
    // tokenizer types
    groupTypes = {
        EITHER: T_EITHER, ALL: T_ALL, SEQUENCE: T_SEQUENCE,
        ZEROORONE: T_ZEROORONE, ZEROORMORE: T_ZEROORMORE, ONEORMORE: T_ONEORMORE, 
        REPEATED: T_REPEATED
    },
    
    tokenTypes = {
        INDENT: T_INDENT, DEDENT: T_DEDENT,
        BLOCK: T_BLOCK, COMMENT: T_COMMENT, ESCAPEDBLOCK: T_ESCBLOCK, 
        SIMPLE: T_SIMPLE, GROUP: T_GROUP, NGRAM: T_NGRAM
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
    peg_bnf_notation_re = /^([{}()*+?|'"]|\s)/,
    
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
    
    // char match
    ,chr: function( pattern, eat ) {
        var self = this, ch = self.s.charAt(self.pos) || null;
        if (ch && pattern === ch) 
        {
            if (false !== eat) 
            {
                self.pos += 1;
                if ( self._ ) self._.pos = self.pos;
            }
            return ch;
        }
        return false;
    }
    
    // char list match
    ,chl: function( pattern, eat ) {
        var self = this, ch = self.s.charAt(self.pos) || null;
        if ( ch && (-1 < pattern.indexOf( ch )) ) 
        {
            if (false !== eat) 
            {
                self.pos += 1;
                if ( self._ ) self._.pos = self.pos;
            }
            return ch;
        }
        return false;
    }
    
    // string match
    ,str: function( pattern, startsWith, eat ) {
        var self = this, len, pos = self.pos, str = self.s, ch = str.charAt(pos) || null;
        if ( ch && startsWith[ ch ] )
        {
            len = pattern.length; 
            if ( pattern === str.substr(pos, len) ) 
            {
                if (false !== eat) 
                {
                    self.pos += len;
                    if ( self._ ) self._.pos = self.pos;
                }
                return pattern;
            }
        }
        return false;
    }
    
    // regex match
    ,rex: function( pattern, startsWith, notStartsWith, group, eat ) {
        var self = this, match, pos = self.pos, str = self.s, ch = str.charAt(pos) || null;
        // remove RegexAnalyzer dependency
        /*if ( ch && ( startsWith && startsWith[ ch ] ) || ( notStartsWith && !notStartsWith[ ch ] ) )
        {*/
            match = str.slice( pos ).match( pattern );
            if (!match || match.index > 0) return false;
            if ( false !== eat ) 
            {
                self.pos += match[group||0].length;
                if ( self._ ) self._.pos = self.pos;
            }
            return match;
        /*}
        return false;*/
    }

    // eat space
    ,spc: function( eat ) {
        var self = this, m, start = self.pos, s = self.s.slice(start);
        if ( m = s.match( spcRegex ) ) 
        {
            if ( false !== eat )
            {
                self.pos += m[0].length;
                if ( self._ ) self._.pos = self.pos;
            }
            return 1;
        }
        return 0;
    }
    
    // skip to end
    ,end: function( ) {
        var self = this;
        self.pos = self.s.length;
        if ( self._ ) self._.pos = self.pos;
        return self;
    }

    // get next char
    ,nxt: function( ) {
        var self = this, ch, s = self.s;
        if (self.pos < s.length)
        {
            ch = s.charAt(self.pos++) || null;
            if ( self._ ) self._.pos = self.pos;
            return ch;
        }
    }
    
    // back-up n steps
    ,bck: function( n ) {
        var self = this;
        self.pos = Max(0, self.pos - n);
        if ( self._ ) self._.pos = self.pos;
        return self;
    }
    
    // back-track to pos
    ,bck2: function( pos ) {
        var self = this;
        self.pos = Max(0, pos);
        if ( self._ ) self._.pos = self.pos;
        return self;
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
    
    // current stream selection
    ,cur: function( andShiftStream ) {
        var self = this, ret = self.s.slice(self.start, self.pos);
        if ( andShiftStream ) self.start = self.pos;
        return ret;
    }
    
    // move/shift stream
    ,sft: function( ) {
        this.start = this.pos;
        return this;
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
    
    ,empty: function( idProp, id ) {
        var self = this, stack = self._, l = stack.length;
        if ( idProp && id )
        {
            //while (l && stack[l-1] && stack[l-1][idProp] == id) 
            while ( stack.length && stack[stack.length-1] && stack[stack.length-1][idProp] === id ) 
            {
                //console.log([id, stack[l-1][idProp]]);
                //--l;
                stack.pop();
            }
            //stack.length = l;
        }
        else stack.length = 0;
        return self;
    }
});

//
// State Class
var State = Class({
    constructor: function State( line, unique ) {
        var self = this;
        // this enables unique state "names"
        // thus forces highlight to update
        // however updates also occur when no update necessary ??
        self.id = unique ? uuid("state") : "state";
        self.l = line || 0;
        self.stack = new Stack( );
        self.data = new Stack( );
        self.col = 0;
        self.indent = 0;
        self.t = null;
        self.inBlock = null;
        self.endBlock = null;
    }
    
    // state id
    ,id: null
    // state current line
    ,l: 0
    ,col: 0
    ,indent: 0
    // state token stack
    ,stack: null
    // state token push/pop match data
    ,data: null
    // state current token
    ,t: null
    // state current block name
    ,inBlock: null
    // state endBlock for current block
    ,endBlock: null
    
    ,dispose: function( ) {
        var self = this;
        if ( self.stack ) self.stack.dispose( );
        if ( self.data ) self.data.dispose( );
        self.stack = null;
        self.data = null;
        self.id = null;
        self.t = null;
        self.l = null;
        self.col = null;
        self.indent = null;
        self.inBlock = null;
        self.endBlock = null;
        return self;
    }
    
    ,clone: function( unique ) {
        var self = this, c = new State( self.l, unique );
        c.t = self.t;
        c.col = self.col;
        c.indent = self.indent;
        c.stack = self.stack.clone( );
        c.data = self.data.clone( );
        c.inBlock = self.inBlock;
        c.endBlock = self.endBlock;
        return c;
    }
    
    // used mostly for ACE which treats states as strings, 
    // make sure to generate a string which will cover most cases where state needs to be updated by the editor
    ,toString: function() {
        var self = this;
        //return ['', self.id, self.inBlock||'0'].join('_');
        //return ['', self.id, self.t, self.r||'0', self.stack.length, self.inBlock||'0'].join('_');
        //return ['', self.id, self.t, self.stack.length, self.inBlock||'0'].join('_');
        //return ['', self.id, self.t, self.r||'0', self.inBlock||'0'].join('_');
        //return ['', self.l, self.t, self.r, self.inBlock||'0', self.stack.length].join('_');
        return ['', self.id, self.l, self.t, self.inBlock||'0'].join('_');
    }
});

//
// matcher factories

var Matcher, BlockMatcher, CompositeMatcher,
    Token, BlockToken, CompositeToken;

function getChar( stream, eat ) 
{
    var self = this, matchedResult;    
    if ( matchedResult = stream.chr( self.tp, eat ) ) return [ self.tk, matchedResult ];
    return false;
}

function getCharList( stream, eat ) 
{
    var self = this, matchedResult;    
    if ( matchedResult = stream.chl( self.tp, eat ) ) return [ self.tk, matchedResult ];
    return false;
}

function getStr( stream, eat ) 
{
    var self = this, matchedResult;    
    if ( matchedResult = stream.str( self.tp, self.p, eat ) ) return [ self.tk, matchedResult ];
    return false;
}

function getRegex( stream, eat ) 
{
    var self = this, matchedResult;    
    if ( matchedResult = stream.rex( self.tp, self.p, self.np, self.tg, eat ) ) return [ self.tk, matchedResult ];
    return false;
}

function getNull( stream, eat ) 
{
    var self = this;
    // matches end-of-line
    (false !== eat) && stream.end( ); // skipToEnd
    return [ self.tk, "" ];
} 
    
Matcher = Class({
    constructor: function Matcher( type, name, pattern, key ) {
        var self = this;
        self.mt = T_SIMPLEMATCHER;
        self.tt = type || T_CHAR;
        self.tn = name;
        self.tk = key || 0;
        self.tg = 0;
        self.tp = null;
        self.p = null;
        self.np = null;
        
        // get a fast customized matcher for < pattern >
        switch ( self.tt )
        {
            case T_CHAR: case T_CHARLIST:
                self.tp = pattern;
                self.get = T_CHARLIST === self.tt ? getCharList : getChar;
                break;
            case T_STR:
                self.tp = pattern;
                self.p = {};
                self.p[ '' + pattern.charAt(0) ] = 1;
                self.get = getStr;
                break;
            case T_REGEX:
                self.tp = pattern[ 0 ];
                self.p = pattern[ 1 ].peek || null;
                self.np = pattern[ 1 ].negativepeek || null;
                self.tg = pattern[ 2 ] || 0;
                self.get = getRegex;
                break;
            case T_NULL:
                self.tp = null;
                self.get = getNull;
                break;
        }
    }
    
    // matcher type
    ,mt: null
    // token type
    ,tt: null
    // token name
    ,tn: null
    // token pattern
    ,tp: null
    // token pattern group
    ,tg: 0
    // token key
    ,tk: 0
    // pattern peek chars
    ,p: null
    // pattern negative peek chars
    ,np: null
    
    ,get: function( stream, eat ) {
        return false;
    }
    
    ,toString: function() {
        var self = this;
        return [
            '[', 'Matcher: ', 
            self.tn, 
            ', Pattern: ', 
            (self.tp ? self.tp.toString() : null), 
            ']'
        ].join('');
    }
});
    
// extends Matcher
CompositeMatcher = Class(Matcher, {
    constructor: function CompositeMatcher( name, matchers, useOwnKey ) {
        var self = this;
        self.mt = T_COMPOSITEMATCHER;
        self.tn = name;
        self.ms = matchers;
        self.ownKey = false!==useOwnKey;
    }
    
    // group of matchers
    ,ms: null
    ,ownKey: true
    
    ,get: function( stream, eat ) {
        var self = this, i, m, matchers = self.ms, l = matchers.length, useOwnKey = self.ownKey;
        for (i=0; i<l; i++)
        {
            // each one is a matcher in its own
            m = matchers[ i ].get( stream, eat );
            if ( m ) return useOwnKey ? [ i, m[1] ] : m;
        }
        return false;
    }
});
    
// extends Matcher
BlockMatcher = Class(Matcher, {
    constructor: function BlockMatcher(name, start, end) {
        var self = this;
        self.mt = T_BLOCKMATCHER;
        self.tn = name;
        self.s = new CompositeMatcher( self.tn + '_Start', start, false );
        self.e = end;
    }
    
    // start block matcher
    ,s: null
    // end block matcher
    ,e: null
    
    ,get: function( stream, eat ) {
        var self = this, startMatcher = self.s, endMatchers = self.e, token;
        
        // matches start of block using startMatcher
        // and returns the associated endBlock matcher
        if ( token = startMatcher.get( stream, eat ) )
        {
            // use the token key to get the associated endMatcher
            var endMatcher = endMatchers[ token[0] ], m, 
                T = get_type( endMatcher ), T0 = startMatcher.ms[ token[0] ].tt;
            
            if ( T_REGEX === T0 )
            {
                // regex group number given, get the matched group pattern for the ending of this block
                if ( T_NUM === T )
                {
                    // the regex is wrapped in an additional group, 
                    // add 1 to the requested regex group transparently
                    m = token[1][ endMatcher+1 ];
                    endMatcher = new Matcher( (m.length > 1) ? T_STR : T_CHAR, self.tn + '_End', m );
                }
                // string replacement pattern given, get the proper pattern for the ending of this block
                else if ( T_STR === T )
                {
                    // the regex is wrapped in an additional group, 
                    // add 1 to the requested regex group transparently
                    m = group_replace(endMatcher, token[1]);
                    endMatcher = new Matcher( (m.length > 1) ? T_STR : T_CHAR, self.tn + '_End', m );
                }
            }
            return endMatcher;
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
    if ( T_NULL & T ) matcher = new Matcher( T_NULL, name, pattern, key );
    
    else if ( T_CHAR === T ) matcher = new Matcher( T_CHAR, name, pattern, key );
    
    else if ( T_STR & T ) matcher = is_char_list ? new Matcher( T_CHARLIST, name, pattern, key ) : new Matcher( T_STR, name, pattern, key );
    
    else if ( /*T_REGEX*/T_ARRAY & T ) matcher = new Matcher( T_REGEX, name, pattern, key );
    
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
            
            matcher = (l > 1) ? new CompositeMatcher( name, tmp ) : tmp[0];
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
            if ( T_REGEX === t1.tt && T_STR === get_type( tmp[i][1] ) && !has_prefix( tmp[i][1], RegExpID ) )
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
    return cachedMatchers[ name ] = new BlockMatcher( name, start, end );
}

//
// tokenizer factories
    
Token = Class({
    constructor: function Token( type, name, token ) {
        var self = this;
        self.tt = type || T_SIMPLE;
        self.id = name;
        self.tk = token;
        self.REQ = 0;
        self.ERR = 0;
        self.ACTER = 0;
        self.MSG = null;
        self.CLONE = ['tk'];
    }
    
    ,sID: null
    // tokenizer/token name/id
    ,id: null
    // tokenizer type
    ,tt: null
    // tokenizer token matcher
    ,tk: null
    // tokenizer action (optional)
    ,ta: null
    ,REQ: 0
    ,ERR: 0
    ,ACTER: 0
    ,MSG: null
    ,CLONE: null
    
    // tokenizer match action (optional)
    ,act: function( token, state ) {
        var self = this, action_def = self.ta || null, action, t, data = state.data;
        
        if ( action_def )
        {
            action = action_def[ 0 ]; t = action_def[ 1 ];
            
            if ( ACTION_POP === action )
            {
                if ( t )
                {
                    if ( token )
                        t = T_NUM === get_type( t ) ? token[1][ t ] : group_replace( t, token[1] );
                    
                    if ( data.isEmpty( ) || t !== data.peek() ) 
                    {
                        // no match
                        self.MSG = 'Token "'+t+'" No Match';
                        data.pop( );
                        return 1;
                    }
                    else
                    {
                        data.pop( );
                    }
                }
                else
                {
                    // pop unconditionaly
                    data.pop( );
                }
            }
            
            else if ( (ACTION_PUSH === action) && t )
            {
                if ( token )
                    t = T_NUM === get_type( t ) ? token[1][ t ] : group_replace( t, token[1] );
                data.push( t );
            }
        }
        return 0;
    }
    
    ,get: function( stream, state ) {
        var self = this, action = self.ta, token = self.tk, 
            type = self.tt, tokenID = self.id, t = null;
        
        self.MSG = null;
        self.ACTER = 0;
        
        // match EMPTY token
        if ( T_EMPTY === type ) 
        { 
            self.ERR = 0;
            self.REQ = 0;
            return true;
        }
        // match EOL ( with possible leading spaces )
        else if ( T_EOL === type ) 
        { 
            stream.spc();
            if ( stream.eol() )
            {
                return tokenID; 
            }
        }
        // match non-space
        else if ( T_NONSPACE === type ) 
        { 
            self.ERR = ( self.REQ && stream.spc() && !stream.eol() ) ? 1 : 0;
            self.REQ = 0;
        }
        // else match a simple token
        else if ( t = token.get(stream) ) 
        { 
            if ( action ) self.ACTER = self.act(t, state);
            return tokenID; 
        }
        return false;
    }
    
    ,req: function( bool ) { 
        this.REQ = !!bool;
        return this;
    }
    
    ,err: function( ) {
        var t = this;
        if ( t.MSG ) return t.MSG;
        else if ( t.REQ ) return 'Token "'+t.id+'" Expected';
        return 'Syntax Error: "'+t.id+'"';
    }

    ,clone: function( ) {
        var self = this, t, i, toClone = self.CLONE, toClonelen;
        
        t = new self.constructor( );
        t.tt = self.tt;
        t.id = self.id;
        t.ta = self.ta ? self.ta.slice() : self.ta;
        
        if ( toClone && toClone.length )
        {
            for (i=0, toClonelen = toClone.length; i<toClonelen; i++)   
                t[ toClone[i] ] = self[ toClone[i] ];
        }
        return t;
    }
    
    ,toString: function( ) {
        var self = this;
        return [
            '[', 'Tokenizer: ', 
            self.id, 
            ', Matcher: ', 
            (self.tk ? self.tk.toString() : null), 
            ']'
        ].join('');
    }
});
    
// extends Token
BlockToken = Class(Token, {
    constructor: function BlockToken( type, name, token, allowMultiline, escChar, hasInterior ) {
        var self = this;
        self.tt = type;
        self.id = name;
        self.tk = token;
        self.REQ = 0;
        self.ERR = 0;
        self.ACTER = 0;
        self.MSG = null;
        // a block is multiline by default
        self.mline = 'undefined' === typeof(allowMultiline) ? 1 : allowMultiline;
        self.esc = escChar || "\\";
        self.inter = hasInterior;
        self.CLONE = ['tk', 'mline', 'esc', 'inter'];
    }
     
    ,inter: 0
    ,mline: 0
    ,esc: null
    
    ,get: function( stream, state ) {
        var self = this, ended = 0, found = 0, endBlock, next = "", continueToNextLine, stackPos, 
            allowMultiline = self.mline, startBlock = self.tk, thisBlock = self.id, type = self.tt,
            hasInterior = self.inter, thisBlockInterior = hasInterior ? (thisBlock+'.inside') : thisBlock,
            charIsEscaped = 0, isEscapedBlock = T_ESCBLOCK === type, escChar = self.esc,
            isEOLBlock, alreadyIn, ret, streamPos, streamPos0, continueBlock
        ;
        
        /*
            This tokenizer class handles many different block types ( BLOCK, COMMENT, ESC_BLOCK, SINGLE_LINE_BLOCK ),
            having different styles ( DIFFERENT BLOCK DELIMS/INTERIOR ) etc..
            So logic can become somewhat complex,
            descriptive names and logic used here for clarity as far as possible
        */
        
        self.MSG = null;
        self.ACTER = 0;
        // comments in general are not required tokens
        if ( T_COMMENT === type ) self.REQ = 0;
        
        alreadyIn = 0;
        if ( state.inBlock === thisBlock )
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
            stackPos = state.stack.pos( );
            
            isEOLBlock = (T_NULL === endBlock.tt);
            
            if ( hasInterior )
            {
                if ( alreadyIn && isEOLBlock && stream.sol( ) )
                {
                    self.REQ = 0;
                    state.inBlock = null;
                    state.endBlock = null;
                    return false;
                }
                
                if ( !alreadyIn )
                {
                    state.stack.pushAt( stackPos, self.clone( ), 'sID', thisBlock );
                    return ret;
                }
            }
            
            ended = endBlock.get( stream );
            continueToNextLine = allowMultiline;
            continueBlock = 0;
            
            if ( !ended )
            {
                streamPos0 = stream.pos;
                while ( !stream.eol( ) ) 
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
                        next = stream.nxt( );
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
                state.stack.pushAt( stackPos, self.clone( ), 'sID', thisBlock );
            }
            
            return ret;
        }
        
        //state.inBlock = null;
        //state.endBlock = null;
        return false;
    }
});
            
// extends Token
CompositeToken = Class(Token, {
    constructor: function CompositeToken( type, name, tokens, min, max ) {
        var self = this;
        self.tt = type ? type : T_REPEATED;
        self.id = name || null;
        self.tk = null;
        self.ts = null;
        self.REQ = 0;
        self.ERR = 0;
        self.ACTER = 0;
        self.MSG = null;
        self.min = min || 0;
        self.max = max || INF;
        self.found = 0;
        self.CLONE = ['ts', 'min', 'max', 'found'];
        if ( tokens ) self.set( tokens );
    }
     
    ,ts: null
    ,min: 0
    ,max: 1
    ,found: 0
    
    ,set: function( tokens ) {
        if ( tokens ) this.ts = make_array( tokens );
        return this;
    }
    
    ,get: function( stream, state ) {
        var self = this, i, type = self.tt, token, style, tokens = self.ts, n = tokens.length, 
            found, min, max, tokensRequired, tokensErr, streamPos, stackPos, stackId, match_all;
        
        if ( T_EITHER === type )
        {
            tokensRequired = 0; tokensErr = 0;
            self.REQ = 1;
            self.ERR = 0;
            self.ACTER = 0;
            self.MSG = null;
            streamPos = stream.pos;
            
            for (i=0; i<n; i++)
            {
                token = tokens[i].clone().req( 1 );
                style = token.get(stream, state);
                
                tokensRequired += (token.REQ) ? 1 : 0;
                
                if ( false !== style )
                {
                    self.ACTER = token.ACTER;
                    self.MSG = token.MSG;
                    return style;
                }
                else if ( token.ERR )
                {
                    tokensErr++;
                    stream.bck2( streamPos );
                }
            }
            
            self.REQ = (tokensRequired > 0);
            self.ERR = (n == tokensErr && tokensRequired > 0);
            return false;
        }
        else if ( T_SEQUENCE_OR_NGRAM & type )
        {
            match_all = type & T_SEQUENCE ? 1 : 0;
            self.REQ = match_all;
            self.ERR = 0;
            self.ACTER = 0;
            self.MSG = null;
            streamPos = stream.pos;
            stackPos = state.stack.pos();
            token = tokens[ 0 ].clone().req( match_all );
            style = token.get(stream, state);
            stackId = self.id+'_'+get_id();
            
            if ( false !== style )
            {
                // not empty token
                if ( true !== style )
                {
                    for (var i=n-1; i>0; i--)
                        state.stack.pushAt( stackPos+n-i-1, tokens[ i ].clone().req( 1 ), 'sID', stackId );
                }
                    
                self.ACTER = token.ACTER;
                self.MSG = token.MSG;
                return style;
            }
            else if ( token.ERR /*&& token.REQ*/ )
            {
                self.ERR = match_all;
                stream.bck2( streamPos );
            }
            else if ( match_all && token.REQ )
            {
                self.ERR = 1;
            }
            
            return false;
        }
        else
        {
            tokensRequired = 0;
            found = self.found; min = self.min; max = self.max;
            self.ERR = 0;
            self.REQ = 0;
            self.ACTER = 0;
            self.MSG = null;
            streamPos = stream.pos;
            stackPos = state.stack.pos( );
            stackId = self.id+'_'+get_id( );
            
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
                        state.stack.pushAt( stackPos, self.clone( ), 'sID', stackId );
                        self.found = 0;
                        self.ACTER = token.ACTER;
                        self.MSG = token.MSG;
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
            
            self.REQ = found < min;
            self.ERR = found > max || (found < min && 0 < tokensRequired);
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
                        repeat[0] || '',
                        ',',
                        isFinite(repeat[1]) ? (repeat[1]||'') : '',
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
        ngrams, ngram, i, l, j, l2, xtends, xtendedTok, t;
    
    if ( null === tokenID )
    {
        // EOL Tokenizer
        return new Token( T_EOL, 'EOL', tokenID );
    }
    
    else if ( "" === tokenID )
    {
        // NONSPACE Tokenizer
        return new Token( T_NONSPACE, 'NONSPACE', tokenID );
    }
    
    else if ( false === tokenID || 0 === tokenID )
    {
        // EMPTY Tokenizer
        return new Token( T_EMPTY, 'EMPTY', tokenID );
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
        if ( tok['all'] || tok['sequence'] )
        {
            tok.type = "group";
            tok.match = "sequence";
            tok.tokens = tok['all'] || tok['sequence'];
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
    
    if ( T_SIMPLE & type )
    {
        if ( "" === tok.tokens )
        {
            // NONSPACE Tokenizer
            token = new Token( T_NONSPACE, tokenID, tokenID );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        else if ( null === tok.tokens )
        {
            // EOL Tokenizer
            token = new Token( T_EOL, tokenID, tokenID );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
        else if ( false === tok.tokens || 0 === tok.tokens )
        {
            // EMPTY Tokenizer
            token = new Token( T_EMPTY, tokenID, tokenID );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = token;
            return token;
        }
    }

    tok.tokens = make_array( tok.tokens );
    
    if ( T_SIMPLE & type )
    {
        if ( tok.autocomplete ) get_autocomplete( tok, tokenID, keywords );
        
        if ( tok.push )
        {
            if ( !tok.action ) tok.action = [ 'push', tok.push ];
            delete tok.push;
        }
        else if ( tok[HAS]('pop') )
        {
            if ( !tok.action ) tok.action = [ 'pop', tok.pop ];
            delete tok.pop;
        }
        
        tokenAction = null;
        if ( tok.action && tok.action[0] )
        {
            if ( 'push' === tok.action[0] )
            {
                tokenAction = [ ACTION_PUSH, tok.action[1] ];
            }
            else if ( 'pop' === tok.action[0] )
            {
                tokenAction = [ ACTION_POP, tok.action[1] ];
            }
        }
        
        // combine by default if possible using word-boundary delimiter
        combine = ( 'undefined' === typeof(tok.combine) ) ? "\\b" : tok.combine;
        token = new Token( T_SIMPLE, tokenID,
                    get_compositematcher( tokenID, tok.tokens.slice(), RegExpID, combine, cachedRegexes, cachedMatchers )
                );
        token.ta = tokenAction;
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = token;
    }
    
    else if ( T_BLOCK & type )
    {
        if ( T_COMMENT & type ) get_comments( tok, comments );

        token = new BlockToken( type, tokenID,
                    get_blockmatcher( tokenID, tok.tokens.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
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
            token = new CompositeToken( T_REPEATED, tokenID, null, tok.match[0], tok.match[1] );
        }
        else
        {
            matchType = groupTypes[ tok.match.toUpperCase() ]; 
            
            if ( T_ZEROORONE === matchType ) 
                token = new CompositeToken( T_ZEROORONE, tokenID, null, 0, 1 );
            
            else if ( T_ZEROORMORE === matchType ) 
                token = new CompositeToken( T_ZEROORMORE, tokenID, null, 0, INF );
            
            else if ( T_ONEORMORE === matchType ) 
                token = new CompositeToken( T_ONEORMORE, tokenID, null, 1, INF );
            
            else if ( T_EITHER & matchType ) 
                token = new CompositeToken( T_EITHER, tokenID, null );
            
            else //if (T_SEQUENCE === matchType)
                token = new CompositeToken( T_SEQUENCE, tokenID, null );
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
            token[i] = new CompositeToken( T_NGRAM, tokenID + '_NGRAM_' + i, null );
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
*   @version: 1.0.2
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
    
    ,parse: function( code ) {
        code = code || "";
        var self = this, lines = code.split(newline_re), l = lines.length, i,
            linetokens = [], tokens, state, stream;
        state = new State( );
        state.parseAll = 1;
        for (i=0; i<l; i++)
        {
            stream = new Stream( lines[i] );
            tokens = [];
            while ( !stream.eol() )
            {
                tokens.push( self.getToken( stream, state ) );
                //stream.sft();
            }
            linetokens.push( tokens );
        }
        return linetokens;
    }
    
    // Codemirror Tokenizer compatible
    ,getToken: function( stream, state ) {
        var self = this, i, ci, tokenizer, type, 
            interleavedCommentTokens = self.cTokens, tokens = self.Tokens, numTokens = tokens.length, 
            parseAll = !!state.parseAll, stack,
            Style = self.Style, DEFAULT = self.DEF, ERROR = self.ERR, ret
        ;
        
        stream = parseAll ? stream : Stream._( stream );
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
        if ( stream.sol() && !stack.isEmpty() && T_EOL === stack.peek().tt ) 
        {
            stack.pop();
        }
        
        // check for non-space tokenizer before parsing space
        if ( (stack.isEmpty() || (T_NONSPACE !== stack.peek().tt)) && stream.spc() )
        {
            return parseAll ? { value: stream.cur(1), type: DEFAULT, error: null } : state.t = DEFAULT;
        }
        
        while ( !stack.isEmpty() && !stream.eol() )
        {
            if (interleavedCommentTokens)
            {
                ci = 0;
                while ( ci < interleavedCommentTokens.length )
                {
                    tokenizer = interleavedCommentTokens[ci++];
                    type = tokenizer.get( stream, state );
                    if ( false !== type )
                    {
                        type = Style[type] || DEFAULT;
                        return parseAll ? { value: stream.cur(1), type: type, error: null } : state.t = type;
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
                    return parseAll ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.t = ERROR;
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
                // action error
                if ( tokenizer.ACTER )
                {
                    // empty the stack
                    stack.empty('sID', tokenizer.sID);
                    // generate error
                    state.t = type = ERROR;
                    return parseAll ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.t = ERROR;
                }
                else
                {
                    return parseAll ? { value: stream.cur(1), type: type, error: null } : state.t = type;
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
                    return parseAll ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.t = ERROR;
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
                // action error
                if ( tokenizer.ACTER )
                {
                    // empty the stack
                    stack.empty('sID', tokenizer.sID);
                    // generate error
                    state.t = type = ERROR;
                    return parseAll ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.t = ERROR;
                }
                else
                {
                    return parseAll ? { value: stream.cur(1), type: type, error: null } : state.t = type;
                }
            }
        }
        
        // unknown, bypass
        stream.nxt();
        state.t = DEFAULT;
        return parseAll ? { value: stream.cur(1), type: DEFAULT, error: null } : state.t = DEFAULT;
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
                return state.clone( ); 
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
        
        var errors = [], 
            linetokens = parser.parse( code ), 
            tokens, token, t, 
            lines = linetokens.length, 
            line, row, column;
        
        for (line=0; line<lines; line++) 
        {
            tokens = linetokens[ line ];
            if ( !tokens || !tokens.length ) continue;
            
            column = 0;
            for (t=0; t<tokens.length; t++)
            {
                token = tokens[t];
                
                if ( parser.ERR === token.type )
                {
                    errors.push({
                        message: token.error || "Syntax Error",
                        severity: "error",
                        from: CodeMirror.Pos(line, column),
                        to: CodeMirror.Pos(line, column+1)
                    });
                }
                column += token.value.length;
            }
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
    
    VERSION: "1.0.2",
    
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