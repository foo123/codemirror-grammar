    
    //
    // Stream Class
    var
        // a wrapper-class to manipulate a string as a stream, based on Codemirror's StringStream
        ParserStream = Class({
            
            constructor: function( line ) {
                this.string = (line) ? ''+line : '';
                this.start = this.pos = 0;
                this._ = null;
            },
            
            // abbreviations used for optimal minification
            
            _: null,
            string: '',
            start: 0,
            pos: 0,
            
            fromStream: function( _ ) {
                this._ = _;
                this.string = ''+_.string;
                this.start = _.start;
                this.pos = _.pos;
                return this;
            },
            
            toString: function() { return this.string; },
            
            // string start-of-line?
            sol: function( ) { return 0 == this.pos; },
            
            // string end-of-line?
            eol: function( ) { return this.pos >= this.string.length; },
            
            // char match
            chr : function(pattern, eat) {
                var ch = this.string.charAt(this.pos) || null;
                if (ch && pattern == ch) 
                {
                    if (false !== eat) 
                    {
                        this.pos += 1;
                        if ( this._ ) this._.pos = this.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // char list match
            chl : function(pattern, eat) {
                var ch = this.string.charAt(this.pos) || null;
                if ( ch && (-1 < pattern.indexOf( ch )) ) 
                {
                    if (false !== eat) 
                    {
                        this.pos += 1;
                        if ( this._ ) this._.pos = this.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // string match
            str : function(pattern, startsWith, eat) {
                var pos = this.pos, str = this.string, ch = str.charAt(pos) || null;
                if ( ch && startsWith[ ch ] )
                {
                    var len = pattern.length, s = str.substr(pos, len);
                    if (pattern == s) 
                    {
                        if (false !== eat) 
                        {
                            this.pos += len;
                            if ( this._ )  this._.pos = this.pos;
                        }
                        return s;
                    }
                }
                return false;
            },
            
            // regex match
            rex : function(pattern, startsWith, notStartsWith, group, eat) {
                var pos = this.pos, str = this.string, ch = str.charAt(pos) || null;
                if ( ch && ( startsWith && startsWith[ ch ] ) || ( notStartsWith && !notStartsWith[ ch ] ) )
                {
                    var match = str.slice(pos).match(pattern);
                    if (!match || match.index > 0) return false;
                    if (false !== eat) 
                    {
                        this.pos += match[group||0].length;
                        if ( this._ ) this._.pos = this.pos;
                    }
                    return match;
                }
                return false;
            },
            /*
            // general pattern match
            match: function(pattern, eat, caseInsensitive, group) {
                if (typeof pattern == "string") 
                {
                    var cased = function(str) {return caseInsensitive ? str.toLowerCase() : str;};
                    var substr = this.string.substr(this.pos, pattern.length);
                    if (cased(substr) == cased(pattern)) 
                    {
                        if (eat !== false) this.pos += pattern.length;
                        return true;
                    }
                } 
                else 
                {
                    group = group || 0;
                    var match = this.string.slice(this.pos).match(pattern);
                    if (match && match.index > 0) return null;
                    if (match && eat !== false) this.pos += match[group].length;
                    return match;
                }
            },
            */
            // skip to end
            end: function() {
                this.pos = this.string.length;
                if ( this._ ) this._.pos = this.pos;
                return this;
            },
            /*
            // peek next char
            peek: function( ) { 
                return this.string.charAt(this.pos) || null; 
            },
            */
            // get next char
            nxt: function( ) {
                if (this.pos < this.string.length)
                {
                    var ch = this.string.charAt(this.pos++) || null;
                    if ( this._ ) this._.pos = this.pos;
                    return ch;
                }
            },
            
            // back-up n steps
            bck: function( n ) {
                this.pos -= n;
                if ( 0 > this.pos ) this.pos = 0;
                if ( this._ )  this._.pos = this.pos;
                return this;
            },
            
            // back-track to pos
            bck2: function( pos ) {
                this.pos = pos;
                if ( 0 > this.pos ) this.pos = 0;
                if ( this._ ) this._.pos = this.pos;
                return this;
            },
            
            // eat space
            spc: function( ) {
                var start = this.pos, pos = this.pos, s = this.string;
                while (/[\s\u00a0]/.test(s.charAt(pos))) ++pos;
                this.pos = pos;
                if ( this._ ) this._.pos = this.pos;
                return this.pos > start;
            },
            
            // current stream selection
            cur: function( ) {
                return this.string.slice(this.start, this.pos);
            },
            
            // move/shift stream
            sft: function( ) {
                this.start = this.pos;
                return this;
            }
        })
    ;
    