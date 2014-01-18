/**
*
*   Classy
*   @version: 0.4.4
*
*   Object-Oriented mini-framework for JavaScript
*   https://github.com/foo123/classy.js
*
**/!function(e,t,n,r,l){var o="undefined"!=typeof global&&"[object global]"=={}.toString.call(global)?1:0,a=o||"undefined"==typeof navigator?0:1,i="function"==typeof importScripts&&navigator instanceof WorkerNavigator?1:0,c=Array,u=c.prototype,f=function(){var e=null;if(o)return e=__filename,{path:__dirname,file:__filename};if(i)e=self.location.href;else if(a){var t;(t=document.getElementsByTagName("script"))&&t.length&&(e=t[t.length-1].src)}return e?{path:e.split("/").slice(0,-1).join("/"),file:e}:{path:null,file:null}},p=f(),s=function(e,t){if(o)return t;if("."==t.charAt(0)){e=e.split("/"),t=t.split("/");var n,r=0,l=0,a=t.length,i=e.length;for(n=0;a>n;n++)if(/^\.\./.test(t[n]))r++,l++;else{if(!/^\./.test(t[n]))break;l++}r=r>=i?0:i-r,t=e.slice(0,r).concat(t.slice(l)).join("/")}return t};n=n?[].concat(n):[];var y,b,d,g=n.length,v=new c(g),m=new c(g),h=new c(g),j=new c(g);for(y=0;g>y;y++)v[y]=n[y][0],m[y]=n[y][1],h[y]=/\.js$/i.test(m[y])?s(p.path,m[y]):s(p.path,m[y]+".js");if("object"==typeof module&&module.exports){if(l===module.exports[t]){for(y=0;g>y;y++)j[y]=module.exports[v[y]]||require(h[y])[v[y]];b=r.apply(e,j),module.exports[t]=b||1}}else if("function"==typeof define&&define.amd)define(["exports"].concat(m),function(n){if(l===n[t]){for(var o=u.slice.call(arguments,1),a=o.length,i=0;a>i;i++)j[i]=n[v[i]]||o[i];b=r.apply(e,j),n[t]=b||1}});else if(i){for(y=0;g>y;y++)self[v[y]]||importScripts(h[y]),j[y]=self[v[y]];b=r.apply(e,j),self[t]=b||1}else if(l===e[t]){var w=function(e,t){d=d||document.getElementsByTagName("head")[0];var n=0,r=document.createElement("script");r.type="text/javascript",r.language="javascript",r.src=e,r.onload=r.onreadystatechange=function(){n||r.readyState&&"loaded"!=r.readyState&&"complete"!=r.readyState||(n=1,r.onload=r.onreadystatechange=null,d.removeChild(r),r=null,t&&t())},d.appendChild(r)},x=function(t,n,r){e[t]?r():w(n,r)},E=function(n){return function(){g>n&&(j[n]=e[v[n]]),++n<g?x(v[n],h[n],E(n)):(b=r.apply(e,j),e[t]=b||1)}};g?x(v[0],h[0],E(0)):(b=r.apply(e,j),e[t]=b||1)}}(this,"Classy",null,function(){var e={};return function(e){var t=function(e,t,n){this.v=e||null,this.prev=t||null,n=n||null};t.prototype={constructor:t,v:null,prev:null,next:null};var n=Array.prototype,r=Object.prototype,l=n.slice,o=(n.splice,n.concat,r.toString),a=r.hasOwnProperty,i=r.propertyIsEnumerable,c=Object.keys,u=Object.defineProperty,f=function(e){return"function"==typeof e},p=function(e,t){if("object"!=typeof e||null===e)throw new TypeError("bad desc");var n={};if(a.call(e,"enumerable")&&(n.enumerable=!!t.enumerable),a.call(e,"configurable")&&(n.configurable=!!t.configurable),a.call(e,"value")&&(n.value=t.value),a.call(e,"writable")&&(n.writable=!!e.writable),a.call(e,"get")){var r=e.get;if(!f(r)&&"undefined"!==r)throw new TypeError("bad get");n.get=r}if(a.call(e,"set")){var l=e.set;if(!f(l)&&"undefined"!==l)throw new TypeError("bad set");n.set=l}if(("get"in n||"set"in n)&&("value"in n||"writable"in n))throw new TypeError("identity-confused descriptor");return n},s=Object.defineProperties||function(e,t){if("object"!=typeof e||null===e)throw new TypeError("bad obj");t=Object(t);for(var n=c(t),r=[],l=0;l<n.length;l++)r.push([n[l],p(t[n[l]],e)]);for(var l=0;l<r.length;l++)u(e,r[l][0],r[l][1]);return e},y=Object.create||function(e,t){var n,r=function(){};return r.prototype=e,n=new r,n.__proto__=e,"object"==typeof t&&s(n,t),n},b=function(e){var n=new t(e);return function(e){if(e&&n&&n.v){var r,o=this;if(e="constructor"==e?n.v:n.v.prototype[e])return n=new t(n.v.$super,n),r=e.apply(o,l.call(arguments,1)),n=n.prev,r}}},d=function(){var e,t,n,r,c,u,f,p,s=l.call(arguments);for(t=s.shift()||{},e=s.length,p=0;e>p;p++)if(n=s[p],n&&"object"==typeof n)for(f in n)a.call(n,f)&&i.call(n,f)&&(u=n[f],r=o.call(u),c=typeof u,t[f]="number"==c||u instanceof Number?0+u:u&&("[object Array]"==r||u instanceof Array||"string"==c||u instanceof String)?u.slice(0):u);return t},g=function(e,t){e=e||Object,t=t||{};var n=t.constructor?t.constructor:function(){};return n.prototype=y(e.prototype),n.prototype=d(n.prototype,t),s(n.prototype,{constructor:{value:n,enumerable:!1,writable:!0,configurable:!0},$class:{value:n,enumerable:!1,writable:!0,configurable:!0},$super:{value:b(e),enumerable:!1,writable:!0,configurable:!0}}),s(n,{$super:{value:e,enumerable:!1,writable:!0,configurable:!0},$static:{value:e.$static&&"object"==typeof e.$static?d(null,e.$static):null,enumerable:!1,writable:!0,configurable:!0}}),n},v=Mixin=d,m=function(){var e=l.call(arguments),t=e.length,n=null;if(t>=2){var r=typeof e[0];r="function"==r?{Extends:e[0]}:"object"==r?e[0]:{Extends:Object};var o,a,i=e[1]||{},c=e[2]||null,u={},f=r.Extends||r.extends||Object,p=r.Implements||r.implements,s=r.Mixin||r.mixin;if(p=p?[].concat(p):null,s=s?[].concat(s):null)for(o=0,a=s.length;a>o;o++)s[o].prototype&&(u=Mixin(u,s[o].prototype));if(p)for(o=0,a=p.length;a>o;o++)p[o].prototype&&(u=v(u,p[o].prototype));n=g(f,d(u,i)),c&&"object"==typeof c&&(n.$static=d(n.$static,c))}else n=g(Object,e[0]);return n};e.Classy={VERSION:"0.4.4",Class:m,Extends:g,Implements:v,Mixin:Mixin,Create:y,Merge:d}}(e),e.Classy});
/**
*
*   RegExAnalyzer
*   @version: 0.2.5
*
*   A simple Regular Expression Analyzer in JavaScript
*   https://github.com/foo123/regex-analyzer
*
**/!function(t,e,r,a,p){var s="undefined"!=typeof global&&"[object global]"=={}.toString.call(global)?1:0,h=s||"undefined"==typeof navigator?0:1,n="function"==typeof importScripts&&navigator instanceof WorkerNavigator?1:0,i=Array,l=i.prototype,g=function(){var t=null;if(s)return t=__filename,{path:__dirname,file:__filename};if(n)t=self.location.href;else if(h){var e;(e=document.getElementsByTagName("script"))&&e.length&&(t=e[e.length-1].src)}return t?{path:t.split("/").slice(0,-1).join("/"),file:t}:{path:null,file:null}},o=g(),u=function(t,e){if(s)return e;if("."==e.charAt(0)){t=t.split("/"),e=e.split("/");var r,a=0,p=0,h=e.length,n=t.length;for(r=0;h>r;r++)if(/^\.\./.test(e[r]))a++,p++;else{if(!/^\./.test(e[r]))break;p++}a=a>=n?0:n-a,e=t.slice(0,a).concat(e.slice(p)).join("/")}return e};r=r?[].concat(r):[];var f,c,y,d=r.length,S=new i(d),C=new i(d),x=new i(d),m=new i(d);for(f=0;d>f;f++)S[f]=r[f][0],C[f]=r[f][1],x[f]=/\.js$/i.test(C[f])?u(o.path,C[f]):u(o.path,C[f]+".js");if("object"==typeof module&&module.exports){if(p===module.exports[e]){for(f=0;d>f;f++)m[f]=module.exports[S[f]]||require(x[f])[S[f]];c=a.apply(t,m),module.exports[e]=c||1}}else if("function"==typeof define&&define.amd)define(["exports"].concat(C),function(r){if(p===r[e]){for(var s=l.slice.call(arguments,1),h=s.length,n=0;h>n;n++)m[n]=r[S[n]]||s[n];c=a.apply(t,m),r[e]=c||1}});else if(n){for(f=0;d>f;f++)self[S[f]]||importScripts(x[f]),m[f]=self[S[f]];c=a.apply(t,m),self[e]=c||1}else if(p===t[e]){var M=function(t,e){y=y||document.getElementsByTagName("head")[0];var r=0,a=document.createElement("script");a.type="text/javascript",a.language="javascript",a.src=t,a.onload=a.onreadystatechange=function(){r||a.readyState&&"loaded"!=a.readyState&&"complete"!=a.readyState||(r=1,a.onload=a.onreadystatechange=null,y.removeChild(a),a=null,e&&e())},y.appendChild(a)},A=function(e,r,a){t[e]?a():M(r,a)},v=function(r){return function(){d>r&&(m[r]=t[S[r]]),++r<d?A(S[r],x[r],v(r)):(c=a.apply(t,m),t[e]=c||1)}};d?A(S[0],x[0],v(0)):(c=a.apply(t,m),t[e]=c||1)}}(this,"RegExAnalyzer",null,function(){var t={};return function(t){var e="\\",r=/^\{\s*(\d+)\s*,?\s*(\d+)?\s*\}/,a=/^u([0-9a-fA-F]{4})/,p=/^x([0-9a-fA-F]{2})/,s={".":"MatchAnyChar","|":"MatchEither","?":"MatchZeroOrOne","*":"MatchZeroOrMore","+":"MatchOneOrMore","^":"MatchStart",$:"MatchEnd","{":"StartRepeats","}":"EndRepeats","(":"StartGroup",")":"EndGroup","[":"StartCharGroup","]":"EndCharGroup"},h={"\\":"EscapeChar","/":"/",0:"NULChar",f:"FormFeed",n:"LineFeed",r:"CarriageReturn",t:"HorizontalTab",v:"VerticalTab",b:"MatchWordBoundary",B:"MatchNonWordBoundary",s:"MatchSpaceChar",S:"MatchNonSpaceChar",w:"MatchWordChar",W:"MatchNonWordChar",d:"MatchDigitChar",D:"MatchNonDigitChar"},n=Object.prototype.toString,i=function(t,e){if(e&&(e instanceof Array||"[object Array]"==n.call(e)))for(var r=0,a=e.length;a>r;r++)t[e[r]]=1;else for(var r in e)t[r]=1;return t},l=function(t,e){t&&(t instanceof Array||"[object Array]"==n.call(t))&&(e=t[1],t=t[0]);var r,a,p=t.charCodeAt(0),s=e.charCodeAt(0);if(s==p)return[String.fromCharCode(p)];for(a=[],r=p;s>=r;++r)a.push(String.fromCharCode(r));return a},g=function(t){var e,r,a,p,s,h,n={},o={};if("Alternation"==t.type)for(a=0,p=t.part.length;p>a;a++)s=g(t.part[a]),n=i(n,s.peek),o=i(o,s.negativepeek);else if("Group"==t.type)s=g(t.part),n=i(n,s.peek),o=i(o,s.negativepeek);else if("Sequence"==t.type){for(a=0,p=t.part.length,r=t.part[a],h=a>=p||!r||"Quantifier"!=r.type||!r.flags.MatchZeroOrMore&&!r.flags.MatchZeroOrOne&&"0"!=r.flags.MatchMinimum;!h;)s=g(r.part),n=i(n,s.peek),o=i(o,s.negativepeek),a++,r=t.part[a],h=a>=p||!r||"Quantifier"!=r.type||!r.flags.MatchZeroOrMore&&!r.flags.MatchZeroOrOne&&"0"!=r.flags.MatchMinimum;p>a&&(r=t.part[a],"Special"!=r.type||"^"!=r.part&&"$"!=r.part||(r=t.part[a+1]||null),r&&"Quantifier"==r.type&&(r=r.part),r&&(s=g(r),n=i(n,s.peek),o=i(o,s.negativepeek)))}else if("CharGroup"==t.type)for(e=t.flags.NotMatch?o:n,a=0,p=t.part.length;p>a;a++)r=t.part[a],"Chars"==r.type?e=i(e,r.part):"CharRange"==r.type?e=i(e,l(r.part)):"UnicodeChar"==r.type||"HexChar"==r.type?e[r.flags.Char]=1:"Special"==r.type&&("D"==r.part?t.flags.NotMatch?n["\\d"]=1:o["\\d"]=1:"W"==r.part?t.flags.NotMatch?n["\\w"]=1:o["\\W"]=1:"S"==r.part?t.flags.NotMatch?n["\\s"]=1:o["\\s"]=1:e["\\"+r.part]=1);else"String"==t.type?n[t.part.charAt(0)]=1:"Special"!=t.type||t.flags.MatchStart||t.flags.MatchEnd?("UnicodeChar"==t.type||"HexChar"==t.type)&&(n[t.flags.Char]=1):"D"==t.part?o["\\d"]=1:"W"==t.part?o["\\W"]=1:"S"==t.part?o["\\s"]=1:n["\\"+t.part]=1;return{peek:n,negativepeek:o}},o=function(t,e){t&&this.setRegex(t,e)};o.VERSION="0.2.5",o.getCharRange=l,o.prototype={constructor:o,VERSION:o.VERSION,regex:null,groupIndex:null,pos:null,flags:null,parts:null,getCharRange:o.getCharRange,getPeekChars:function(){var t,e,r,a,p=this.flags&&this.flags.i,h=g(this.parts);for(t in h){a={},r=h[t];for(e in r)"\\d"==e?(delete r[e],a=i(a,l("0","9"))):"\\s"==e?(delete r[e],a=i(a,["\f","\n","\r","	",""," ","\u2028","\u2029"])):"\\w"==e?(delete r[e],a=i(a,["_"].concat(l("0","9")).concat(l("a","z")).concat(l("A","Z")))):"\\."==e?(delete r[e],a[s["."]]=1):"\\"!=e.charAt(0)&&p?(a[e.toLowerCase()]=1,a[e.toUpperCase()]=1):"\\"==e.charAt(0)&&delete r[e];h[t]=i(r,a)}return h},setRegex:function(t,e){if(t){this.flags={},e=e||"/";for(var r=t.toString(),a=r.length,p=r.charAt(a-1);e!=p;)this.flags[p]=1,r=r.substr(0,a-1),a=r.length,p=r.charAt(a-1);e==r.charAt(0)&&e==r.charAt(a-1)&&(r=r.substr(1,a-2)),this.regex=r}return this},analyze:function(){var t,n,i,l="",g=[],o=[],u=!1;for(this.pos=0,this.groupIndex=0;this.pos<this.regex.length;)t=this.regex.charAt(this.pos++),u=e==t?!0:!1,u&&(t=this.regex.charAt(this.pos++)),u?"u"==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),i=a.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,o.push({part:i[0],flags:{Char:String.fromCharCode(parseInt(i[1],16)),Code:i[1]},type:"UnicodeChar"})):"x"==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),i=p.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,o.push({part:i[0],flags:{Char:String.fromCharCode(parseInt(i[1],16)),Code:i[1]},type:"HexChar"})):h[t]&&"/"!=t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),n={},n[h[t]]=1,o.push({part:t,flags:n,type:"Special"})):l+=t:"|"==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),g.push({part:o,flags:{},type:"Sequence"}),o=[]):"["==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),o.push(this.chargroup())):"("==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),o.push(this.subgroup())):"{"==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),i=r.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,o.push({part:o.pop(),flags:{part:i[0],MatchMinimum:i[1],MatchMaximum:i[2]||"unlimited"},type:"Quantifier"})):"*"==t||"+"==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),n={},n[s[t]]=1,"?"==this.regex.charAt(this.pos)?(n.isGreedy=0,this.pos++):n.isGreedy=1,o.push({part:o.pop(),flags:n,type:"Quantifier"})):"?"==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),n={},n[s[t]]=1,o.push({part:o.pop(),flags:n,type:"Quantifier"})):s[t]?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),n={},n[s[t]]=1,o.push({part:t,flags:n,type:"Special"})):l+=t;return l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),g.length?(g.push({part:o,flags:{},type:"Sequence"}),o=[],n={},n[s["|"]]=1,this.parts={part:g,flags:n,type:"Alternation"}):this.parts={part:o,flags:{},type:"Sequence"},this},subgroup:function(){var t,n,i,l="",g=[],o=[],u={},f=!1,c=this.regex.substr(this.pos,2);for("?:"==c?(u.NotCaptured=1,this.pos+=2):"?="==c?(u.LookAhead=1,this.pos+=2):"?!"==c&&(u.NegativeLookAhead=1,this.pos+=2),u.GroupIndex=++this.groupIndex;this.pos<this.regex.length;)if(t=this.regex.charAt(this.pos++),f=e==t?!0:!1,f&&(t=this.regex.charAt(this.pos++)),f)"u"==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),i=a.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,o.push({part:i[0],flags:{Char:String.fromCharCode(parseInt(i[1],16)),Code:i[1]},type:"UnicodeChar"})):"x"==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),i=p.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,o.push({part:i[0],flags:{Char:String.fromCharCode(parseInt(i[1],16)),Code:i[1]},type:"HexChar"})):h[t]&&"/"!=t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),n={},n[h[t]]=1,o.push({part:t,flags:n,type:"Special"})):l+=t;else{if(")"==t)return l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),g.length?(g.push({part:o,flags:{},type:"Sequence"}),o=[],n={},n[s["|"]]=1,{part:{part:g,flags:n,type:"Alternation"},flags:u,type:"Group"}):{part:{part:o,flags:{},type:"Sequence"},flags:u,type:"Group"};"|"==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),g.push({part:o,flags:{},type:"Sequence"}),o=[]):"["==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),o.push(this.chargroup())):"("==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),o.push(this.subgroup())):"{"==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),i=r.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,o.push({part:o.pop(),flags:{part:i[0],MatchMinimum:i[1],MatchMaximum:i[2]||"unlimited"},type:"Quantifier"})):"*"==t||"+"==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),n={},n[s[t]]=1,"?"==this.regex.charAt(this.pos)?(n.isGreedy=0,this.pos++):n.isGreedy=1,o.push({part:o.pop(),flags:n,type:"Quantifier"})):"?"==t?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),n={},n[s[t]]=1,o.push({part:o.pop(),flags:n,type:"Quantifier"})):s[t]?(l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),n={},n[s[t]]=1,o.push({part:t,flags:n,type:"Special"})):l+=t}return l.length&&(o.push({part:l,flags:{},type:"String"}),l=""),g.length?(g.push({part:o,flags:{},type:"Sequence"}),o=[],n={},n[s["|"]]=1,{part:{part:g,flags:n,type:"Alternation"},flags:u,type:"Group"}):{part:{part:o,flags:{},type:"Sequence"},flags:u,type:"Group"}},chargroup:function(){var t,r,s,n,i,l,g=[],o=[],u={},f=!1,c=!1;for("^"==this.regex.charAt(this.pos)&&(u.NotMatch=1,this.pos++);this.pos<this.regex.length;)if(l=!1,s=r,r=this.regex.charAt(this.pos++),c=e==r?!0:!1,c&&(r=this.regex.charAt(this.pos++)),c&&("u"==r?(i=a.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,r=String.fromCharCode(parseInt(i[1],16)),l=!0):"x"==r&&(i=p.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,r=String.fromCharCode(parseInt(i[1],16)),l=!0)),f)o.length&&(g.push({part:o,flags:{},type:"Chars"}),o=[]),n[1]=r,f=!1,g.push({part:n,flags:{},type:"CharRange"});else if(c)!l&&h[r]&&"/"!=r?(o.length&&(g.push({part:o,flags:{},type:"Chars"}),o=[]),t={},t[h[r]]=1,g.push({part:r,flags:t,type:"Special"})):o.push(r);else{if("]"==r)return o.length&&(g.push({part:o,flags:{},type:"Chars"}),o=[]),{part:g,flags:u,type:"CharGroup"};"-"==r?(n=[s,""],o.pop(),f=!0):o.push(r)}return o.length&&(g.push({part:o,flags:{},type:"Chars"}),o=[]),{part:g,flags:u,type:"CharGroup"}}},t.RegExAnalyzer=o}(t),t.RegExAnalyzer});
/**
*
*   CodeMirrorGrammar
*   @version: 0.7.1
*
*   Transform a grammar specification in JSON format, into a syntax-highlight parser mode for CodeMirror
*   https://github.com/foo123/codemirror-grammar
*
**/!function(t,n,e,r,i){var l="undefined"!=typeof global&&"[object global]"=={}.toString.call(global)?1:0,s=l||"undefined"==typeof navigator?0:1,o="function"==typeof importScripts&&navigator instanceof WorkerNavigator?1:0,u=Array,c=u.prototype,a=function(){var t=null;if(l)return t=__filename,{path:__dirname,file:__filename};if(o)t=self.location.href;else if(s){var n;(n=document.getElementsByTagName("script"))&&n.length&&(t=n[n.length-1].src)}return t?{path:t.split("/").slice(0,-1).join("/"),file:t}:{path:null,file:null}},f=a(),h=function(t,n){if(l)return n;if("."==n.charAt(0)){t=t.split("/"),n=n.split("/");var e,r=0,i=0,s=n.length,o=t.length;for(e=0;s>e;e++)if(/^\.\./.test(n[e]))r++,i++;else{if(!/^\./.test(n[e]))break;i++}r=r>=o?0:o-r,n=t.slice(0,r).concat(n.slice(i)).join("/")}return n};e=e?[].concat(e):[];var p,g,d,m=e.length,k=new u(m),v=new u(m),y=new u(m),R=new u(m);for(p=0;m>p;p++)k[p]=e[p][0],v[p]=e[p][1],y[p]=/\.js$/i.test(v[p])?h(f.path,v[p]):h(f.path,v[p]+".js");if("object"==typeof module&&module.exports){if(i===module.exports[n]){for(p=0;m>p;p++)R[p]=module.exports[k[p]]||require(y[p])[k[p]];g=r.apply(t,R),module.exports[n]=g||1}}else if("function"==typeof define&&define.amd)define(["exports"].concat(v),function(e){if(i===e[n]){for(var l=c.slice.call(arguments,1),s=l.length,o=0;s>o;o++)R[o]=e[k[o]]||l[o];g=r.apply(t,R),e[n]=g||1}});else if(o){for(p=0;m>p;p++)self[k[p]]||importScripts(y[p]),R[p]=self[k[p]];g=r.apply(t,R),self[n]=g||1}else if(i===t[n]){var E=function(t,n){d=d||document.getElementsByTagName("head")[0];var e=0,r=document.createElement("script");r.type="text/javascript",r.language="javascript",r.src=t,r.onload=r.onreadystatechange=function(){e||r.readyState&&"loaded"!=r.readyState&&"complete"!=r.readyState||(e=1,r.onload=r.onreadystatechange=null,d.removeChild(r),r=null,n&&n())},d.appendChild(r)},C=function(n,e,r){t[n]?r():E(e,r)},b=function(e){return function(){m>e&&(R[e]=t[k[e]]),++e<m?C(k[e],y[e],b(e)):(g=r.apply(t,R),t[n]=g||1)}};m?C(k[0],y[0],b(0)):(g=r.apply(t,R),t[n]=g||1)}}(this,"CodeMirrorGrammar",[["Classy","./classy"],["RegExAnalyzer","./regexanalyzer"]],function(t,n){var e,r,s=1/0,o=2,u=4,c=8,a=9,f=10,h=16,p=32,g=64,d=128,m=256,k=512,v=2,y=4,R=8,E=4,C=8,b=16,_=17,w=18,x=32,S=33,B=34,q=64,O=128,j=256,A=257,T=258,L=259,M=512,P=1024,N={ONEOF:q,EITHER:q,ALL:O,ZEROORONE:A,ZEROORMORE:T,ONEORMORE:L,REPEATED:j},$={BLOCK:x,COMMENT:B,ESCAPEDBLOCK:S,SIMPLE:b,GROUP:M,NGRAM:P},D=t.Class,K=Array.prototype,I=Object.prototype,F=K.slice,U=(K.splice,K.concat),z=I.hasOwnProperty,G=I.toString,W=I.propertyIsEnumerable,Z=Object.keys,H=function(t){var n=typeof t,e=G.call(t);return"undefined"==n?m:"number"==n||t instanceof Number?o:null===t?d:!0===t||!1===t?u:t&&("string"==n||t instanceof String)?1==t.length?a:c:t&&("[object RegExp]"==e||t instanceof RegExp)?h:t&&("[object Array]"==e||t instanceof Array)?p:t&&"[object Object]"==e?g:k},V=function(t,n){return n||p!=H(t)?[t]:t},J=function(t,n){return t=V(t,n),(n||p!=H(t[0]))&&(t=[t]),t},Q=function(t){var n,e=H(t);if(!((g|p)&e))return t;var r,i={};for(r in t)z.call(t,r)&&W.call(t,r)&&(n=H(t[r]),i[r]=g&n?Q(t[r]):p&n?t[r].slice():t[r]);return i},X=function(){var t=F.call(arguments),n=t.length;if(1>n)return null;if(2>n)return Q(t[0]);var e,r,i,l,s=t.shift(),o=Q(s);for(n--,r=0;n>r;r++)if(e=t.shift())for(i in e)z.call(e,i)&&W.call(e,i)&&(z.call(s,i)&&W.call(s,i)?(l=H(s[i]),g&~c&l&&(o[i]=X(s[i],e[i]))):o[i]=Q(e[i]));return o},Y=function(t){return t.replace(/([.*+?^${}()|[\]\/\\])/g,"\\$1")},tn=function(t,n){var e,r,i,l;for(l=function(t,e){return n[1+parseInt(e,10)]},e=t.split("$$"),i=e.length,r=0;i>r;r++)e[r]=e[r].replace(/\$(\d{1,2})/g,l);return e.join("$")},nn=function(t,n){return n.length-t.length},en=function(t,n){return c&H(n)&&c&H(t)&&n.length&&n.length<=t.length&&n==t.substr(0,n.length)},rn=function(t,e,r){if(!t||o==H(t))return t;var i=e?e.length||0:0;if(i&&e==t.substr(0,i)){var l,s,u,c="^("+t.substr(i)+")";return r[c]||(l=new RegExp(c),u=new n(l).analyze(),s=u.getPeekChars(),Z(s.peek).length||(s.peek=null),Z(s.negativepeek).length||(s.negativepeek=null),r[c]=[l,s]),r[c]}return t},ln=function(t,n){var e={},r="",i=H(n);(c==i||a==i)&&(r=n);var l=t.sort(nn).map(function(t){return e[t.charAt(0)]=1,Y(t)}).join("|");return[new RegExp("^("+l+")"+r),{peek:e,negativepeek:null},1]},sn="undefined"!=typeof global&&"[object global]"=={}.toString.call(global)?1:0,on=sn||"undefined"==typeof navigator?0:1,un="function"==typeof importScripts&&navigator instanceof WorkerNavigator?1:0,cn=function(){var t=null;if(sn)return t=__filename,{path:__dirname,file:__filename};if(un)t=self.location.href;else if(on){var n;(n=document.getElementsByTagName("script"))&&n.length&&(t=n[n.length-1].src)}return t?{path:t.split("/").slice(0,-1).join("/"),file:t}:{path:null,file:null}};cn();var an=D({constructor:function(t){this.string=t?""+t:"",this.start=this.pos=0,this._=null},_:null,string:"",start:0,pos:0,fromStream:function(t){return this._=t,this.string=""+t.string,this.start=t.start,this.pos=t.pos,this},toString:function(){return this.string},sol:function(){return 0==this.pos},eol:function(){return this.pos>=this.string.length},chr:function(t,n){var e=this.string.charAt(this.pos)||null;return e&&t==e?(!1!==n&&(this.pos+=1,this._&&(this._.pos=this.pos)),e):!1},chl:function(t,n){var e=this.string.charAt(this.pos)||null;return e&&-1<t.indexOf(e)?(!1!==n&&(this.pos+=1,this._&&(this._.pos=this.pos)),e):!1},str:function(t,n,e){var r=this.pos,i=this.string,l=i.charAt(r)||null;if(l&&n[l]){var s=t.length,o=i.substr(r,s);if(t==o)return!1!==e&&(this.pos+=s,this._&&(this._.pos=this.pos)),o}return!1},rex:function(t,n,e,r,i){var l=this.pos,s=this.string,o=s.charAt(l)||null;if(o&&n&&n[o]||e&&!e[o]){var u=s.slice(l).match(t);return!u||u.index>0?!1:(!1!==i&&(this.pos+=u[r||0].length,this._&&(this._.pos=this.pos)),u)}return!1},end:function(){return this.pos=this.string.length,this._&&(this._.pos=this.pos),this},nxt:function(){if(this.pos<this.string.length){var t=this.string.charAt(this.pos++)||null;return this._&&(this._.pos=this.pos),t}},bck:function(t){return this.pos-=t,0>this.pos&&(this.pos=0),this._&&(this._.pos=this.pos),this},bck2:function(t){return this.pos=t,0>this.pos&&(this.pos=0),this._&&(this._.pos=this.pos),this},spc:function(){for(var t=this.pos,n=this.pos,e=this.string;/[\s\u00a0]/.test(e.charAt(n));)++n;return this.pos=n,this._&&(this._.pos=this.pos),this.pos>t},cur:function(){return this.string.slice(this.start,this.pos)},sft:function(){return this.start=this.pos,this}}),fn=D({constructor:function(t){this.l=t||0,this.stack=[],this.t=C,this.r="0",this.inBlock=null,this.endBlock=null},l:0,stack:null,t:null,r:null,inBlock:null,endBlock:null,clone:function(){var t=new this.$class(this.l);return t.t=this.t,t.r=this.r,t.stack=this.stack.slice(),t.inBlock=this.inBlock,t.endBlock=this.endBlock,t},toString:function(){return["",this.l,this.t,this.r,this.inBlock||"0",this.stack.length].join("_")}}),hn=D({constructor:function(t,n,e,r){var i=this;switch(i.type=v,i.tt=t||a,i.tn=n,i.tk=r||0,i.tg=0,i.tp=null,i.p=null,i.np=null,i.tt){case a:case f:i.tp=e;break;case c:i.tp=e,i.p={},i.p[""+e.charAt(0)]=1;break;case h:i.tp=e[0],i.p=e[1].peek||null,i.np=e[1].negativepeek||null,i.tg=e[2]||0;break;case d:i.tp=null}},type:null,tt:null,tn:null,tp:null,tg:0,tk:0,p:null,np:null,get:function(t,n){var e,r=this,i=r.tt,l=r.tk,s=r.tp,o=r.tg,u=r.p,p=r.np;switch(i){case a:if(e=t.chr(s,n))return[l,e];break;case f:if(e=t.chl(s,n))return[l,e];break;case c:if(e=t.str(s,u,n))return[l,e];break;case h:if(e=t.rex(s,u,p,o,n))return[l,e];break;case d:return!1!==n&&t.end(),[l,""]}return!1},toString:function(){return["[","Matcher: ",this.tn,", Pattern: ",this.tp?this.tp.toString():null,"]"].join("")}}),pn=D(hn,{constructor:function(t,n,e){var r=this;r.type=y,r.tn=t,r.ms=n,r.ownKey=!1!==e},ms:null,ownKey:!0,get:function(t,n){var e,r,i=this.ms,l=i.length,s=this.ownKey;for(e=0;l>e;e++)if(r=i[e].get(t,n))return s?[e,r[1]]:r;return!1}}),gn=D(hn,{constructor:function(t,n,e){var r=this;r.type=R,r.tn=t,r.s=new pn(r.tn+"_Start",n,!1),r.e=e},s:null,e:null,get:function(t,n){var e,r=this,i=r.s,l=r.e;if(e=i.get(t,n)){var s=l[e[0]],u=H(s),a=i.ms[e[0]].tt;return h==a&&(o==u?s=new hn(c,r.tn+"_End",e[1][s+1]):c==u&&(s=new hn(c,r.tn+"_End",tn(s,e[1])))),s}return!1}}),dn=function(t,n,e,r){var i=H(n);if(o==i)return n;if(!r[t]){e=e||0;var l,s=0;n&&n.isCharList&&(s=1,delete n.isCharList),l=d&i?new hn(d,t,n,e):a==i?new hn(a,t,n,e):c&i?s?new hn(f,t,n,e):new hn(c,t,n,e):p&i?new hn(h,t,n,e):n,r[t]=l}return r[t]},mn=function(t,n,e,r,i,l){if(!l[t]){var s,o,u,f,h,g,d,m=0,k=0,v=1;if(s=V(n),u=s.length,1==u)d=dn(t,rn(s[0],e,i),0,l);else if(u>1){for(f=(u>>1)+1,o=0;f>=o;o++)h=H(s[o]),g=H(s[u-1-o]),(a!=h||a!=g)&&(v=0),p&h||p&g?m=1:(en(s[o],e)||en(s[u-1-o],e))&&(k=1);if(!v||r&&c&H(r))if(!r||m||k){for(o=0;u>o;o++)s[o]=p&H(s[o])?mn(t+"_"+o,s[o],e,r,i,l):dn(t+"_"+o,rn(s[o],e,i),o,l);d=u>1?new pn(t,s):s[0]}else d=dn(t,ln(s,r),0,l);else s=s.slice().join(""),s.isCharList=1,d=dn(t,s,0,l)}l[t]=d}return l[t]},kn=function(t,n,e,r,i){if(!i[t]){var l,s,o,u,a,f,p;for(u=[],a=[],l=J(n),s=0,o=l.length;o>s;s++)f=dn(t+"_0_"+s,rn(l[s][0],e,r),s,i),p=l[s].length>1?h!=f.tt||c!=H(l[s][1])||en(l[s][1],e)?dn(t+"_1_"+s,rn(l[s][1],e,r),s,i):l[s][1]:f,u.push(f),a.push(p);i[t]=new gn(t,u,a)}return i[t]},vn=D({constructor:function(t,n,e){var r=this;r.tt=b,r.tn=t,r.t=n,r.r=e,r.required=0,r.ERR=0,r.toClone=["t","r"]},tn:null,tt:null,t:null,r:null,required:0,ERR:0,toClone:null,get:function(t,n){var e=this,r=e.t,i=e.tt;if(_==i){if(t.spc(),t.eol())return n.t=C,e.r}else if(w==i)e.ERR=e.required&&t.spc()&&!t.eol()?1:0,e.required=0;else if(r.get(t))return n.t=e.tt,e.r;return!1},require:function(t){return this.required=t?1:0,this},push:function(t,n,e){return n?t.splice(n,0,e):t.push(e),this},clone:function(){var t,n,e,r=this,i=r.toClone;if(t=new r.$class,t.tt=r.tt,t.tn=r.tn,i&&i.length)for(e=i.length,n=0;e>n;n++)t[i[n]]=r[i[n]];return t},toString:function(){return["[","Tokenizer: ",this.tn,", Matcher: ",this.t?this.t.toString():null,"]"].join("")}}),yn=D(vn,{constructor:function(t,n,e,r,i,l,s){var o=this;o.$super("constructor",n,e,r),o.ri="undefined"==typeof i?o.r:i,o.tt=t,o.mline="undefined"==typeof l?1:l,o.esc=s||"\\",o.toClone=["t","r","ri","mline","esc"]},ri:null,mline:0,esc:null,get:function(t,n){var e,r,i,l,s,o,u,c,a,f=this,h=0,p=0,g="",m=f.mline,k=f.t,v=f.tn,y=f.tt,R=f.r,E=f.ri,C=R!=E,b=0,_=S==y,w=f.esc;if(B==y&&(f.required=0),s=0,n.inBlock==v?(p=1,e=n.endBlock,s=1,o=E):!n.inBlock&&(e=k.get(t))&&(p=1,n.inBlock=v,n.endBlock=e,o=R),p){if(i=n.stack.length,l=d==e.tt,C){if(s&&l&&t.sol())return f.required=0,n.inBlock=null,n.endBlock=null,!1;if(!s)return f.push(n.stack,i,f.clone()),n.t=y,o}if(h=e.get(t),r=m,a=0,h)o=l?E:R;else for(c=t.pos;!t.eol();){if(u=t.pos,!(_&&b||!e.get(t))){C?t.pos>u&&u>c?(o=E,t.bck2(u),a=1):(o=R,h=1):(o=R,h=1);break}g=t.nxt(),b=!b&&g==w}return r=m||_&&b,h||!r&&!a?(n.inBlock=null,n.endBlock=null):f.push(n.stack,i,f.clone()),n.t=y,o}return!1}}),Rn=D(vn,{constructor:function(t,n,e,r){var i=this;i.tt=j,i.tn=t||null,i.t=null,i.ts=null,i.min=e||0,i.max=r||s,i.found=0,i.toClone=["ts","min","max","found"],n&&i.set(n)},ts:null,min:0,max:1,found:0,set:function(t){return t&&(this.ts=V(t)),this},get:function(t,n){var e,r,i,l,s,o=this,u=o.ts,c=u.length,a=o.found,f=o.min,h=o.max,p=0;for(o.ERR=0,o.required=0,l=t.pos,s=n.stack.length,e=0;c>e;e++){if(r=u[e].clone().require(1),i=r.get(t,n),!1!==i){if(++a,h>=a)return o.found=a,o.push(n.stack,s,o.clone()),o.found=0,i;break}r.required&&p++,r.ERR&&t.bck2(l)}return o.required=f>a,o.ERR=a>h||f>a&&p>0,!1}}),En=D(Rn,{constructor:function(t,n){this.$super("constructor",t,n,1,1),this.tt=q},get:function(t,n){var e,r,i,l,s=this,o=s.ts,u=o.length,c=0,a=0;for(s.required=1,s.ERR=0,l=t.pos,i=0;u>i;i++){if(r=o[i].clone(),e=r.get(t,n),c+=r.required?1:0,!1!==e)return e;r.ERR&&(a++,t.bck2(l))}return s.required=c>0,s.ERR=u==a&&c>0,!1}}),Cn=D(Rn,{constructor:function(t,n){this.$super("constructor",t,n,1,1),this.tt=O},get:function(t,n){var e,r,i,l,s=this,o=s.ts,u=o.length;if(s.required=1,s.ERR=0,i=t.pos,l=n.stack.length,e=o[0].clone().require(1),r=e.get(t,n),!1!==r){for(var c=u-1;c>0;c--)s.push(n.stack,l+u-c-1,o[c].clone().require(1));return r}return e.ERR?(s.ERR=1,t.bck2(i)):e.required&&(s.ERR=1),!1}}),bn=D(Rn,{constructor:function(t,n){this.$super("constructor",t,n,1,1),this.tt=P},get:function(t,n){var e,r,i,l,s=this,o=s.ts,u=o.length;if(s.required=0,s.ERR=0,i=t.pos,l=n.stack.length,e=o[0].clone().require(0),r=e.get(t,n),!1!==r){for(var c=u-1;c>0;c--)s.push(n.stack,l+u-c-1,o[c].clone().require(1));return r}return e.ERR&&t.bck2(i),!1}}),_n=function(t,n,r,i,l,o,u,a,f,h,g){if(null===t){var d=new vn(t,t,e);return d.tt=_,d}if(""===t){var d=new vn(t,t,e);return d.tt=w,d}if(t=""+t,!a[t]){var m,k,v,y,R,E,C,d=null;if(m=r[t]||i[t]||{type:"simple",tokens:t}){if((c|p)&H(m)&&(m={type:"simple",tokens:m}),k=m.type?$[m.type.toUpperCase().replace("-","").replace("_","")]:b,b&k&&""===m.tokens)return d=new vn(t,"",e),d.tt=w,a[t]=d,d;if(m.tokens=V(m.tokens),y=m.action||null,b&k)m.autocomplete&&xn(m,t,g),v="undefined"==typeof m.combine?"\\b":m.combine,d=new vn(t,mn(t,m.tokens.slice(),n,v,o,u),l[t]||e),a[t]=d;else if(x&k)B&k&&wn(m,h),d=new yn(k,t,kn(t,m.tokens.slice(),n,o,u),l[t]||e,l[t+".inside"],m.multiline,m.escape),a[t]=d,m.interleave&&f.push(d.clone());else if(M&k){E=m.tokens.slice(),p&H(m.match)?d=new Rn(t,null,m.match[0],m.match[1]):(R=N[m.match.toUpperCase()],d=A==R?new Rn(t,null,0,1):T==R?new Rn(t,null,0,s):L==R?new Rn(t,null,1,s):q&R?new En(t,null):new Cn(t,null)),a[t]=d,C=[];for(var S=0,O=E.length;O>S;S++)C=C.concat(_n(E[S],n,r,i,l,o,u,a,f,h,g));d.set(C)}else if(P&k){d=J(m.tokens.slice()).slice();for(var j,D=[],S=0,O=d.length;O>S;S++)D[S]=d[S].slice(),d[S]=new bn(t+"_NGRAM_"+S,null);a[t]=d;for(var S=0,O=d.length;O>S;S++){j=D[S],C=[];for(var K=0,I=j.length;I>K;K++)C=C.concat(_n(j[K],n,r,i,l,o,u,a,f,h,g));d[S].set(C)}}}}return a[t]},wn=function(t,n){var e,r,s,o=J(t.tokens.slice());for(i=0,l=o.length;l>i;i++)e=o[i][0],r=o[i].length>1?o[i][1]:o[i][0],s=o[i].length>2?o[i][2]:"",null===r?(n.line=n.line||[],n.line.push(e)):(n.block=n.block||[],n.block.push([e,r,s]))},xn=function(t,n,e){var r=[].concat(V(t.tokens)).map(function(t){return{word:t,meta:n}});e.autocomplete=U.apply(e.autocomplete||[],r)},Sn=function(t){var n,e,r,i,l,s,o,u,c,a,f,h,g,d,m,k;if(t.__parsed)return t;for(f={},h={},g={},m={},k={},d=[],t=Q(t),n=t.RegExpID||null,t.RegExpID=null,delete t.RegExpID,s=t.Lex||{},t.Lex=null,delete t.Lex,o=t.Syntax||{},t.Syntax=null,delete t.Syntax,l=t.Style||{},i=t.Parser||[],r=i.length,e=[],u=0;r>u;u++)c=i[u],a=_n(c,n,s,o,l,f,h,g,d,m,k)||null,a&&(p&H(a)?e=e.concat(a):e.push(a));return t.Parser=e,t.cTokens=d,t.Style=l,t.Comments=m,t.Keywords=k,t.__parsed=1,t},Bn=CodeMirror||{Pass:{toString:function(){return"CodeMirror.Pass"}}},qn=D({constructor:function(t,n){var e=this;e.electricChars=t.electricChars||!1,e.LC=t.Comments.line?t.Comments.line[0]:null,e.BCS=t.Comments.block?t.Comments.block[0][0]:null,e.BCE=t.Comments.block?t.Comments.block[0][1]:null,e.BCC=e.BCL=t.Comments.block?t.Comments.block[0][2]:null,e.DEF=n.DEFAULT,e.ERR=t.Style.error||n.ERROR,e.Keywords=t.Keywords.autocomplete||null,e.Tokens=t.Parser||[],e.cTokens=t.cTokens.length?t.cTokens:null},conf:null,parserConf:null,electricChars:!1,LC:null,BCS:null,BCE:null,BCL:null,BCC:null,ERR:null,DEF:null,Keywords:null,cTokens:null,Tokens:null,parse:function(t){t=t||"";var n,e,r,i,l=t.split(/\r\n|\r|\n/g),s=l.length,o=[];for(r=new fn,n=0;s>n;n++){for(i=new an(l[n]),e=[];!i.eol();)e.push(this.getToken(i,r,1)),i.sft();o.push(e)}return o},getToken:function(t,n,e){var r,i,l,s,o,u,c=this,a=c.cTokens,f=c.Tokens,h=f.length,p=null,g=c.DEF,d=c.ERR;if(u=n.stack,o=(new an).fromStream(t),o.sol()&&u.length&&_==u[u.length-1].tt&&u.pop(),(!u.length||w!=u[u.length-1].tt)&&o.spc())return n.t=C,e?{value:o.cur(),type:g,error:null}:n.r=g;for(;u.length;){if(a)for(i=0;i<a.length;)if(l=a[i++],s=l.get(o,n),!1!==s)return e?{value:o.cur(),type:s,error:null}:n.r=s;if(l=u.pop(),s=l.get(o,n),!1!==s)return e?{value:o.cur(),type:s,error:null}:n.r=s;if(l.ERR||l.required)return u.length=0,o.nxt(),n.t=E,p=l.tn+(l.required?" is missing":" syntax error"),e?{value:o.cur(),type:d,error:p}:n.r=d}for(r=0;h>r;r++){if(l=f[r],s=l.get(o,n),!1!==s)return e?{value:o.cur(),type:s,error:null}:n.r=s;if(l.ERR||l.required)return u.length=0,o.nxt(),n.t=E,p=l.tn+(l.required?" is missing":" syntax error"),e?{value:o.cur(),type:d,error:p}:n.r=d}return o.nxt(),n.t=C,e?{value:o.cur(),type:g,error:null}:n.r=g},indent:function(){return Bn.Pass}}),On=function(t,n){return new qn(t,n)},jn=function(t){var n=function(n,e){return t.conf=n,t.parserConf=e,{startState:function(){return new fn},electricChars:t.electricChars,validator:function(n){var e,r,i,l,s,o,u,c,a,f=0;if(e=n,!e||!e.length)return[];for(r=[],i=t.parse(e),u=i.length,c=0;u>c;c++)if(l=i[c],l&&l.length)for(a=0,o=0;o<l.length;o++)s=l[o],t.ERR==s.type&&(r.push({message:s.error||"Syntax Error",severity:"error",from:CodeMirror.Pos(c,a),to:CodeMirror.Pos(c,a+1)}),f=1),a+=s.value.length;return f?(console.log(r),r):[]},lineComment:t.LC,blockCommentStart:t.BCS,blockCommentEnd:t.BCE,blockCommentContinue:t.BCC,blockCommentLead:t.BCL,copyState:function(t){return t.clone()},token:function(n,e){return t.getToken(n,e)},indent:function(n,e,r){return t.indent(n,e,r)}}};return n},An=function(t,n){var i={DEFAULT:n||e,ERROR:r};return t=Sn(t),jn(On(t,i))};e=null,r="error";var Tn={VERSION:"0.7.1",extend:X,parse:Sn,getMode:An};return Tn});
