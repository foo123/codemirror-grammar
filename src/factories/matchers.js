    
    //
    // matcher factories
    var ESC = /([\-\.\*\+\?\^\$\{\}\(\)\|\[\]\/\\])/g,
        
        byLength = function(a, b) { return b.length - a.length },
        
        hasPrefix = function(s, id) {
            return (
                (T_STR & get_type(id)) && (T_STR & get_type(s)) && id.length &&
                id.length <= s.length && id == s.substr(0, id.length)
            );
        },
        
        getRegexp = function(r, rid, parsedRegexes)  {
            if ( !r || (T_NUM == get_type(r)) ) return r;
            
            var l = (rid) ? (rid.length||0) : 0;
            
            if ( l && rid == r.substr(0, l) ) 
            {
                var regexID = "^(" + r.substr(l) + ")", regex, peek, analyzer;
                
                if ( !parsedRegexes[ regexID ] )
                {
                    regex = new RegExp( regexID );
                    analyzer = new RegexAnalyzer( regex ).analyze();
                    peek = analyzer.getPeekChars();
                    if ( !Object.keys(peek.peek).length )  peek.peek = null;
                    if ( !Object.keys(peek.negativepeek).length )  peek.negativepeek = null;
                    
                    // shared, light-weight
                    parsedRegexes[ regexID ] = [ regex, peek ];
                }
                
                return parsedRegexes[ regexID ];
            }
            else
            {
                return r;
            }
        },
        
        getCombinedRegexp = function(tokens, boundary)  {
            var peek = { }, i, l, b = "";
            if ( T_STR == get_type(boundary)) b = boundary;
            for (i=0, l=tokens.length; i<l; i++) 
            {
                peek[ tokens[i].charAt(0) ] = 1;
                tokens[i] = tokens[i].replace(ESC, '\\$1');
            }
            return [ new RegExp("^(" + tokens.sort( byLength ).join( "|" ) + ")"+b), { peek: peek, negativepeek: null }, 1 ];
        },
        
        DummyMatcher = Extends( Object, {
            
            constructor : function(name, pattern, key, type) {
                this.name = name;
                this.pattern = pattern;
                this.key = key || 0;
                this.type = type || T_DUMMYMATCHER;
            },
            
            name : null,
            pattern : null,
            peek : null,
            type : null,
            key : 0,
            
            toString : function() {
                var s = '[';
                s += 'Matcher: ' + this.name;
                s += ', Type: ' + this.type;
                s += ', Pattern: ' + ((this.pattern) ? this.pattern.toString() : null);
                s += ']';
                return s;
            },
            
            match : function(stream, eat) { 
                return [ this.key, this.pattern ];
            }
        }),
        
        // get a fast customized matcher for < pattern >
        
        CharMatcher = Extends( DummyMatcher, {
            
            constructor : function(name, pattern, key) {
                this.name = name;
                this.pattern = pattern;
                this.type = T_CHARMATCHER;
                this.key = key || 0;
            },
            
            match : function(stream, eat) {
                var match;    
                if ( match = stream.matchChar(this.pattern, eat) )
                    return [ this.key, match ];
                return false;
            }
        }),
        
        StrMatcher = Extends( DummyMatcher, {
            
            constructor : function(name, pattern, key) {
                this.name = name;
                this.pattern = pattern;
                this.peek = { peek: {}, negativepeek: null };
                this.peek.peek[ '' + pattern.charAt(0) ] = 1;
                this.type = T_STRMATCHER;
                this.key = key || 0;
            },
            
            match : function(stream, eat) {
                var match;    
                if ( match = stream.matchStr(this.pattern, this.peek, eat) )
                    return [ this.key, match ];
                return false;
            }
        }),
        
        RegexMatcher = Extends( DummyMatcher, {
            
            constructor : function(name, pattern, key) {
                this.name = name;
                this.pattern = pattern[ 0 ];
                this.peek = pattern[ 1 ];
                this.isComposite = pattern[2] || 0;
                this.type = T_REGEXMATCHER;
                this.key = key || 0;
            },
            
            isComposite : 0,
            
            match : function(stream, eat) {
                var match;    
                if ( match = stream.matchRegex(this.pattern, this.peek, eat, this.isComposite) )
                    return [ this.key, match ];
                return false;
            }
        }),
        
        EolMatcher = Extends( DummyMatcher, {
            
            constructor : function(name, pattern, key) {
                this.name = name;
                this.type = T_EOLMATCHER;
                this.key = key || 0;
            },
            
            match : function(stream, eat) { 
                if (false !== eat) stream.skipToEnd(); // skipToEnd
                return [ this.key, "" ];
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
                if ( T_BOOL == T ) matcher = new DummyMatcher(name, pattern, key);
                
                else if ( T_NULL == T ) matcher = new EolMatcher(name, pattern, key);
                
                else if ( T_CHAR == T ) matcher = new CharMatcher(name, pattern, key);
                
                else if ( T_STR == T ) matcher = new StrMatcher(name, pattern, key);
                
                else if ( /*T_REGEX*/T_ARRAY == T ) matcher = new RegexMatcher(name, pattern, key);
                
                // unknown
                else matcher = pattern;
                
                parsedMatchers[ name ] = matcher;
            }
            
            return parsedMatchers[ name ];
        },
        
        CompositeMatcher = Extends( DummyMatcher, {
            
            constructor : function(name, matchers, useOwnKey) {
                this.name = name;
                this.matchers = matchers;
                this.type = T_COMPOSITEMATCHER;
                this.useOwnKey = (false!==useOwnKey);
            },
            
            matchers : null,
            useOwnKey : true,
            
            test : function(str) {
                var i, m, matchers = this.matchers, l = matchers.length;
                for (i=0; i<l; i++)
                {
                    // each one is a custom matcher in its own
                    m = matchers[i].test(str);
                    if ( m ) return true;
                }
                return false;
            },
            
            match : function(stream, eat) {
                var i, m, matchers = this.matchers, l = matchers.length;
                for (i=0; i<l; i++)
                {
                    // each one is a custom matcher in its own
                    m = matchers[i].match(stream, eat);
                    if ( m ) return ( this.useOwnKey ) ? [ i, m[1] ] : m;
                }
                return false;
            }
        }),
        
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
        
        BlockMatcher = Extends( DummyMatcher, {
            
            constructor : function(name, start, end) {
                this.name = name;
                this.type = T_BLOCKMATCHER;
                this.start = new CompositeMatcher(this.name + '_StartMatcher', start, false);
                this.pattern = this.start.pattern || null;
                this.end = end;
            },
            
            start : null,
            end : null,
            
            test : function(str) {
                return this.start.test(str);
            },
            
            match : function(stream, eat) {
                    
                var token = this.start.match(stream, eat);
                
                if ( token )
                {
                    var endMatcher = this.end[ token[0] ];
                    
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
