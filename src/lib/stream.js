    
    //
    // Stream Class
    var
        Max = Math.max, spaceRegex = /^[\s\u00a0]+/, spc = /[^\s\u00a0]/,
        // Counts the column offset in a string, taking tabs into account.
        // Used mostly to find indentation.
        // adapted from CodeMirror
        countColumn = function(string, end, tabSize, startIndex, startValue) {
            var i, n;
            if ( null === end ) 
            {
                end = string.search(spc);
                if ( -1 == end ) end = string.length;
            }
            for (i = startIndex || 0, n = startValue || 0; i < end; ++i) 
                n += ( "\t" == string.charAt(i) ) ? (tabSize - (n % tabSize)) : 1;
            return n;
        }
        // a wrapper-class to manipulate a string as a stream, based on Codemirror's StringStream
        ParserStream = Class({
            
            constructor: function( line ) {
                var ayto = this;
                ayto._ = null;
                ayto.s = (line) ? ''+line : '';
                ayto.start = ayto.pos = 0;
                ayto.lastColumnPos = ayto.lastColumnValue = 0;
                ayto.lineStart = 0;
            },
            
            // abbreviations used for optimal minification
            
            _: null,
            s: '',
            start: 0,
            pos: 0,
            lastColumnPos: 0,
            lastColumnValue: 0,
            lineStart: 0,
            
            fromStream: function( _ ) {
                var ayto = this;
                ayto._ = _;
                ayto.s = ''+_.string;
                ayto.start = _.start;
                ayto.pos = _.pos;
                ayto.lastColumnPos = _.lastColumnPos;
                ayto.lastColumnValue = _.lastColumnValue;
                ayto.lineStart = _.lineStart;
                return ayto;
            },
            
            toString: function( ) { return this.s; },
            
            // string start-of-line?
            sol: function( ) { return 0 == this.pos; },
            
            // string end-of-line?
            eol: function( ) { return this.pos >= this.s.length; },
            
            // char match
            chr : function( pattern, eat ) {
                var ayto = this, ch = ayto.s.charAt(ayto.pos) || null;
                if (ch && pattern == ch) 
                {
                    if (false !== eat) 
                    {
                        ayto.pos += 1;
                        if ( ayto._ ) ayto._.pos = ayto.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // char list match
            chl : function( pattern, eat ) {
                var ayto = this, ch = ayto.s.charAt(ayto.pos) || null;
                if ( ch && (-1 < pattern.indexOf( ch )) ) 
                {
                    if (false !== eat) 
                    {
                        ayto.pos += 1;
                        if ( ayto._ ) ayto._.pos = ayto.pos;
                    }
                    return ch;
                }
                return false;
            },
            
            // string match
            str : function( pattern, startsWith, eat ) {
                var ayto = this, len, pos = ayto.pos, str = ayto.s, ch = str.charAt(pos) || null;
                if ( ch && startsWith[ ch ] )
                {
                    len = pattern.length; 
                    if (pattern == str.substr(pos, len)) 
                    {
                        if (false !== eat) 
                        {
                            ayto.pos += len;
                            if ( ayto._ ) ayto._.pos = ayto.pos;
                        }
                        return pattern;
                    }
                }
                return false;
            },
            
            // regex match
            rex : function( pattern, startsWith, notStartsWith, group, eat ) {
                var ayto = this, match, pos = ayto.pos, str = ayto.s, ch = str.charAt(pos) || null;
                if ( ch && ( startsWith && startsWith[ ch ] ) || ( notStartsWith && !notStartsWith[ ch ] ) )
                {
                    match = str.slice(pos).match(pattern);
                    if (!match || match.index > 0) return false;
                    if (false !== eat) 
                    {
                        ayto.pos += match[group||0].length;
                        if ( ayto._ ) ayto._.pos = ayto.pos;
                    }
                    return match;
                }
                return false;
            },

            // skip to end
            end: function( ) {
                var ayto = this;
                ayto.pos = ayto.s.length;
                if ( ayto._ ) ayto._.pos = ayto.pos;
                return ayto;
            },

            // get next char
            nxt: function( ) {
                var ayto = this, ch, s = ayto.s;
                if (ayto.pos < s.length)
                {
                    ch = s.charAt(ayto.pos++) || null;
                    if ( ayto._ ) ayto._.pos = ayto.pos;
                    return ch;
                }
            },
            
            // back-up n steps
            bck: function( n ) {
                var ayto = this;
                ayto.pos = Max(0, ayto.pos - n);
                if ( ayto._ ) ayto._.pos = ayto.pos;
                return ayto;
            },
            
            // back-track to pos
            bck2: function( pos ) {
                var ayto = this;
                ayto.pos = Max(0, pos);
                if ( ayto._ ) ayto._.pos = ayto.pos;
                return ayto;
            },
            
            // get current column including tabs
            col: function( tabSize ) {
                var ayto = this;
                if (ayto.lastColumnPos < ayto.start) 
                {
                    ayto.lastColumnValue = countColumn(ayto.s, ayto.start, tabSize, ayto.lastColumnPos, ayto.lastColumnValue);
                    ayto.lastColumnPos = ayto.start;
                }
                return ayto.lastColumnValue - (ayto.lineStart ? countColumn(ayto.s, ayto.lineStart, tabSize) : 0);
            },
            
            // get current indentation including tabs
            ind: function( tabSize ) {
                var ayto = this;
                return countColumn(ayto.s, null, tabSize) - (ayto.lineStart ? countColumn(ayto.s, ayto.lineStart, tabSize) : 0);
            },
            
            // eat space
            spc: function( ) {
                var ayto = this, m, start = ayto.pos, s = ayto.s.slice(start);
                if ( m = s.match( spaceRegex ) ) 
                {
                    ayto.pos += m[0].length;
                    if ( ayto._ ) ayto._.pos = ayto.pos;
                }
                return ayto.pos > start;
            },
            
            // current stream selection
            cur: function( andShiftStream ) {
                var ayto = this, ret = ayto.s.slice(ayto.start, ayto.pos);
                if ( andShiftStream ) ayto.start = ayto.pos;
                return ret;
            },
            
            // move/shift stream
            sft: function( ) {
                this.start = this.pos;
                return this;
            }
        })
    ;
    