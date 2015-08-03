
//
// Stream Class
var Max = Math.max, spcRegex = /^[\s\u00a0]+/, spc = /[^\s\u00a0]/;

// a wrapper-class to manipulate a string as a stream, based on Codemirror's StringStream
function Stream( line ) 
{
    var self = this;
    self._ = null;
    self.s = line ? ''+line : '';
    self.start = self.pos = 0;
    self.lCP = self.lCV = 0;
    self.lS = 0;
}

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

Stream[PROTO] = {
     constructor: Stream
    
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
};
