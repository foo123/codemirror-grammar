    
    //
    // Stream Class
    var
        // a wrapper-class to manipulate a string as a stream, based on Codemirror StringStream
        StringStream = Class({
            
            constructor: function( line, stream ) {
                if (stream)
                {
                    this.stream = stream;
                    this.string = ''+stream.string;
                    this.start = stream.start;
                    this.pos = stream.pos;
                }
                else
                {
                    this.string = ''+line;
                    this.start = this.pos = 0;
                }
            },
            
            stream: null,
            string: '',
            start: 0,
            pos: 0,
            
            sol: function( ) { 
                return 0 == this.pos; 
            },
            
            eol: function( ) { 
                return this.pos >= this.string.length; 
            },
            
            matchChar : function(pattern, eat) {
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
            
            matchStr : function(pattern, chars, eat) {
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
            
            matchRegex : function(pattern, chars, eat, group) {
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
            
            /*matchEol: function() { 
                return true;
            },*/
            
            skipToEnd: function() {
                this.pos = this.string.length; // skipToEnd
                if ( this.stream )
                    this.stream.pos = this.pos;
                return this;
            },
            
            peek: function( ) { 
                return this.string.charAt(this.pos) || undef; 
            },
            
            next: function( ) {
                if (this.pos < this.string.length)
                {
                    var ch = this.string.charAt(this.pos++);
                    if ( this.stream )
                        this.stream.pos = this.pos;
                    return ch;
                }
                return undef;
            },
            
            backUp: function( n ) {
                this.pos -= n;
                if ( this.stream )
                    this.stream.pos = this.pos;
                return this;
            },
            
            backTo: function( pos ) {
                this.pos = pos;
                if ( this.stream )
                    this.stream.pos = this.pos;
                return this;
            },
            
            eatSpace: function( ) {
                var start = this.pos;
                while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) ++this.pos;
                if ( this.stream )
                    this.stream.pos = this.pos;
                return this.pos > start;
            },
            
            current: function( ) {
                return this.string.slice(this.start, this.pos);
            },
            
            shift: function( ) {
                this.start = this.pos;
                return this;
            }
        })
    ;
    