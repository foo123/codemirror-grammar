/**
*
*   classy.js
*   Object-Oriented mini-framework for JavaScript
*   @version: 0.2.1
*
*   https://github.com/foo123/classy.js
*
**/!function(t){"object"==typeof module&&module.exports?t(module.exports):"function"==typeof define&&define.amd?define(["exports"],function(e){t(e)}):t(this)}.call(this,function(t){if(!t.Classy){var e=Array.prototype.slice,o=(Array.prototype.splice,Array.prototype.concat,Object.prototype.hasOwnProperty),r=Object.prototype.toString,n=Object.defineProperties,_=Object.create||function(t,e){var o,r=function(){};return r.prototype=t,o=new r,o.__proto__=t,n&&"undefined"!=typeof e&&n(o,e),o},p=function(t){return t&&this.__class__&&this.__class__.__super__&&(t="constructor"==t?this.__class__.__super__:this.__class__.__super__.prototype[""+t])?t.apply(this,e.call(arguments,1)||[]):void 0},i=function(){var t,n,_,p,i,s,c,a=e.call(arguments);for(n=a.shift()||{},t=a.length,c=0;t>c;c++)if(_=a[c],_&&"object"==typeof _)for(s in _)o.call(_,s)&&(i=_[s],p=r.call(i),n[s]="number"==typeof i||i instanceof Number?0+i:i&&("[object Array]"==p||i instanceof Array||"string"==typeof i||i instanceof String)?i.slice(0):i);return n},s=function(t,e){t=t||Object,e=e||{};var o=e.constructor?e.constructor:function(){};return o.prototype=_(t.prototype),o.prototype=i(o.prototype,e),o.prototype.constructor=o.prototype.__class__=o,o.prototype.super__=p,o.__super__=t,o.__static__="object"==typeof t.__static__?i({},t.__static__):{},o},c=Mixin=i,a=function(){var t=e.call(arguments),o=t.length,r=null;if(o>=2){var n=t[0]||{},_=t[1]||{},p={},a=n.Extends||n.extends||Object,l=n.Implements||n.implements,u=n.Mixin||n.mixin;u&&u.prototype&&(p=Mixin(p,u.prototype)),l&&l.prototype&&(p=c(p,l.prototype)),r=s(a,i(p,_)),n.Static&&"object"==typeof n.Static&&(r.__static__=i(r.__static__,n.Static))}else r=s(Object,t[0]);return r};t.Classy={VERSION:"0.2.1",Class:a,Extends:s,Implements:c,Mixin:Mixin,Create:_,Merge:i}}});/**
*
*   A simple Regular Expression Analyzer
*   @version 0.2.3
*   https://github.com/foo123/regex-analyzer
*
**/!function(t){"object"==typeof module&&module.exports?t(module.exports):"function"==typeof define&&define.amd?define(["exports"],function(e){t(e)}):t(this)}.call(this,function(t){if(!t.RegExAnalyzer){var e="\\",r=/^\{\s*(\d+)\s*,?\s*(\d+)?\s*\}/,a=/^u([0-9a-fA-F]{4})/,p=/^x([0-9a-fA-F]{2})/,s={".":"MatchAnyChar","|":"MatchEither","?":"MatchZeroOrOne","*":"MatchZeroOrMore","+":"MatchOneOrMore","^":"MatchStart",$:"MatchEnd","{":"StartRepeats","}":"EndRepeats","(":"StartGroup",")":"EndGroup","[":"StartCharGroup","]":"EndCharGroup"},h={"\\":"EscapeChar","/":"/",0:"NULChar",f:"FormFeed",n:"LineFeed",r:"CarriageReturn",t:"HorizontalTab",v:"VerticalTab",b:"MatchWordBoundary",B:"MatchNonWordBoundary",s:"MatchSpaceChar",S:"MatchNonSpaceChar",w:"MatchWordChar",W:"MatchNonWordChar",d:"MatchDigitChar",D:"MatchNonDigitChar"},n=Object.prototype.toString,g=function(t,e){if(e&&(e instanceof Array||"[object Array]"==n.call(e)))for(var r=0,a=e.length;a>r;r++)t[e[r]]=1;else for(var r in e)t[r]=1;return t},i=function(t,e){t&&(t instanceof Array||"[object Array]"==n.call(t))&&(e=t[1],t=t[0]);var r,a,p=t.charCodeAt(0),s=e.charCodeAt(0);if(s==p)return[String.fromCharCode(p)];for(a=[],r=p;s>=r;++r)a.push(String.fromCharCode(r));return a},o=function(t){var e,r,a,p,s,h,n={},l={};if("Alternation"==t.type)for(a=0,p=t.part.length;p>a;a++)s=o(t.part[a]),n=g(n,s.peek),l=g(l,s.negativepeek);else if("Group"==t.type)s=o(t.part),n=g(n,s.peek),l=g(l,s.negativepeek);else if("Sequence"==t.type){for(a=0,p=t.part.length,r=t.part[a],h=a>=p||!r||"Quantifier"!=r.type||!r.flags.MatchZeroOrMore&&!r.flags.MatchZeroOrOne&&"0"!=r.flags.MatchMinimum;!h;)s=o(r.part),n=g(n,s.peek),l=g(l,s.negativepeek),a++,r=t.part[a],h=a>=p||!r||"Quantifier"!=r.type||!r.flags.MatchZeroOrMore&&!r.flags.MatchZeroOrOne&&"0"!=r.flags.MatchMinimum;p>a&&(r=t.part[a],"Special"!=r.type||"^"!=r.part&&"$"!=r.part||(r=t.part[a+1]||null),r&&"Quantifier"==r.type&&(r=r.part),r&&(s=o(r),n=g(n,s.peek),l=g(l,s.negativepeek)))}else if("CharGroup"==t.type)for(e=t.flags.NotMatch?l:n,a=0,p=t.part.length;p>a;a++)r=t.part[a],"Chars"==r.type?e=g(e,r.part):"CharRange"==r.type?e=g(e,i(r.part)):"UnicodeChar"==r.type||"HexChar"==r.type?e[r.flags.Char]=1:"Special"==r.type&&("D"==r.part?t.flags.NotMatch?n["\\d"]=1:l["\\d"]=1:"W"==r.part?t.flags.NotMatch?n["\\w"]=1:l["\\W"]=1:"S"==r.part?t.flags.NotMatch?n["\\s"]=1:l["\\s"]=1:e["\\"+r.part]=1);else"String"==t.type?n[t.part.charAt(0)]=1:"Special"!=t.type||t.flags.MatchStart||t.flags.MatchEnd?("UnicodeChar"==t.type||"HexChar"==t.type)&&(n[t.flags.Char]=1):"D"==t.part?l["\\d"]=1:"W"==t.part?l["\\W"]=1:"S"==t.part?l["\\s"]=1:n["\\"+t.part]=1;return{peek:n,negativepeek:l}},l=function(t,e){t&&this.setRegex(t,e)};l.VERSION="0.2.3",l.getCharRange=i,l.prototype={constructor:l,VERSION:l.VERSION,regex:null,groupIndex:null,pos:null,flags:null,parts:null,getCharRange:l.getCharRange,getPeekChars:function(){var t,e,r,a,p=this.flags&&this.flags.i,h=o(this.parts);for(t in h){a={},r=h[t];for(e in r)"\\d"==e?(delete r[e],a=g(a,i("0","9"))):"\\s"==e?(delete r[e],a=g(a,["\f","\n","\r","	",""," ","\u2028","\u2029"])):"\\w"==e?(delete r[e],a=g(a,["_"].concat(i("0","9")).concat(i("a","z")).concat(i("A","Z")))):"\\."==e?(delete r[e],a[s["."]]=1):"\\"!=e.charAt(0)&&p?(a[e.toLowerCase()]=1,a[e.toUpperCase()]=1):"\\"==e.charAt(0)&&delete r[e];h[t]=g(r,a)}return h},setRegex:function(t,e){if(t){this.flags={},e=e||"/";for(var r=t.toString(),a=r.length,p=r.charAt(a-1);e!=p;)this.flags[p]=1,r=r.substr(0,a-1),a=r.length,p=r.charAt(a-1);e==r.charAt(0)&&e==r.charAt(a-1)&&(r=r.substr(1,a-2)),this.regex=r}return this},analyze:function(){var t,n,g,i="",o=[],l=[],u=!1;for(this.pos=0,this.groupIndex=0;this.pos<this.regex.length;)t=this.regex.charAt(this.pos++),u=e==t?!0:!1,u&&(t=this.regex.charAt(this.pos++)),u?"u"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),g=a.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,l.push({part:g[0],flags:{Char:String.fromCharCode(parseInt(g[1],16)),Code:g[1]},type:"UnicodeChar"})):"x"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),g=p.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,l.push({part:g[0],flags:{Char:String.fromCharCode(parseInt(g[1],16)),Code:g[1]},type:"HexChar"})):h[t]&&"/"!=t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[h[t]]=1,l.push({part:t,flags:n,type:"Special"})):i+=t:"|"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),o.push({part:l,flags:{},type:"Sequence"}),l=[]):"["==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),l.push(this.chargroup())):"("==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),l.push(this.subgroup())):"{"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),g=r.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,l.push({part:l.pop(),flags:{part:g[0],MatchMinimum:g[1],MatchMaximum:g[2]||"unlimited"},type:"Quantifier"})):"*"==t||"+"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[s[t]]=1,"?"==this.regex.charAt(this.pos)?(n.isGreedy=0,this.pos++):n.isGreedy=1,l.push({part:l.pop(),flags:n,type:"Quantifier"})):"?"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[s[t]]=1,l.push({part:l.pop(),flags:n,type:"Quantifier"})):s[t]?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[s[t]]=1,l.push({part:t,flags:n,type:"Special"})):i+=t;return i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),o.length?(o.push({part:l,flags:{},type:"Sequence"}),l=[],n={},n[s["|"]]=1,this.parts={part:o,flags:n,type:"Alternation"}):this.parts={part:l,flags:{},type:"Sequence"},this},subgroup:function(){var t,n,g,i="",o=[],l=[],u={},f=!1,c=this.regex.substr(this.pos,2);for("?:"==c?(u.NotCaptured=1,this.pos+=2):"?="==c?(u.LookAhead=1,this.pos+=2):"?!"==c&&(u.NegativeLookAhead=1,this.pos+=2),u.GroupIndex=++this.groupIndex;this.pos<this.regex.length;)if(t=this.regex.charAt(this.pos++),f=e==t?!0:!1,f&&(t=this.regex.charAt(this.pos++)),f)"u"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),g=a.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,l.push({part:g[0],flags:{Char:String.fromCharCode(parseInt(g[1],16)),Code:g[1]},type:"UnicodeChar"})):"x"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),g=p.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,l.push({part:g[0],flags:{Char:String.fromCharCode(parseInt(g[1],16)),Code:g[1]},type:"HexChar"})):h[t]&&"/"!=t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[h[t]]=1,l.push({part:t,flags:n,type:"Special"})):i+=t;else{if(")"==t)return i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),o.length?(o.push({part:l,flags:{},type:"Sequence"}),l=[],n={},n[s["|"]]=1,{part:{part:o,flags:n,type:"Alternation"},flags:u,type:"Group"}):{part:{part:l,flags:{},type:"Sequence"},flags:u,type:"Group"};"|"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),o.push({part:l,flags:{},type:"Sequence"}),l=[]):"["==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),l.push(this.chargroup())):"("==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),l.push(this.subgroup())):"{"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),g=r.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,l.push({part:l.pop(),flags:{part:g[0],MatchMinimum:g[1],MatchMaximum:g[2]||"unlimited"},type:"Quantifier"})):"*"==t||"+"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[s[t]]=1,"?"==this.regex.charAt(this.pos)?(n.isGreedy=0,this.pos++):n.isGreedy=1,l.push({part:l.pop(),flags:n,type:"Quantifier"})):"?"==t?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[s[t]]=1,l.push({part:l.pop(),flags:n,type:"Quantifier"})):s[t]?(i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),n={},n[s[t]]=1,l.push({part:t,flags:n,type:"Special"})):i+=t}return i.length&&(l.push({part:i,flags:{},type:"String"}),i=""),o.length?(o.push({part:l,flags:{},type:"Sequence"}),l=[],n={},n[s["|"]]=1,{part:{part:o,flags:n,type:"Alternation"},flags:u,type:"Group"}):{part:{part:l,flags:{},type:"Sequence"},flags:u,type:"Group"}},chargroup:function(){var t,r,s,n,g,i,o=[],l=[],u={},f=!1,c=!1;for("^"==this.regex.charAt(this.pos)&&(u.NotMatch=1,this.pos++);this.pos<this.regex.length;)if(i=!1,s=r,r=this.regex.charAt(this.pos++),c=e==r?!0:!1,c&&(r=this.regex.charAt(this.pos++)),c&&("u"==r?(g=a.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,r=String.fromCharCode(parseInt(g[1],16)),i=!0):"x"==r&&(g=p.exec(this.regex.substr(this.pos-1)),this.pos+=g[0].length-1,r=String.fromCharCode(parseInt(g[1],16)),i=!0)),f)l.length&&(o.push({part:l,flags:{},type:"Chars"}),l=[]),n[1]=r,f=!1,o.push({part:n,flags:{},type:"CharRange"});else if(c)!i&&h[r]&&"/"!=r?(l.length&&(o.push({part:l,flags:{},type:"Chars"}),l=[]),t={},t[h[r]]=1,o.push({part:r,flags:t,type:"Special"})):l.push(r);else{if("]"==r)return l.length&&(o.push({part:l,flags:{},type:"Chars"}),l=[]),{part:o,flags:u,type:"CharGroup"};"-"==r?(n=[s,""],l.pop(),f=!0):l.push(r)}return l.length&&(o.push({part:l,flags:{},type:"Chars"}),l=[]),{part:o,flags:u,type:"CharGroup"}}},t.RegExAnalyzer=l}});/**
*
*   CodeMirrorGrammar
*   @version: 0.4.2
*   Transform a grammar specification in JSON format,
*   into a CodeMirror syntax-highlight parser mode
*
*   https://github.com/foo123/codemirror-grammar
*
**/
!function (dependencies, root, moduleName, moduleDefinition) {

    //
    // export the module
    
    // node, CommonJS, etc..
    if ( 'object' == typeof(module) && module.exports ) module.exports = moduleDefinition;
    
    // AMD, etc..
    else if ( 'function' == typeof(define) && define.amd ) define( moduleDefinition );
    
    // browser, etc..
    else 
    {
        if (dependencies && dependencies.length)
        {
            for (var i=0, l=dependencies.length; i<l; i++)
                dependencies[i] = root[ dependencies[i] ];
            root[ moduleName ] = moduleDefinition.apply({}, dependencies);
        }
        else
        {
            root[ moduleName ] = moduleDefinition();
        }
    }


}( ["Classy", "RegExAnalyzer"], this, 'CodeMirrorGrammar', function( Classy, RegexAnalyzer, undef ) {
    
    var VERSION = "0.4.2";
    var Class = Classy.Class;
        
    //
    // parser types
    var    
        DEFAULTTYPE,
        
        //
        // javascript variable types
        T_NUM = 2,
        T_BOOL = 4,
        T_STR = 8,
        T_CHAR= 9,
        T_REGEX = 16,
        T_ARRAY = 32,
        T_OBJ = 64,
        T_NULL = 128,
        T_UNDEF = 256,
        T_UNKNOWN = 512,
        
        //
        // matcher types
        T_SIMPLEMATCHER = 32,
        T_CHARMATCHER = 33,
        T_STRMATCHER = 34,
        T_REGEXMATCHER = 36,
        T_EOLMATCHER = 40,
        T_DUMMYMATCHER = 48,
        T_COMPOSITEMATCHER = 64,
        T_BLOCKMATCHER = 128,
        
        //
        // token types
        T_OPTIONAL = 1,
        T_REQUIRED = 2,
        T_ERROR = 4,
        T_DEFAULT = 8,
        T_SIMPLE = 16,
        T_ESCBLOCK = 32,
        T_BLOCK = 64,
        T_EITHER = 128,
        T_ALL = 256,
        T_ZEROORONE = 512,
        T_ZEROORMORE = 1024,
        T_ONEORMORE = 2048,
        T_GROUP = 4096,
        T_NGRAM = 8192,
        
        //
        // tokenizer types
        groupTypes = {
            "ONEOF" : T_EITHER, "EITHER" : T_EITHER, "ALL" : T_ALL, "ALLOF" : T_ALL, "ZEROORONE" : T_ZEROORONE, "ZEROORMORE" : T_ZEROORMORE, "ONEORMORE" : T_ONEORMORE
        },
        
        tokenTypes = {
            "BLOCK" : T_BLOCK, "ESCAPED-BLOCK" : T_ESCBLOCK, "SIMPLE" : T_SIMPLE, "GROUP" : T_GROUP, "NGRAM" : T_NGRAM, "N-GRAM" : T_NGRAM
        }
    ;
    
    var slice = Array.prototype.slice, splice = Array.prototype.splice, concat = Array.prototype.concat, 
        hasKey = Object.prototype.hasOwnProperty, Str = Object.prototype.toString,
        
        get_type = function(v) {
            var type_of = typeof(v), to_string = Str.call(v);
            
            if ('number' == type_of || v instanceof Number)  return T_NUM;
            
            else if (true === v || false === v)  return T_BOOL;
            
            else if (v && ('string' == type_of || v instanceof String))  return (1 == v.length) ? T_CHAR : T_STR;
            
            else if (v && ("[object RegExp]" == to_string || v instanceof RegExp))  return T_REGEX;
            
            else if (v && ("[object Array]" == to_string || v instanceof Array))  return T_ARRAY;
            
            else if (v && "[object Object]" == to_string)  return T_OBJ;
            
            else if (null === v)  return T_NULL;
            
            else if (undef === v)  return T_UNDEF;
            
            // unkown type
            return T_UNKNOWN;
        },
        
        make_array = function(a, force) {
            return ( force || T_ARRAY != get_type( a ) ) ? [ a ] : a;
        },
        
        make_array_2 = function(a, force) {
            a = make_array( a, force );
            if ( force || T_ARRAY != get_type( a[0] ) ) a = [ a ]; // array of arrays
            return a;
        },
        
        clone = function(o) {
            var T = get_type( o ), T2;
            
            if (T_OBJ != T && T_ARRAY != T) return o;
            
            var co = {}, k;
            for (k in o) 
            {
                if ( hasKey.call(o, k) ) 
                { 
                    T2 = get_type( o[k] );
                    
                    if (T_OBJ == T2)  co[k] = clone(o[k]);
                    
                    else if (T_ARRAY == T2)  co[k] = o[k].slice();
                    
                    else  co[k] = o[k]; 
                }
            }
            return co;
        },
        
        extend = function() {
            var args = slice.call(arguments), argslen = args.length;
            
            if ( argslen<1 ) return null;
            else if ( argslen<2 ) return clone( args[0] );
            
            var o1 = args.shift(), o2, o = clone(o1), i, k, T; 
            argslen--;            
            
            for (i=0; i<argslen; i++)
            {
                o2 = args.shift();
                if ( !o2 ) continue;
                
                for (k in o2) 
                { 
                    if ( hasKey.call(o2, k) )
                    {
                        if ( hasKey.call(o1, k) ) 
                        { 
                            T = get_type( o1[k] );
                            
                            if ( (T_OBJ & ~T_STR) & T)  o[k] = extend( o1[k], o2[k] );
                            
                            //else if (T_ARRAY == T)  o[k] = o1[k].slice();
                            
                            //else  o[k] = o1[k];
                        }
                        else
                        {
                            o[k] = clone( o2[k] );
                        }
                    }
                }
            }
            return o;
        }
    ;
    
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
        
        DummyMatcher = Class({
            
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
        
        CharMatcher = Class({Extends: DummyMatcher}, {
            
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
        
        StrMatcher = Class({Extends: DummyMatcher}, {
            
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
        
        RegexMatcher = Class({Extends: DummyMatcher}, {
            
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
        
        EolMatcher = Class({Extends: DummyMatcher}, {
            
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
        
        CompositeMatcher = Class({Extends: DummyMatcher}, {
            
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
        
        BlockMatcher = Class({Extends: DummyMatcher}, {
            
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
    
    //
    // tokenizer factories
    var
        StateContext = Class({
            
            constructor: function( id ) {
                this.id = id || 0;
                this.stack = [];
                this.inBlock = null;
                this.endBlock = null;
                this.currentToken = T_DEFAULT;
            },
            
            id: 0,
            stack: null,
            inBlock: null,
            endBlock: null,
            currentToken: null,
            
            clone: function() {
                var copy = new this.__class__();
                copy.id = this.id;
                copy.stack = this.stack.slice();
                copy.inBlock = this.inBlock;
                copy.endBlock = this.endBlock;
                copy.currentToken = this.currentToken;
                return copy;
            },
            
            toString: function() {
                return "_" + this.id + "_" + (this.inBlock);
            }
        }),
        
        SimpleTokenizer = Class({
            
            constructor : function(name, token, type, style) {
                if (name) this.name = name;
                if (token) this.token = token;
                if (type) this.type = type;
                if (style) this.style = style;
                this.tokenName = this.name;
            },
            
            name : null,
            token : null,
            tokenName : null,
            type : null,
            style : null,
            isRequired : false,
            ERROR : false,
            streamPos : null,
            stackPos : null,
            actionBefore : null,
            actionAfter : null,
            
            toString : function() {
                var s = '[';
                s += 'Tokenizer: ' + this.name;
                s += ', Type: ' + this.type;
                s += ', Token: ' + ((this.token) ? this.token.toString() : null);
                s += ']';
                return s;
            },
            
            required : function(bool) { 
                this.isRequired = (bool) ? true : false;
                return this;
            },
            
            pushToken : function(stack, token, i) {
                if ( this.stackPos )
                    stack.splice( this.stackPos+(i||0), 0, token );
                else
                    stack.push( token );
                return this;
            },
            
            clone : function(/* variable args here.. */) {
                
                var t, i, args = slice.call(arguments), argslen = args.length;
                
                t = new this.__class__();
                t.name = this.name;
                t.tokenName = this.tokenName;
                t.token = this.token;
                t.type = this.type;
                t.style = this.style;
                t.isRequired = this.isRequired;
                t.ERROR = this.ERROR;
                t.streamPos = this.streamPos;
                t.stackPos = this.stackPos;
                t.actionBefore = this.actionBefore;
                t.actionAfter = this.actionAfter;
                
                for (i=0; i<argslen; i++)   
                    t[ args[i] ] = this[ args[i] ];
                
                return t;
            },
            
            tokenize : function( stream, state, LOCALS ) {
                
                if ( this.token.match(stream) )
                {
                    state.currentToken = this.type;
                    return this.style;
                }
                return false;
            }
        }),
        
        BlockTokenizer = Class({Extends: SimpleTokenizer}, {
            
            constructor : function(name, token, type, style, multiline) {
                if (name) this.name = name;
                if (token) this.token = token;
                if (type) this.type = type;
                if (style) this.style = style;
                this.multiline = (false!==multiline);
                this.endBlock = null;
                this.tokenName = this.name;
            },    
            
            multiline : false,
            endBlock : null,
            
            tokenize : function( stream, state, LOCALS ) {
            
                var ended = false, found = false;
                
                if ( state.inBlock == this.name )
                {
                    found = true;
                    this.endBlock = state.endBlock;
                }    
                else if ( !state.inBlock && (this.endBlock = this.token.match(stream)) )
                {
                    found = true;
                    state.inBlock = this.name;
                    state.endBlock = this.endBlock;
                }    
                
                if ( found )
                {
                    this.stackPos = state.stack.length;
                    ended = this.endBlock.match(stream);
                    
                    while ( !ended && !stream.eol() ) 
                    {
                        if ( this.endBlock.match(stream) ) 
                        {
                            ended = true;
                            break;
                        }
                        else  
                        {
                            stream.next();
                        }
                    }
                    
                    ended = ( ended || ( !this.multiline && stream.eol() ) );
                    
                    if ( !ended )
                    {
                        this.pushToken( state.stack, this );
                    }
                    else
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    
                    state.currentToken = this.type;
                    return this.style;
                }
                
                state.inBlock = null;
                state.endBlock = null;
                return false;
            }
        }),
                
        EscBlockTokenizer = Class({Extends: BlockTokenizer}, {
            
            constructor : function(name, token, type, style, escape, multiline) {
                if (name) this.name = name;
                if (token) this.token = token;
                if (type) this.type = type;
                if (style) this.style = style;
                this.escape = escape || "\\";
                this.multiline = multiline || false;
                this.endBlock = null;
                this.tokenName = this.name;
            },    
            
            escape : "\\",
            
            tokenize : function( stream, state, LOCALS ) {
            
                var next = "", ended = false, found = false, isEscaped = false;
                
                if ( state.inBlock == this.name )
                {
                    found = true;
                    this.endBlock = state.endBlock;
                }    
                else if ( !state.inBlock && (this.endBlock = this.token.match(stream)) )
                {
                    found = true;
                    state.inBlock = this.name;
                    state.endBlock = this.endBlock;
                }    
                
                if ( found )
                {
                    this.stackPos = state.stack.length;
                    ended = this.endBlock.match(stream);
                    
                    while ( !ended && !stream.eol() ) 
                    {
                        if ( !isEscaped && this.endBlock.match(stream) ) 
                        {
                            ended = true; 
                            break;
                        }
                        else  
                        {
                            next = stream.next();
                        }
                        isEscaped = !isEscaped && next == this.escape;
                    }
                    
                    ended = ended || !(isEscaped && this.multiline);
                    
                    if ( !ended )
                    {
                        this.pushToken( state.stack, this );
                    }
                    else
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    
                    state.currentToken = this.type;
                    return this.style;
                }
                
                state.inBlock = null;
                state.endBlock = null;
                return false;
            }
        }),
                
        CompositeTokenizer = Class({Extends: SimpleTokenizer}, {
            
            constructor : function(name, type) {
                if (name) this.name = name;
                if (type) this.type = type;
                this.tokenName = this.name;
            },
            
            tokens : null,
            
            buildTokens : function( tokens ) {
                if ( tokens )
                {
                    this.tokens = make_array( tokens );
                    this.token = this.tokens[0];
                }
                return this;
            }
        }),
        
        ZeroOrOneTokens = Class({Extends: CompositeTokenizer}, {
                
            constructor : function( name, tokens ) {
                this.type = T_ZEROORONE;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
                this.tokenName = this.name;
            },
            
            tokenize : function( stream, state, LOCALS ) {
                
                // this is optional
                this.isRequired = false;
                this.ERROR = false;
                this.streamPos = stream.pos;
                var style = this.token.tokenize(stream, state);
                
                if ( token.ERROR ) stream.backTo( this.streamPos );
                
                return style;
            }
        }),
        
        ZeroOrMoreTokens = Class({Extends: CompositeTokenizer}, {
                
            constructor : function( name, tokens ) {
                this.type = T_ZEROORMORE;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
                this.tokenName = this.name;
            },
            
            tokenize : function( stream, state, LOCALS ) {
            
                var i, token, style, n = this.tokens.length, tokensErr = 0, ret = false;
                
                // this is optional
                this.isRequired = false;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                for (i=0; i<n; i++)
                {
                    token = this.tokens[i];
                    style = token.tokenize(stream, state, LOCALS);
                    
                    if ( false !== style )
                    {
                        // push it to the stack for more
                        this.pushToken( state.stack, this );
                        return style;
                    }
                    else if ( token.ERROR )
                    {
                        tokensErr++;
                        stream.backTo( this.streamPos );
                    }
                }
                
                //this.ERROR = (n == tokensErr) ? true : false;
                return false;
            }
        }),
        
        OneOrMoreTokens = Class({Extends: CompositeTokenizer}, {
                
            constructor : function( name, tokens ) {
                this.type = T_ONEORMORE;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
                this.foundOne = false;
                this.tokenName = this.name;
            },
            
            foundOne : false,
            
            tokenize : function( stream, state, LOCALS ) {
        
                var style, token, i, n = this.tokens.length, tokensRequired = 0, tokensErr = 0;
                
                this.isRequired = !this.foundOne;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                for (i=0; i<n; i++)
                {
                    token = this.tokens[i];
                    style = token.tokenize(stream, state, LOCALS);
                    
                    tokensRequired += (token.isRequired) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        this.foundOne = true;
                        this.isRequired = false;
                        this.ERROR = false;
                        // push it to the stack for more
                        this.pushToken( state.stack, this.clone("tokens", "foundOne") );
                        this.foundOne = false;
                        
                        return style;
                    }
                    else if ( token.ERROR )
                    {
                        tokensErr++;
                        stream.backTo( this.streamPos );
                    }
                }
                
                this.ERROR = (!this.foundOne /*|| n == tokensErr*/) ? true : false;
                return false;
            }
        }),
        
        EitherTokens = Class({Extends: CompositeTokenizer}, {
                
            constructor : function( name, tokens ) {
                this.type = T_EITHER;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
                this.tokenName = this.name;
            },
            
            tokenize : function( stream, state, LOCALS ) {
            
                var style, token, i, n = this.tokens.length, tokensRequired = 0, tokensErr = 0;
                
                this.isRequired = true;
                this.ERROR = false;
                this.streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = this.tokens[i];
                    style = token.tokenize(stream, state, LOCALS);
                    
                    tokensRequired += (token.isRequired) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        return style;
                    }
                    else if ( token.ERROR )
                    {
                        tokensErr++;
                        stream.backTo( this.streamPos );
                    }
                }
                
                this.isRequired = (tokensRequired > 0) ? true : false;
                this.ERROR = (n == tokensErr && tokensRequired > 0) ? true : false;
                return false;
            }
        }),
                
        AllTokens = Class({Extends: CompositeTokenizer}, {
                
            constructor : function( name, tokens ) {
                this.type = T_ALL;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
                this.tokenName = this.name;
            },
            
            tokenize : function( stream, state, LOCALS ) {
                
                var token, style, n = this.tokens.length, ret = false;
                
                this.isRequired = true;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                
                token = this.tokens[ 0 ];
                style = token.required(true).tokenize(stream, state, LOCALS);
                
                if ( false !== style )
                {
                    this.stackPos = state.stack.length;
                    for (var i=n-1; i>0; i--)
                        this.pushToken( state.stack, this.tokens[i].required(true), n-i );
                    
                    ret = style;
                    
                }
                else if ( token.ERROR )
                {
                    this.ERROR = true;
                    stream.backTo( this.streamPos );
                }
                else if ( token.isRequired )
                {
                    this.ERROR = true;
                }
                
                return ret;
            }
        }),
                
        NGramTokenizer = Class({Extends: CompositeTokenizer}, {
                
            constructor : function( name, tokens ) {
                this.type = T_NGRAM;
                if (name) this.name = name;
                if (tokens) this.buildTokens( tokens );
                this.tokenName = this.tokens[0].name;
            },
            
            tokenize : function( stream, state, LOCALS ) {
                
                var token, style, n = this.tokens.length, ret = false;
                
                this.isRequired = false;
                this.ERROR = false;
                this.streamPos = stream.pos;
                this.stackPos = state.stack.length;
                
                
                token = this.tokens[ 0 ];
                style = token.required(false).tokenize(stream, state, LOCALS);
                
                if ( false !== style )
                {
                    this.stackPos = state.stack.length;
                    for (var i=n-1; i>0; i--)
                        this.pushToken( state.stack, this.tokens[i].required(true), n-i );
                    
                    ret = style;
                }
                else if ( token.ERROR )
                {
                    //this.ERROR = true;
                    stream.backTo( this.streamPos );
                }
                
                return ret;
            }
        }),
                
        getTokenizer = function(tokenID, RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens) {
            
            var tok, token = null, type, matchType, tokens, action;
            
            if ( !parsedTokens[ tokenID ] )
            {
                tok = Lex[ tokenID ] || Syntax[ tokenID ] || null;
                
                if ( tok )
                {
                    type = tok.type || "simple";
                    type = tokenTypes[ type.toUpperCase() ];
                    action = tok.action || null;
                    
                    if ( T_BLOCK == type )
                    {
                        token = new BlockTokenizer( 
                                    tokenID,
                                    getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, parsedRegexes, parsedMatchers ), 
                                    type, 
                                    Style[ tokenID ] || DEFAULTTYPE,
                                    tok.multiline
                                );
                    }
                    
                    else if ( T_ESCBLOCK == type )
                    {
                        token = new EscBlockTokenizer( 
                                    tokenID,
                                    getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, parsedRegexes, parsedMatchers ), 
                                    type, 
                                    Style[ tokenID ] || DEFAULTTYPE,
                                    tok.escape || "\\",
                                    tok.multiline || false
                                );
                    }
                    
                    else if ( T_SIMPLE == type )
                    {
                        token = new SimpleTokenizer( 
                                    tokenID,
                                    getCompositeMatcher( tokenID, tok.tokens.slice(), RegExpID, RegExpGroups[ tokenID ], parsedRegexes, parsedMatchers ), 
                                    type, 
                                    Style[ tokenID ] || DEFAULTTYPE
                                );
                    }
                    
                    else if ( T_GROUP == type )
                    {
                        matchType = groupTypes[ tok.match.toUpperCase() ]; 
                        tokens = make_array( tok.tokens ).slice();
                        
                        for (var i=0, l=tokens.length; i<l; i++)
                            tokens[i] = getTokenizer(tokens[i], RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens);
                        
                        if (T_ZEROORONE == matchType) 
                            token = new ZeroOrOneTokens(tokenID, tokens);
                        
                        else if (T_ZEROORMORE == matchType) 
                            token = new ZeroOrMoreTokens(tokenID, tokens);
                        
                        else if (T_ONEORMORE == matchType) 
                            token = new OneOrMoreTokens(tokenID, tokens);
                        
                        else if (T_EITHER == matchType) 
                            token = new EitherTokens(tokenID, tokens);
                        
                        else //if (T_ALL == matchType)
                            token = new AllTokens(tokenID, tokens);
                    }
                    
                    else if ( T_NGRAM == type )
                    {
                        // get n-gram tokenizer
                        token = make_array_2( make_array( tok.tokens ).slice() ).slice(); // array of arrays
                        
                        for (var i=0, l=token.length; i<l; i++)
                        {
                            // get tokenizers for each ngram part
                            var ngram = token[i];
                            
                            for (var j=0, l2=ngram.length; j<l2; j++)
                                ngram[j] = getTokenizer( ngram[j], RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens );
                            
                            // get a tokenizer for whole ngram
                            token[i] = new NGramTokenizer( tokenID + '_NGRAM_' + i, ngram );
                        }
                    }
                }
                parsedTokens[ tokenID ] = token;
            }
            
            return parsedTokens[ tokenID ];
        }
    ;
      
    //
    // parser factories
    var
        Parser = Class({
            
            constructor: function(grammar, LOCALS) {
                this.LOCALS = LOCALS;
                this.Style = grammar.Style || {};
                this.tokens = grammar.Parser || [];
            },
            
            LOCALS: null,
            Style: null,
            tokens: null,
            
            // Codemirror Tokenizer compatible
            getToken: function(_stream, state) {
                
                var i,
                    tokenizer, type, numTokens = this.tokens.length, 
                    stream, stack
                ;
                
                
                var DEFAULT = this.LOCALS.DEFAULT;
                var ERROR = this.Style.error || "error";
                
                stack = state.stack;
                stream = new StringStream(null, _stream);
                
                if ( stream.eatSpace() ) 
                {
                    state.currentToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                while ( stack.length )
                {
                    tokenizer = stack.pop();
                    type = tokenizer.tokenize(stream, state, this.LOCALS);
                    
                    // match failed
                    if ( false === type )
                    {
                        // error
                        if ( tokenizer.ERROR || tokenizer.isRequired )
                        {
                            // empty the stack
                            stack.length = 0;
                            // skip this character
                            stream.next();
                            // generate error
                            state.currentToken = T_ERROR;
                            return ERROR;
                        }
                        // optional
                        else
                        {
                            continue;
                        }
                    }
                    // found token
                    else
                    {
                        return type;
                    }
                }
                
                for (i=0; i<numTokens; i++)
                {
                    tokenizer = this.tokens[i];
                    type = tokenizer.tokenize(stream, state, this.LOCALS);
                    
                    // match failed
                    if ( false === type )
                    {
                        // error
                        if ( tokenizer.ERROR || tokenizer.isRequired )
                        {
                            // empty the stack
                            stack.length = 0;
                            // skip this character
                            stream.next();
                            // generate error
                            state.currentToken = T_ERROR;
                            return ERROR;
                        }
                        // optional
                        else
                        {
                            continue;
                        }
                    }
                    // found token
                    else
                    {
                        return type;
                    }
                }
                
                // unknown, bypass
                stream.next();
                state.currentToken = T_DEFAULT;
                return DEFAULT;
            }
        }),
        
        getParser = function(grammar, LOCALS) {
            return new Parser(grammar, LOCALS);
        },
        
        getIndentation = function(LOCALS) {
            return function(state, textAfter, fullLine) {
                return CodeMirror.Pass;
            };
        }
    ;
      
    var 
        //
        // default grammar settings
        defaultGrammar = {
            
            // prefix ID for regular expressions used in the grammar
            "RegExpID" : null,
            
            // lists of (simple/string) tokens to be grouped into one regular expression,
            // else matched one by one, 
            // this is usefull for speed fine-tuning the parser
            "RegExpGroups" : null,
            
            //
            // Style model
            "Style" : {
                
                // lang token type  -> CodeMirror (style) tag
                "error":                "error"
            },

            //
            // Lexical model
            "Lex" : null,
            
            //
            // Syntax model and context-specific rules
            "Syntax" : null,
            
            // what to parse and in what order
            "Parser" : null
        },
        
        parse = function(grammar) {
            var RegExpID, RegExpGroups, tokens, numTokens, _tokens, 
                Style, Lex, Syntax, t, tokenID, token, tok,
                parsedRegexes = {}, parsedMatchers = {}, parsedTokens = {};
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if ( grammar.__parsed )  return grammar;
            
            grammar = extend(grammar, defaultGrammar);
            
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            
            RegExpGroups = grammar.RegExpGroups || {};
            grammar.RegExpGroups = null;
            delete grammar.RegExpGroups;
            
            Lex = grammar.Lex || {};
            grammar.Lex = null;
            delete grammar.Lex;
            
            Syntax = grammar.Syntax || {};
            grammar.Syntax = null;
            delete grammar.Syntax;
            
            Style = grammar.Style || {};
            
            _tokens = grammar.Parser || [];
            numTokens = _tokens.length;
            tokens = [];
            
            
            // build tokens
            for (t=0; t<numTokens; t++)
            {
                tokenID = _tokens[ t ];
                
                token = getTokenizer( tokenID, RegExpID, RegExpGroups, Lex, Syntax, Style, parsedRegexes, parsedMatchers, parsedTokens ) || null;
                
                if ( token )
                {
                    if ( T_ARRAY == get_type( token ) )
                        tokens = tokens.concat( token );
                    
                    else
                        tokens.push( token );
                }
            }
            
            grammar.Parser = tokens;
            grammar.Style = Style;
            
            // this grammar is parsed
            grammar.__parsed = true;
            
            return grammar;
        }
    ;
    
    //
    //  CodeMirror Grammar main class
    /**[DOC_MARKDOWN]
    *
    * ###CodeMirrorGrammar Methods
    *
    * __For node with dependencies:__
    *
    * ```javascript
    * CodeMirrorGrammar = require('build/codemirror_grammar.js')(require('build/classy.min.js'), require('build/regexanalyzer.min.js'));
    * ```
    *
    * __For browser with dependencies:__
    *
    * ```html
    * <script src="../build/classy.min.js"></script>
    * <script src="../build/regexanalyzer.min.js"></script>
    * <script src="../build/codemirror_grammar.js"></script>
    * ```
    *
    [/DOC_MARKDOWN]**/
    var self = {
        
        VERSION : VERSION,
        
        // extend a grammar using another base grammar
        /**[DOC_MARKDOWN]
        * __Method__: *extend*
        *
        * ```javascript
        * extendedgrammar = CodeMirrorGrammar.extend(grammar, basegrammar1 [, basegrammar2, ..]);
        * ```
        *
        * Extend a grammar with basegrammar1, basegrammar2, etc..
        *
        * This way arbitrary dialects and variations can be handled more easily
        [/DOC_MARKDOWN]**/
        extend : extend,
        
        // parse a grammar
        /**[DOC_MARKDOWN]
        * __Method__: *parse*
        *
        * ```javascript
        * parsedgrammar = CodeMirrorGrammar.parse(grammar);
        * ```
        *
        * This is used internally by the CodeMirrorGrammar Class
        * In order to parse a JSON grammar to a form suitable to be used by the syntax-highlight parser.
        * However user can use this method to cache a parsedgrammar to be used later.
        * Already parsed grammars are NOT re-parsed when passed through the parse method again
        [/DOC_MARKDOWN]**/
        parse : parse,
        
        // get a codemirror syntax-highlight mode from a grammar
        /**[DOC_MARKDOWN]
        * __Method__: *getMode*
        *
        * ```javascript
        * mode = CodeMirrorGrammar.getMode(grammar [, DEFAULT]);
        * ```
        *
        * This is the main method which transforms a JSON grammar into a CodeMirror syntax-highlight parser.
        * DEFAULT is the default return value (null by default) for things that are skipped or not styled
        * In general there is no need to set this value, unlees you need to return something else
        [/DOC_MARKDOWN]**/
        getMode : function(grammar, DEFAULT) {
            
            DEFAULTTYPE = null;
            
            // build the grammar
            grammar = parse( grammar );
            
            //console.log(grammar);
            
            var 
                LOCALS = { 
                    // default return code, when no match or empty found
                    // 'null' should be used in most cases
                    DEFAULT: DEFAULT || DEFAULTTYPE
                }
            ;
            
            var parser = getParser( grammar, LOCALS );
            var mode = function(conf, parserConf) {
                
                LOCALS.conf = conf;
                LOCALS.parserConf = parserConf;
                
                // return the (codemirror) parser mode for the grammar
                return  {
                    startState: function( ) { return new StateContext(); },
                    
                    electricChars: (grammar.electricChars) ? grammar.electricChars : false,
                    
                    /*
                    // maybe needed in the future
                    
                    blankLine: function( state ) { },
                    
                    innerMode: function( state ) { },
                    */
                    
                    copyState: function( state ) { return state.clone(); },
                    
                    token: function( parser ) { return function(stream, state) { return parser.getToken(stream, state); } }( parser ),
                    
                    indent: getIndentation( LOCALS )
                };
                
            };
            
            // Codemirror compatible
            return mode;
        }
    };
    
    // export it
    return self;
});