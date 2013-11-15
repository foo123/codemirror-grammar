    
    //
    // matcher factories
    var ESC = /([\-\.\*\+\?\^\$\{\}\(\)\|\[\]\/\\])/g,
    
        getRegexp = function(rstr, rxid)  {
            if ( !rstr || is_number(rstr) ) return rstr;
            
            var l = (rxid) ? rxid.length : 0;
            
            if ( l && rxid == rstr.substr(0, l) )
                return new RegExp("^" + rstr.substr(l) + "");
            
            else
                return rstr;
        },
        
        getCombinedRegexp = function(words)  {
            for (var i=0, l=words.length; i<l; i++) words[i] = words[i].replace(ESC, '\\$1');
            return new RegExp("^((" + words.join(")|(") + "))\\b");
        },
        
        getMatcher = function(r, i) {
            // get a fast customized matcher for < r >
            
            // manipulate the codemirror stream directly for speed,
            // if codemirror code for stream matching changes,
            // only this part of the code needs to be adapted
            var matcher, strlen;
            
            i = i || 0;
            
            if (is_number(r))  
            {
                return r;
            }
            else if (is_char(r))
            {
                //strlen = r.length;
                matcher = function(stream, eat/*, ignoreCase*/) {
                    
                    // manipulate the codemirror stream directly for speed
                    eat = (false !== eat);
                    var ch = r; //(ignoreCase) ? r.toLowerCase() : r;
                    var sch = stream.string.charAt(stream.pos) || '';
                    var sch2 = sch; //(ignoreCase) ? sch.toLowerCase() : sch;
                    if (ch == sch) 
                    {
                        if (eat) stream.pos += 1;
                        return { key: i, val: sch };
                    }
                    return false;
                };
                matcher.__type = T_CHAR;
                return matcher;
            }
            else if (is_string(r))
            {
                strlen = r.length;
                matcher = function(stream, eat/*, ignoreCase*/) {
                    
                    // manipulate the codemirror stream directly for speed
                    eat = (false !== eat);
                    var cased = r; //(ignoreCase) ? r.toLowerCase() : r;
                    var str = stream.string.substr(stream.pos, strlen);
                    var str2 = str; //(ignoreCase) ? str.toLowerCase() : str;
                    if (cased == str2) 
                    {
                        if (eat) stream.pos += strlen;
                        return { key: i, val: str };
                    }
                    return false;
                };
                matcher.__type = T_STR;
                return matcher;
            }
            else if (is_regex(r))
            {
                matcher = function(stream, eat) {
                    
                    // manipulate the codemirror stream directly for speed
                    eat = (false !== eat);
                    var match = stream.string.slice(stream.pos).match(r);
                    if (!match || match.index > 0) return false;
                    if (eat) stream.pos += match[0].length;
                    return { key: i, val: match };
                };
                matcher.__type = T_REGEX;
                return matcher;
            }
            else
            {
                return r;
            }
            
        },
        
        getMatchersFor = function(tokens, RegExpID, isRegExpGroup) {
            if (isRegExpGroup)
            {   
                return [ getMatcher( getCombinedRegexp( make_array(tokens) ) ) ];
            }
            else
            {
                var tmp, i, l;
                
                tmp = make_array(tokens);
                
                for (i=0, l=tmp.length; i<l; i++)
                    tmp[i] = getMatcher( getRegexp( tmp[i], RegExpID ), i );
                
                return tmp;
            }
        },
        
        getStartEndMatchersFor = function(tokens, RegExpID) {
            var tmp, i, l, start, end, t1, t2;
            
            // build start/end mappings
            start=[]; end=[];
            tmp = make_array(tokens);
            if ( !is_array(tmp[0]) ) tmp = [tmp]; // array of arrays
            for (i=0, l=tmp.length; i<l; i++)
            {
                t1 = getMatcher( getRegexp( tmp[i][0], RegExpID ), i );
                t2 = (tmp[i].length>1) ? getMatcher( getRegexp( tmp[i][1], RegExpID ), i ) : t1;
                start.push( t1 );
                end.push( t2 );
            }
            return { start: start, end: end };
        },
        
        matchAny = function(stream, matchers, eat) {
            var i, l=matchers.length, m;
            for (i=0; i<l; i++)
            {
                // each one is a custom matcher in its own
                m = matchers[i](stream, eat);
                if (m) return m;
            }
            return false;
        },
        
        streamEat = function(stream, s) {
            stream.pos += s.length;
            return stream;
        }
    ;
