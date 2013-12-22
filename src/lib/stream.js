    
    //
    // Stream Class
    var
        // a wrapper-class to manipulate a string as a stream, based on Codemirror's StringStream
        ParserStream = Class({
            
            constructor: function( line ) {
                this.string = (line) ? ''+line : '';
                this.start = this.pos = 0;
                this.stream = null;
            },
            
            stream: null,
            string: '',
            start: 0,
            pos: 0,
            
            fromStream: function( stream ) {
                this.stream = stream;
                this.string = ''+stream.string;
                this.start = stream.start;
                this.pos = stream.pos;
                return this;
            },
            
            toString: function() { return this.string; },
            
            // abbreviations used for optimal minification
            
            // string start?
            sol: function( ) { 
                return 0 == this.pos; 
            },
            
            // string ended?
            eol: function( ) { 
                return this.pos >= this.string.length; 
            },
            
            // char match
            chr : function(pattern, eat) {
                eat = (false !== eat);
                var ch = this.string.charAt(this.pos) || '';
                
                if (pattern == ch) 
                {
                    if (eat) 
                    {
                        this.pos += 1;
                        if ( this.stream )
                            this.stream.pos = this.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // string match
            str : function(pattern, chars, eat) {
                eat = (false !== eat);
                var pos = this.pos, ch = this.string.charAt(pos);
                
                if ( chars.peek[ ch ] )
                {
                    var len = pattern.length, str = this.string.substr(pos, len);
                    if (pattern == str) 
                    {
                        if (eat) 
                        {
                            this.pos += len;
                            if ( this.stream )
                                this.stream.pos = this.pos;
                        }
                        return str;
                    }
                }
                return false;
            },
            
            // regex match
            rex : function(pattern, chars, eat, group) {
                eat = (false !== eat);
                group = group || 0;
                var pos = this.pos, ch = this.string.charAt(pos);
                
                if ( ( chars.peek && chars.peek[ ch ] ) || ( chars.negativepeek && !chars.negativepeek[ ch ] ) )
                {
                    var match = this.string.slice(pos).match(pattern);
                    if (!match || match.index > 0) return false;
                    if (eat)
                    {
                        this.pos += match[group].length;
                        if ( this.stream )
                            this.stream.pos = this.pos;
                    }
                    return match;
                }
                return false;
            },
            
            // general pattern match
            mch: function(pattern, eat, caseInsensitive, group) {
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
            
            // skip to end
            end: function() {
                this.pos = this.string.length;
                if ( this.stream )
                    this.stream.pos = this.pos;
                return this;
            },
            
            // peek next char
            pk: function( ) { 
                return this.string.charAt(this.pos); 
            },
            
            // get next char
            nxt: function( ) {
                if (this.pos < this.string.length)
                {
                    var ch = this.string.charAt(this.pos++);
                    if ( this.stream )
                        this.stream.pos = this.pos;
                    return ch;
                }
            },
            
            // back-up n steps
            bck: function( n ) {
                this.pos -= n;
                if ( this.stream )
                    this.stream.pos = this.pos;
                return this;
            },
            
            // back-track to pos
            bck2: function( pos ) {
                this.pos = pos;
                if ( this.stream )
                    this.stream.pos = this.pos;
                return this;
            },
            
            // eat space
            spc: function( ) {
                var start = this.pos, pos = this.pos;
                while (/[\s\u00a0]/.test(this.string.charAt(pos))) ++pos;
                this.pos = pos;
                if ( this.stream )
                    this.stream.pos = this.pos;
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
    