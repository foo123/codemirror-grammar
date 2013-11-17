    
    var slice = Array.prototype.slice, 
        
        hasKey = Object.prototype.hasOwnProperty,
        
        Str = Object.prototype.toString,

        is_ = function(v, t) {
            return (t === v);
        },
        
        is_number = function(n) {
            return ('number'==typeof(n) || n instanceof Number);
        },
        
        is_bool = function(b) {
            return (true === b || false === b);
        },
        
        is_char = function(c) {
            return (c && ('string'==typeof(c) || c instanceof String) && 1 == c.length);
        },
        
        is_string = function(s) {
            return (s && ('string'==typeof(s) || s instanceof String));
        },
        
        is_regex = function(r) {
            return (r && ("[object RegExp]"==Str.call(r) || r instanceof RegExp));
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
        }
    ;
