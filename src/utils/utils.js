    
    // IE8- mostly
    if ( !Array.prototype.indexOf ) 
    {
        var Abs = Math.abs;
        
        Array.prototype.indexOf = function (searchElement , fromIndex) {
            var i,
                pivot = (fromIndex) ? fromIndex : 0,
                length;

            if ( !this ) 
            {
                throw new TypeError();
            }

            length = this.length;

            if (length === 0 || pivot >= length)
            {
                return -1;
            }

            if (pivot < 0) 
            {
                pivot = length - Abs(pivot);
            }

            for (i = pivot; i < length; i++) 
            {
                if (this[i] === searchElement) 
                {
                    return i;
                }
            }
            return -1;
        };
    }
    
    var ESC = /([\-\.\*\+\?\^\$\{\}\(\)\|\[\]\/\\])/g,
    
        slice = Array.prototype.slice, 
        
        hasKey = Object.prototype.hasOwnProperty,
        
        Str = Object.prototype.toString,

        is_number = function(n) {
            return ('number'==typeof(n) || n instanceof Number);
        },
        
        is_string = function(s) {
            return (s && ('string'==typeof(s) || s instanceof String));
        },
        
        is_array = function(a) {
            return (a && "[object Array]"==Str.call(a));
        },
        
        is_object = function(o) {
            return (o && "[object Object]"==Str.call(o));
        },
        
        make_array = function(a) {
            return (is_array(a)) ? a : [a];
        },
        
        clone = function(o) {
            if (!is_object(o) && !is_array(o)) return o;
            
            var co = {};
            for (var k in o) 
            {
                if (hasKey.call(o, k)) 
                { 
                    if (is_object(o[k]))
                        co[k] = clone(o[k]);
                    else if (is_array(o[k]))
                        co[k] = o[k].slice();
                    else
                        co[k] = o[k]; 
                }
            }
            return co;
        },
        
        extend = function(o1, o2) {
            if (!is_object(o2) && !is_array(o2)) return clone(o1);
            
            var o = {}; 
            for (var k in o2) 
            { 
                if (hasKey.call(o2, k))
                {
                    if (hasKey.call(o1, k)) 
                    { 
                        if (is_object(o1[k]) && !is_string(o1[k]))
                        {
                            o[k] = extend(o1[k], o2[k]);
                        }
                        else if (is_array(o1[k]))
                        {
                            o[k] = o1[k].slice();
                        }
                        else
                        {
                            o[k] = o1[k];
                        }
                    }
                    else
                    {
                        o[k] = clone(o2[k]);
                    }
                }
            }
            return o;
        },
        
        getRegexp = function(rstr, rxid)  {
            if ( is_number(rstr) ) return rstr;
            
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
        
        streamMatchAny = function(stream, rs, eat) {
            eat = (undef===eat) ? true : eat;
            var i, l=rs.length;
            for (i=0; i<l; i++)
                if (stream.match(rs[i], eat)) return true;
            return false;
        },
        
        streamGetMatchAny = function(stream, rs, eat) {
            eat = (undef===eat) ? true : eat;
            var i, l=rs.length, m;
            for (i=0; i<l; i++)
            {
                m = stream.match(rs[i], eat);
                if (m) return is_string( rs[i] ) ? rs[i] : m;
            }
            return false;
        },
        
        streamGetMatchAnyWithKey = function(stream, rs, eat) {
            eat = (undef===eat) ? true : eat;
            var i, l=rs.length, m;
            for (i=0; i<l; i++)
            {
                m = stream.match(rs[i], eat);
                if (m) return { key: i, val: (is_string( rs[i] ) ? rs[i] : m) };
            }
            return false;
        }
    ;
