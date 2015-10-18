
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
