    
    //
    // matcher factories
    var 
        // get a fast customized matcher for < pattern >
        CharMatcher = Class({
            
            constructor : function(name, pattern, key) {
                this.type = T_CHARMATCHER;
                this.name = name;
                this.t = pattern;
                this.k = key || 0;
                this.p = null;
            },
            
            // token type
            type: null,
            // token name
            name: null,
            // token pattern
            t: null,
            // key
            k: 0,
            // peek chars
            p: null,
            
            toString : function() {
                var s = '[';
                s += 'Matcher: ' + this.name;
                s += ', Type: ' + this.type;
                s += ', Pattern: ' + ((this.t) ? this.t.toString() : null);
                s += ']';
                return s;
            },
            
            get : function(stream, eat) {
                var match;    
                if ( match = stream.chr(this.t, eat) )
                    return [ this.k, match ];
                return false;
            }
        }),
        
        StrMatcher = Class(CharMatcher, {
            
            constructor : function(name, pattern, key) {
                this.$super('constructor', name, pattern, key);
                this.type = T_STRMATCHER;
                this.p = { peek: {}, negativepeek: null };
                this.p.peek[ '' + pattern.charAt(0) ] = 1;
            },
            
            get : function(stream, eat) {
                var match;    
                if ( match = stream.str(this.t, this.p, eat) )
                    return [ this.k, match ];
                return false;
            }
        }),
        
        RegexMatcher = Class(CharMatcher, {
            
            constructor : function(name, pattern, key) {
                this.$super('constructor', name, pattern, key);
                this.type = T_REGEXMATCHER;
                this.t = pattern[ 0 ];
                this.p = pattern[ 1 ];
                this.g = pattern[ 2 ] || 0;
            },
            
            g : 0,
            
            get : function(stream, eat) {
                var match;    
                if ( match = stream.rex(this.t, this.p, eat, this.g) )
                    return [ this.k, match ];
                return false;
            }
        }),
        
        EolMatcher = Class(CharMatcher, {
            
            constructor : function(name, pattern, key) {
                this.$super('constructor', name, pattern, key);
                this.type = T_EOLMATCHER;
                this.t = null;
            },
            
            get : function(stream, eat) { 
                if (false !== eat) stream.end(); // skipToEnd
                return [ this.k, "" ];
            }
        }),
        
        CompositeMatcher = Class(CharMatcher, {
            
            constructor : function(name, matchers, useOwnKey) {
                this.type = T_COMPOSITEMATCHER;
                this.name = name;
                this.ms = matchers;
                this.ownKey = (false!==useOwnKey);
            },
            
            // group of matchers
            ms : null,
            ownKey : true,
            
            get : function(stream, eat) {
                var i, m, matchers = this.ms, l = matchers.length;
                for (i=0; i<l; i++)
                {
                    // each one is a custom matcher in its own
                    m = matchers[i].get(stream, eat);
                    if ( m ) return ( this.ownKey ) ? [ i, m[1] ] : m;
                }
                return false;
            }
        }),
        
        BlockMatcher = Class(CharMatcher, {
            
            constructor : function(name, start, end) {
                this.type = T_BLOCKMATCHER;
                this.name = name;
                this.s = new CompositeMatcher(this.name + '_StartMatcher', start, false);
                this.t = this.s.t || null;
                this.e = end;
            },
            
            // start block matcher
            s : null,
            // end block matcher
            e : null,
            
            get : function(stream, eat) {
                    
                var token = this.s.get(stream, eat);
                
                if ( token )
                {
                    var endMatcher = this.e[ token[0] ];
                    
                    // regex given, get the matched group for the ending of this block
                    if ( T_NUM == get_type( endMatcher ) )
                    {
                        // the regex is wrapped in an additional group, 
                        // add 1 to the requested regex group transparently
                        endMatcher = new StrMatcher( this.name + '_EndMatcher', token[1][ endMatcher+1 ] );
                    }
                    
                    return endMatcher;
                }
                
                return false;
            }
        }),
        
        getSimpleMatcher = function(tokenID, pattern, key, parsedMatchers) {
            // get a fast customized matcher for < pattern >
            
            key = key || 0;
            
            var name = tokenID + '_SimpleMatcher', matcher;
            
            var T = get_type( pattern );
            
            if ( T_NUM == T ) return pattern;
            
            if ( !parsedMatchers[ name ] )
            {
                //if ( T_BOOL == T ) matcher = new DummyMatcher(name, pattern, key);
                
                /*else */if ( T_NULL == T ) matcher = new EolMatcher(name, pattern, key);
                
                else if ( T_CHAR == T ) matcher = new CharMatcher(name, pattern, key);
                
                else if ( T_STR == T ) matcher = new StrMatcher(name, pattern, key);
                
                else if ( /*T_REGEX*/T_ARRAY == T ) matcher = new RegexMatcher(name, pattern, key);
                
                // unknown
                else matcher = pattern;
                
                parsedMatchers[ name ] = matcher;
            }
            
            return parsedMatchers[ name ];
        },
        
        getCompositeMatcher = function(tokenID, tokens, RegExpID, isRegExpGroup, parsedRegexes, parsedMatchers) {
            
            var tmp, i, l, l2, array_of_arrays = false, has_regexs = false;
            
            var name = tokenID + '_CompoMatcher', matcher;
            
            if ( !parsedMatchers[ name ] )
            {
                tmp = make_array( tokens );
                l = tmp.length;
                
                if ( isRegExpGroup )
                {   
                    l2 = (l>>1) + 1;
                    // check if tokens can be combined in one regular expression
                    // if they do not contain sub-arrays or regular expressions
                    for (i=0; i<=l2; i++)
                    {
                        if ( (T_ARRAY == get_type( tmp[i] )) || (T_ARRAY == get_type( tmp[l-1-i] )) ) 
                        {
                            array_of_arrays = true;
                            break;
                        }
                        else if ( hasPrefix( tmp[i], RegExpID ) || hasPrefix( tmp[l-1-i], RegExpID ) )
                        {
                            has_regexs = true;
                            break;
                        }
                    }
                }
                
                if ( isRegExpGroup && !(array_of_arrays || has_regexs) )
                {   
                    matcher = getSimpleMatcher( name, getCombinedRegexp( tmp, isRegExpGroup ), 0, parsedMatchers );
                }
                else
                {
                    for (i=0; i<l; i++)
                    {
                        if ( T_ARRAY == get_type( tmp[i] ) )
                            tmp[i] = getCompositeMatcher( name + '_' + i, tmp[i], RegExpID, isRegExpGroup, parsedRegexes, parsedMatchers );
                        else
                            tmp[i] = getSimpleMatcher( name + '_' + i, getRegexp( tmp[i], RegExpID, parsedRegexes ), i, parsedMatchers );
                    }
                    
                    matcher = (tmp.length > 1) ? new CompositeMatcher( name, tmp ) : tmp[0];
                }
                
                parsedMatchers[ name ] = matcher;
            }
            
            return parsedMatchers[ name ];
        },
        
        getBlockMatcher = function(tokenID, tokens, RegExpID, parsedRegexes, parsedMatchers) {
            var tmp, i, l, start, end, t1, t2;
            
            var name = tokenID + '_BlockMatcher';
            
            if ( !parsedMatchers[ name ] )
            {
                // build start/end mappings
                start=[]; end=[];
                tmp = make_array_2(tokens); // array of arrays
                for (i=0, l=tmp.length; i<l; i++)
                {
                    t1 = getSimpleMatcher( name + '_0_' + i, getRegexp( tmp[i][0], RegExpID, parsedRegexes ), i, parsedMatchers );
                    t2 = (tmp[i].length>1) ? getSimpleMatcher( name + '_1_' + i, getRegexp( tmp[i][1], RegExpID, parsedRegexes ), i, parsedMatchers ) : t1;
                    start.push( t1 );  end.push( t2 );
                }
                
                parsedMatchers[ name ] = new BlockMatcher(name, start, end);
            }
            
            return parsedMatchers[ name ];
        }
    ;
