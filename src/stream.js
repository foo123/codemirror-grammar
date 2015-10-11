
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
