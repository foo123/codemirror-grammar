    
    //
    // matcher factories
    var getChar = function( stream, eat ) {
            var self = this, matchedResult;    
            if ( matchedResult = stream.chr(self.tp, eat) ) return [ self.tk, matchedResult ];
            return false;
        },
        
        getCharList = function( stream, eat ) {
            var self = this, matchedResult;    
            if ( matchedResult = stream.chl(self.tp, eat) ) return [ self.tk, matchedResult ];
            return false;
        },
        
        getStr = function( stream, eat ) {
            var self = this, matchedResult;    
            if ( matchedResult = stream.str(self.tp, self.p, eat) ) return [ self.tk, matchedResult ];
            return false;
        },
        
        getRegex = function( stream, eat ) {
            var self = this, matchedResult;    
            if ( matchedResult = stream.rex(self.tp, self.p, self.np, self.tg, eat) ) return [ self.tk, matchedResult ];
            return false;
        },
        
        getNull = function( stream, eat ) {
            var self = this;
            // matches end-of-line
            (false !== eat) && stream.end( ); // skipToEnd
            return [ self.tk, "" ];
        }
    ;
        
    var SimpleMatcher = function SimpleMatcher( type, name, pattern, key ) {
        var self = this;
        self.$class = SimpleMatcher;
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
    };
    SimpleMatcher[PROTO] = {
        constructor: SimpleMatcher,
        $class: null,
        // matcher type
        mt: null,
        // token type
        tt: null,
        // token name
        tn: null,
        // token pattern
        tp: null,
        // token pattern group
        tg: 0,
        // token key
        tk: 0,
        // pattern peek chars
        p: null,
        // pattern negative peek chars
        np: null,
        
        get: function( stream, eat ) {
            return false;
        },
        
        toString: function() {
            return ['[', 'Matcher: ', this.tn, ', Pattern: ', ((this.tp) ? this.tp.toString() : null), ']'].join('');
        }
    };
        
    var CompositeMatcher = function CompositeMatcher( name, matchers, useOwnKey ) {
        var self = this;
        self.$class = CompositeMatcher;
        self.mt = T_COMPOSITEMATCHER;
        self.tn = name;
        self.ms = matchers;
        self.ownKey = (false!==useOwnKey);
    };
    // extends SimpleMatcher
    CompositeMatcher[PROTO] = Merge(Extend(SimpleMatcher[PROTO]), {
        constructor: CompositeMatcher,
        
        // group of matchers
        ms: null,
        ownKey: true,
        
        get: function( stream, eat ) {
            var i, m, matchers = this.ms, l = matchers.length, useOwnKey = this.ownKey;
            for (i=0; i<l; i++)
            {
                // each one is a matcher in its own
                m = matchers[ i ].get( stream, eat );
                if ( m ) return ( useOwnKey ) ? [ i, m[1] ] : m;
            }
            return false;
        }
    });
        
    var BlockMatcher = function BlockMatcher(name, start, end) {
        var self = this;
        self.$class = BlockMatcher;
        self.mt = T_BLOCKMATCHER;
        self.tn = name;
        self.s = new CompositeMatcher( self.tn + '_Start', start, false );
        self.e = end;
    };
    // extends SimpleMatcher
    BlockMatcher[PROTO] = Merge(Extend(SimpleMatcher[PROTO]), {
        constructor: BlockMatcher,
        // start block matcher
        s: null,
        // end block matcher
        e: null,
        
        get: function( stream, eat ) {
                
            var self = this, startMatcher = self.s, endMatchers = self.e, token;
            
            // matches start of block using startMatcher
            // and returns the associated endBlock matcher
            if ( token = startMatcher.get(stream, eat) )
            {
                // use the token key to get the associated endMatcher
                var endMatcher = endMatchers[ token[0] ], m, 
                    T = get_type( endMatcher ), T0 = startMatcher.ms[ token[0] ].tt;
                
                if ( T_REGEX == T0 )
                {
                    // regex group number given, get the matched group pattern for the ending of this block
                    if ( T_NUM == T )
                    {
                        // the regex is wrapped in an additional group, 
                        // add 1 to the requested regex group transparently
                        m = token[1][ endMatcher+1 ];
                        endMatcher = new SimpleMatcher( (m.length > 1) ? T_STR : T_CHAR, self.tn + '_End', m );
                    }
                    // string replacement pattern given, get the proper pattern for the ending of this block
                    else if ( T_STR == T )
                    {
                        // the regex is wrapped in an additional group, 
                        // add 1 to the requested regex group transparently
                        m = groupReplace(endMatcher, token[1]);
                        endMatcher = new SimpleMatcher( (m.length > 1) ? T_STR : T_CHAR, self.tn + '_End', m );
                    }
                }
                return endMatcher;
            }
            
            return false;
        }
    });
    
    var    
        getSimpleMatcher = function( name, pattern, key, cachedMatchers ) {
            var T = get_type( pattern );
            
            if ( T_NUM == T ) return pattern;
            
            if ( !cachedMatchers[ name ] )
            {
                key = key || 0;
                var matcher, is_char_list = 0;
                
                if ( pattern && pattern.isCharList )
                {
                    is_char_list = 1;
                    delete pattern.isCharList;
                }
                
                // get a fast customized matcher for < pattern >
                if ( T_NULL & T ) matcher = new SimpleMatcher( T_NULL, name, pattern, key );
                
                else if ( T_CHAR == T ) matcher = new SimpleMatcher( T_CHAR, name, pattern, key );
                
                else if ( T_STR & T ) matcher = (is_char_list) ? new SimpleMatcher( T_CHARLIST, name, pattern, key ) : new SimpleMatcher( T_STR, name, pattern, key );
                
                else if ( /*T_REGEX*/T_ARRAY & T ) matcher = new SimpleMatcher( T_REGEX, name, pattern, key );
                
                // unknown
                else matcher = pattern;
                
                cachedMatchers[ name ] = matcher;
            }
            
            return cachedMatchers[ name ];
        },
        
        getCompositeMatcher = function( name, tokens, RegExpID, combined, cachedRegexes, cachedMatchers ) {
            
            if ( !cachedMatchers[ name ] )
            {
                var tmp, i, l, l2, array_of_arrays = 0, 
                    has_regexs = 0, is_char_list = 1, 
                    T1, T2, matcher
                ;
                
                tmp = make_array( tokens );
                l = tmp.length;
                
                if ( 1 == l )
                {
                    matcher = getSimpleMatcher( name, getRegexp( tmp[0], RegExpID, cachedRegexes ), 0, cachedMatchers );
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
                        
                        if ( (T_CHAR != T1) || (T_CHAR != T2) ) 
                        {
                            is_char_list = 0;
                        }
                        
                        if ( (T_ARRAY & T1) || (T_ARRAY & T2) ) 
                        {
                            array_of_arrays = 1;
                            //break;
                        }
                        else if ( hasPrefix( tmp[i], RegExpID ) || hasPrefix( tmp[l-1-i], RegExpID ) )
                        {
                            has_regexs = 1;
                            //break;
                        }
                    }
                    
                    if ( is_char_list && ( !combined || !( T_STR & get_type(combined) ) ) )
                    {
                        tmp = tmp.slice().join('');
                        tmp.isCharList = 1;
                        matcher = getSimpleMatcher( name, tmp, 0, cachedMatchers );
                    }
                    else if ( combined && !(array_of_arrays || has_regexs) )
                    {   
                        matcher = getSimpleMatcher( name, getCombinedRegexp( tmp, combined ), 0, cachedMatchers );
                    }
                    else
                    {
                        for (i=0; i<l; i++)
                        {
                            if ( T_ARRAY & get_type( tmp[i] ) )
                                tmp[i] = getCompositeMatcher( name + '_' + i, tmp[i], RegExpID, combined, cachedRegexes, cachedMatchers );
                            else
                                tmp[i] = getSimpleMatcher( name + '_' + i, getRegexp( tmp[i], RegExpID, cachedRegexes ), i, cachedMatchers );
                        }
                        
                        matcher = (l > 1) ? new CompositeMatcher( name, tmp ) : tmp[0];
                    }
                }
                
                cachedMatchers[ name ] = matcher;
            }
            
            return cachedMatchers[ name ];
        },
        
        getBlockMatcher = function( name, tokens, RegExpID, cachedRegexes, cachedMatchers ) {
            
            if ( !cachedMatchers[ name ] )
            {
                var tmp, i, l, start, end, t1, t2;
                
                // build start/end mappings
                start = []; end = [];
                tmp = make_array_2( tokens ); // array of arrays
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getSimpleMatcher( name + '_0_' + i, getRegexp( tmp[i][0], RegExpID, cachedRegexes ), i, cachedMatchers );
                    if (tmp[i].length>1)
                    {
                        if ( T_REGEX == t1.tt && T_STR == get_type( tmp[i][1] ) && !hasPrefix( tmp[i][1], RegExpID ) )
                            t2 = tmp[i][1];
                        else
                            t2 = getSimpleMatcher( name + '_1_' + i, getRegexp( tmp[i][1], RegExpID, cachedRegexes ), i, cachedMatchers );
                    }
                    else
                    {
                        t2 = t1;
                    }
                    start.push( t1 );  end.push( t2 );
                }
                
                cachedMatchers[ name ] = new BlockMatcher( name, start, end );
            }
            
            return cachedMatchers[ name ];
        }
    ;
