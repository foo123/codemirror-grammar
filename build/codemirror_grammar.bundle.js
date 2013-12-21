/**
*
*   classy.js
*   Object-Oriented mini-framework for JavaScript
*   @version: 0.3
*
*   https://github.com/foo123/classy.js
*
**/!function(t,e,o,r){o=o?[].concat(o):[];var n,p=o.length,i=new Array(p),c=new Array(p),s=new Array(p);for(n=0;p>n;n++)i[n]=o[n][0],c[n]=o[n][1];if("object"==typeof module&&module.exports){if("undefined"==typeof module.exports[e]){for(n=0;p>n;n++)s[n]=module.exports[i[n]]||require(c[n])[i[n]];module.exports[e]=r.apply(t,s)}}else if("function"==typeof define&&define.amd)define(["exports"].concat(c),function(o){if("undefined"==typeof o[e]){for(var n=Array.prototype.slice.call(arguments,1),p=0,c=n.length;c>p;p++)s[p]=o[i[p]];o[e]=r.apply(t,s)}});else if("undefined"==typeof t[e]){for(n=0;p>n;n++)s[n]=t[i[n]];t[e]=r.apply(t,s)}}(this,"Classy",null,function(){var t=Array.prototype.slice,e=(Array.prototype.splice,Array.prototype.concat,Object.prototype.hasOwnProperty),o=Object.defineProperties,r=Object.prototype.toString,n=Object.create||function(t,e){var r,n=function(){};return n.prototype=t,r=new n,r.__proto__=t,o&&"undefined"!=typeof e&&o(r,e),r},p=function(e){return e&&this.$class&&this.$class.$super&&(e="constructor"==e?this.$class.$super:this.$class.$super.prototype[""+e])?e.apply(this,t.call(arguments,1)||[]):void 0},i=function(){var o,n,p,i,c,s,a,l,f=t.call(arguments);for(n=f.shift()||{},o=f.length,l=0;o>l;l++)if(p=f[l],p&&"object"==typeof p)for(a in p)e.call(p,a)&&(s=p[a],i=r.call(s),c=typeof s,n[a]="number"==c||s instanceof Number?0+s:s&&("[object Array]"==i||s instanceof Array||"string"==c||s instanceof String)?s.slice(0):s);return n},c=function(t,e){t=t||Object,e=e||{};var o=e.constructor?e.constructor:function(){};return o.prototype=n(t.prototype),o.prototype=i(o.prototype,e),o.prototype.constructor=o.prototype.$class=o,o.prototype.$super=p,o.$super=t,o.$static="object"==typeof t.$static?i({},t.$static):{},o},s=Mixin=i,a=function(){var e=t.call(arguments),o=e.length,r=null;if(o>=2){var n,p,a="object"==typeof e[0]?e[0]:{},l=e[1]||{},f=e[2]||null,u={},y=a.Extends||a.extends||Object,d=a.Implements||a.implements,m=a.Mixin||a.mixin;if(d=d?[].concat(d):null,m=m?[].concat(m):null)for(n=0,p=m.length;p>n;n++)m[n].prototype&&(u=Mixin(u,m[n].prototype));if(d)for(n=0,p=d.length;p>n;n++)d[n].prototype&&(u=s(u,d[n].prototype));r=c(y,i(u,l)),f&&"object"==typeof f&&(r.$static=i(r.$static,f))}else r=c(Object,e[0]);return r};return{VERSION:"0.3",Class:a,Extends:c,Implements:s,Mixin:Mixin,Create:n,Merge:i}});/**
*
*   A simple Regular Expression Analyzer
*   @version 0.2.4
*   https://github.com/foo123/regex-analyzer
*
**/!function(t,e,r,a){r=r?[].concat(r):[];var p,s=r.length,h=new Array(s),n=new Array(s),i=new Array(s);for(p=0;s>p;p++)h[p]=r[p][0],n[p]=r[p][1];if("object"==typeof module&&module.exports){if("undefined"==typeof module.exports[e]){for(p=0;s>p;p++)i[p]=module.exports[h[p]]||require(n[p])[h[p]];module.exports[e]=a.apply(t,i)}}else if("function"==typeof define&&define.amd)define(["exports"].concat(n),function(r){if("undefined"==typeof r[e]){for(var p=Array.prototype.slice.call(arguments,1),s=0,n=p.length;n>s;s++)i[s]=r[h[s]];r[e]=a.apply(t,i)}});else if("undefined"==typeof t[e]){for(p=0;s>p;p++)i[p]=t[h[p]];t[e]=a.apply(t,i)}}(this,"RegExAnalyzer",null,function(){var t="\\",e=/^\{\s*(\d+)\s*,?\s*(\d+)?\s*\}/,r=/^u([0-9a-fA-F]{4})/,a=/^x([0-9a-fA-F]{2})/,p={".":"MatchAnyChar","|":"MatchEither","?":"MatchZeroOrOne","*":"MatchZeroOrMore","+":"MatchOneOrMore","^":"MatchStart",$:"MatchEnd","{":"StartRepeats","}":"EndRepeats","(":"StartGroup",")":"EndGroup","[":"StartCharGroup","]":"EndCharGroup"},s={"\\":"EscapeChar","/":"/",0:"NULChar",f:"FormFeed",n:"LineFeed",r:"CarriageReturn",t:"HorizontalTab",v:"VerticalTab",b:"MatchWordBoundary",B:"MatchNonWordBoundary",s:"MatchSpaceChar",S:"MatchNonSpaceChar",w:"MatchWordChar",W:"MatchNonWordChar",d:"MatchDigitChar",D:"MatchNonDigitChar"},h=Object.prototype.toString,n=function(t,e){if(e&&(e instanceof Array||"[object Array]"==h.call(e)))for(var r=0,a=e.length;a>r;r++)t[e[r]]=1;else for(var r in e)t[r]=1;return t},i=function(t,e){t&&(t instanceof Array||"[object Array]"==h.call(t))&&(e=t[1],t=t[0]);var r,a,p=t.charCodeAt(0),s=e.charCodeAt(0);if(s==p)return[String.fromCharCode(p)];for(a=[],r=p;s>=r;++r)a.push(String.fromCharCode(r));return a},g=function(t){var e,r,a,p,s,h,o={},l={};if("Alternation"==t.type)for(a=0,p=t.part.length;p>a;a++)s=g(t.part[a]),o=n(o,s.peek),l=n(l,s.negativepeek);else if("Group"==t.type)s=g(t.part),o=n(o,s.peek),l=n(l,s.negativepeek);else if("Sequence"==t.type){for(a=0,p=t.part.length,r=t.part[a],h=a>=p||!r||"Quantifier"!=r.type||!r.flags.MatchZeroOrMore&&!r.flags.MatchZeroOrOne&&"0"!=r.flags.MatchMinimum;!h;)s=g(r.part),o=n(o,s.peek),l=n(l,s.negativepeek),a++,r=t.part[a],h=a>=p||!r||"Quantifier"!=r.type||!r.flags.MatchZeroOrMore&&!r.flags.MatchZeroOrOne&&"0"!=r.flags.MatchMinimum;p>a&&(r=t.part[a],"Special"!=r.type||"^"!=r.part&&"$"!=r.part||(r=t.part[a+1]||null),r&&"Quantifier"==r.type&&(r=r.part),r&&(s=g(r),o=n(o,s.peek),l=n(l,s.negativepeek)))}else if("CharGroup"==t.type)for(e=t.flags.NotMatch?l:o,a=0,p=t.part.length;p>a;a++)r=t.part[a],"Chars"==r.type?e=n(e,r.part):"CharRange"==r.type?e=n(e,i(r.part)):"UnicodeChar"==r.type||"HexChar"==r.type?e[r.flags.Char]=1:"Special"==r.type&&("D"==r.part?t.flags.NotMatch?o["\\d"]=1:l["\\d"]=1:"W"==r.part?t.flags.NotMatch?o["\\w"]=1:l["\\W"]=1:"S"==r.part?t.flags.NotMatch?o["\\s"]=1:l["\\s"]=1:e["\\"+r.part]=1);else"String"==t.type?o[t.part.charAt(0)]=1:"Special"!=t.type||t.flags.MatchStart||t.flags.MatchEnd?("UnicodeChar"==t.type||"HexChar"==t.type)&&(o[t.flags.Char]=1):"D"==t.part?l["\\d"]=1:"W"==t.part?l["\\W"]=1:"S"==t.part?l["\\s"]=1:o["\\"+t.part]=1;return{peek:o,negativepeek:l}},o=function(t,e){t&&this.setRegex(t,e)};return o.VERSION="0.2.4",o.getCharRange=i,o.prototype={constructor:o,VERSION:o.VERSION,regex:null,groupIndex:null,pos:null,flags:null,parts:null,getCharRange:o.getCharRange,getPeekChars:function(){var t,e,r,a,s=this.flags&&this.flags.i,h=g(this.parts);for(t in h){a={},r=h[t];for(e in r)"\\d"==e?(delete r[e],a=n(a,i("0","9"))):"\\s"==e?(delete r[e],a=n(a,["\f","\n","\r","	",""," ","\u2028","\u2029"])):"\\w"==e?(delete r[e],a=n(a,["_"].concat(i("0","9")).concat(i("a","z")).concat(i("A","Z")))):"\\."==e?(delete r[e],a[p["."]]=1):"\\"!=e.charAt(0)&&s?(a[e.toLowerCase()]=1,a[e.toUpperCase()]=1):"\\"==e.charAt(0)&&delete r[e];h[t]=n(r,a)}return h},setRegex:function(t,e){if(t){this.flags={},e=e||"/";for(var r=t.toString(),a=r.length,p=r.charAt(a-1);e!=p;)this.flags[p]=1,r=r.substr(0,a-1),a=r.length,p=r.charAt(a-1);e==r.charAt(0)&&e==r.charAt(a-1)&&(r=r.substr(1,a-2)),this.regex=r}return this},analyze:function(){var h,n,i,g="",o=[],l=[],u=!1;for(this.pos=0,this.groupIndex=0;this.pos<this.regex.length;)h=this.regex.charAt(this.pos++),u=t==h?!0:!1,u&&(h=this.regex.charAt(this.pos++)),u?"u"==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),i=r.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,l.push({part:i[0],flags:{Char:String.fromCharCode(parseInt(i[1],16)),Code:i[1]},type:"UnicodeChar"})):"x"==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),i=a.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,l.push({part:i[0],flags:{Char:String.fromCharCode(parseInt(i[1],16)),Code:i[1]},type:"HexChar"})):s[h]&&"/"!=h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),n={},n[s[h]]=1,l.push({part:h,flags:n,type:"Special"})):g+=h:"|"==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),o.push({part:l,flags:{},type:"Sequence"}),l=[]):"["==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),l.push(this.chargroup())):"("==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),l.push(this.subgroup())):"{"==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),i=e.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,l.push({part:l.pop(),flags:{part:i[0],MatchMinimum:i[1],MatchMaximum:i[2]||"unlimited"},type:"Quantifier"})):"*"==h||"+"==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),n={},n[p[h]]=1,"?"==this.regex.charAt(this.pos)?(n.isGreedy=0,this.pos++):n.isGreedy=1,l.push({part:l.pop(),flags:n,type:"Quantifier"})):"?"==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),n={},n[p[h]]=1,l.push({part:l.pop(),flags:n,type:"Quantifier"})):p[h]?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),n={},n[p[h]]=1,l.push({part:h,flags:n,type:"Special"})):g+=h;return g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),o.length?(o.push({part:l,flags:{},type:"Sequence"}),l=[],n={},n[p["|"]]=1,this.parts={part:o,flags:n,type:"Alternation"}):this.parts={part:l,flags:{},type:"Sequence"},this},subgroup:function(){var h,n,i,g="",o=[],l=[],u={},f=!1,c=this.regex.substr(this.pos,2);for("?:"==c?(u.NotCaptured=1,this.pos+=2):"?="==c?(u.LookAhead=1,this.pos+=2):"?!"==c&&(u.NegativeLookAhead=1,this.pos+=2),u.GroupIndex=++this.groupIndex;this.pos<this.regex.length;)if(h=this.regex.charAt(this.pos++),f=t==h?!0:!1,f&&(h=this.regex.charAt(this.pos++)),f)"u"==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),i=r.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,l.push({part:i[0],flags:{Char:String.fromCharCode(parseInt(i[1],16)),Code:i[1]},type:"UnicodeChar"})):"x"==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),i=a.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,l.push({part:i[0],flags:{Char:String.fromCharCode(parseInt(i[1],16)),Code:i[1]},type:"HexChar"})):s[h]&&"/"!=h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),n={},n[s[h]]=1,l.push({part:h,flags:n,type:"Special"})):g+=h;else{if(")"==h)return g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),o.length?(o.push({part:l,flags:{},type:"Sequence"}),l=[],n={},n[p["|"]]=1,{part:{part:o,flags:n,type:"Alternation"},flags:u,type:"Group"}):{part:{part:l,flags:{},type:"Sequence"},flags:u,type:"Group"};"|"==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),o.push({part:l,flags:{},type:"Sequence"}),l=[]):"["==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),l.push(this.chargroup())):"("==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),l.push(this.subgroup())):"{"==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),i=e.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,l.push({part:l.pop(),flags:{part:i[0],MatchMinimum:i[1],MatchMaximum:i[2]||"unlimited"},type:"Quantifier"})):"*"==h||"+"==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),n={},n[p[h]]=1,"?"==this.regex.charAt(this.pos)?(n.isGreedy=0,this.pos++):n.isGreedy=1,l.push({part:l.pop(),flags:n,type:"Quantifier"})):"?"==h?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),n={},n[p[h]]=1,l.push({part:l.pop(),flags:n,type:"Quantifier"})):p[h]?(g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),n={},n[p[h]]=1,l.push({part:h,flags:n,type:"Special"})):g+=h}return g.length&&(l.push({part:g,flags:{},type:"String"}),g=""),o.length?(o.push({part:l,flags:{},type:"Sequence"}),l=[],n={},n[p["|"]]=1,{part:{part:o,flags:n,type:"Alternation"},flags:u,type:"Group"}):{part:{part:l,flags:{},type:"Sequence"},flags:u,type:"Group"}},chargroup:function(){var e,p,h,n,i,g,o=[],l=[],u={},f=!1,c=!1;for("^"==this.regex.charAt(this.pos)&&(u.NotMatch=1,this.pos++);this.pos<this.regex.length;)if(g=!1,h=p,p=this.regex.charAt(this.pos++),c=t==p?!0:!1,c&&(p=this.regex.charAt(this.pos++)),c&&("u"==p?(i=r.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,p=String.fromCharCode(parseInt(i[1],16)),g=!0):"x"==p&&(i=a.exec(this.regex.substr(this.pos-1)),this.pos+=i[0].length-1,p=String.fromCharCode(parseInt(i[1],16)),g=!0)),f)l.length&&(o.push({part:l,flags:{},type:"Chars"}),l=[]),n[1]=p,f=!1,o.push({part:n,flags:{},type:"CharRange"});else if(c)!g&&s[p]&&"/"!=p?(l.length&&(o.push({part:l,flags:{},type:"Chars"}),l=[]),e={},e[s[p]]=1,o.push({part:p,flags:e,type:"Special"})):l.push(p);else{if("]"==p)return l.length&&(o.push({part:l,flags:{},type:"Chars"}),l=[]),{part:o,flags:u,type:"CharGroup"};"-"==p?(n=[h,""],l.pop(),f=!0):l.push(p)}return l.length&&(o.push({part:l,flags:{},type:"Chars"}),l=[]),{part:o,flags:u,type:"CharGroup"}}},o});/**
*
*   CodeMirrorGrammar
*   @version: 0.5
*   Transform a grammar specification in JSON format,
*   into a CodeMirror syntax-highlight parser mode
*
*   https://github.com/foo123/codemirror-grammar
*
**/!function(t,e,n,s){n=n?[].concat(n):[];var i,r=n.length,o=new Array(r),h=new Array(r),u=new Array(r);for(i=0;r>i;i++)o[i]=n[i][0],h[i]=n[i][1];if("object"==typeof module&&module.exports){if("undefined"==typeof module.exports[e]){for(i=0;r>i;i++)u[i]=module.exports[o[i]]||require(h[i])[o[i]];module.exports[e]=s.apply(t,u)}}else if("function"==typeof define&&define.amd)define(["exports"].concat(h),function(n){if("undefined"==typeof n[e]){for(var i=Array.prototype.slice.call(arguments,1),r=0,h=i.length;h>r;r++)u[r]=n[o[r]];n[e]=s.apply(t,u)}});else if("undefined"==typeof t[e]){for(i=0;r>i;i++)u[i]=t[o[i]];t[e]=s.apply(t,u)}}(this,"CodeMirrorGrammar",[["Classy","./classy"],["RegExAnalyzer","./regexanalyzer"]],function(t,e,n){var s,i="0.5",r=t.Class,o=2,h=4,u=8,l=9,c=16,a=32,k=64,f=128,p=256,g=512,m=33,R=34,d=36,y=40,E=48,O=64,v=128,x=4,B=8,P=16,b=32,T=64,w=65,C=128,A=256,S=512,q=1024,N=2048,L=4096,_=8192,M={ONEOF:C,EITHER:C,ALL:A,ALLOF:A,ZEROORONE:S,ZEROORMORE:q,ONEORMORE:N},j={BLOCK:T,COMMENT:w,"ESCAPED-BLOCK":b,SIMPLE:P,GROUP:L,NGRAM:_,"N-GRAM":_},D=Array.prototype.slice,G=(Array.prototype.splice,Array.prototype.concat,Object.prototype.hasOwnProperty),F=Object.prototype.toString,I=function(t){var e=typeof t,s=F.call(t);return"number"==e||t instanceof Number?o:!0===t||!1===t?h:t&&("string"==e||t instanceof String)?1==t.length?l:u:t&&("[object RegExp]"==s||t instanceof RegExp)?c:t&&("[object Array]"==s||t instanceof Array)?a:t&&"[object Object]"==s?k:null===t?f:n===t?p:g},K=function(t,e){return e||a!=I(t)?[t]:t},U=function(t,e){return t=K(t,e),(e||a!=I(t[0]))&&(t=[t]),t},z=function(t){var e,n=I(t);if(k!=n&&a!=n)return t;var s,i={};for(s in t)G.call(t,s)&&(e=I(t[s]),i[s]=k==e?z(t[s]):a==e?t[s].slice():t[s]);return i},$=function(){var t=D.call(arguments),e=t.length;if(1>e)return null;if(2>e)return z(t[0]);var n,s,i,r,o=t.shift(),h=z(o);for(e--,s=0;e>s;s++)if(n=t.shift())for(i in n)G.call(n,i)&&(G.call(o,i)?(r=I(o[i]),k&~u&r&&(h[i]=$(o[i],n[i]))):h[i]=z(n[i]));return h},Z=/([\-\.\*\+\?\^\$\{\}\(\)\|\[\]\/\\])/g,H=function(t,e){return e.length-t.length},V=function(t,e){return u&I(e)&&u&I(t)&&e.length&&e.length<=t.length&&e==t.substr(0,e.length)},J=function(t,n,s){if(!t||o==I(t))return t;var i=n?n.length||0:0;if(i&&n==t.substr(0,i)){var r,h,u,l="^("+t.substr(i)+")";return s[l]||(r=new RegExp(l),u=new e(r).analyze(),h=u.getPeekChars(),Object.keys(h.peek).length||(h.peek=null),Object.keys(h.negativepeek).length||(h.negativepeek=null),s[l]=[r,h]),s[l]}return t},Q=function(t,e){var n,s,i={},r="";for(u==I(e)&&(r=e),n=0,s=t.length;s>n;n++)i[t[n].charAt(0)]=1,t[n]=t[n].replace(Z,"\\$1");return[new RegExp("^("+t.sort(H).join("|")+")"+r),{peek:i,negativepeek:null},1]},W=r({constructor:function(t){this.string=t?""+t:"",this.start=this.pos=0,this.stream=null},stream:null,string:"",start:0,pos:0,fromStream:function(t){return this.stream=t,this.string=""+t.string,this.start=t.start,this.pos=t.pos,this},sol:function(){return 0==this.pos},eol:function(){return this.pos>=this.string.length},chr:function(t,e){e=!1!==e;var n=this.string.charAt(this.pos)||"";return t==n?(e&&(this.pos+=1,this.stream&&(this.stream.pos=this.pos)),n):!1},str:function(t,e,n){n=!1!==n;var s=this.pos,i=this.string.charAt(s);if(e.peek[i]){var r=t.length,o=this.string.substr(s,r);if(t==o)return n&&(this.pos+=r,this.stream&&(this.stream.pos=this.pos)),o}return!1},rex:function(t,e,n,s){n=!1!==n,s=s||0;var i=this.pos,r=this.string.charAt(i);if(e.peek&&e.peek[r]||e.negativepeek&&!e.negativepeek[r]){var o=this.string.slice(i).match(t);return!o||o.index>0?!1:(n&&(this.pos+=o[s].length,this.stream&&(this.stream.pos=this.pos)),o)}return!1},mch:function(t,e,n,s){if("string"!=typeof t){s=s||0;var i=this.string.slice(this.pos).match(t);return i&&i.index>0?null:(i&&e!==!1&&(this.pos+=i[s].length),i)}var r=function(t){return n?t.toLowerCase():t},o=this.string.substr(this.pos,t.length);return r(o)==r(t)?(e!==!1&&(this.pos+=t.length),!0):void 0},end:function(){return this.pos=this.string.length,this.stream&&(this.stream.pos=this.pos),this},pk:function(){return this.string.charAt(this.pos)},nxt:function(){if(this.pos<this.string.length){var t=this.string.charAt(this.pos++);return this.stream&&(this.stream.pos=this.pos),t}},bck:function(t){return this.pos-=t,this.stream&&(this.stream.pos=this.pos),this},bck2:function(t){return this.pos=t,this.stream&&(this.stream.pos=this.pos),this},space:function(){for(var t=this.pos;/[\s\u00a0]/.test(this.string.charAt(this.pos));)++this.pos;return this.stream&&(this.stream.pos=this.pos),this.pos>t},cur:function(){return this.string.slice(this.start,this.pos)},sft:function(){return this.start=this.pos,this}}),X=r({constructor:function(t){this.id=t||0,this.stack=[],this.inBlock=null,this.endBlock=null,this.currentToken=B},id:0,stack:null,inBlock:null,endBlock:null,currentToken:null,clone:function(){var t=new this.$class;return t.id=this.id,t.stack=this.stack.slice(),t.inBlock=this.inBlock,t.endBlock=this.endBlock,t.currentToken=this.currentToken,t},toString:function(){return"_"+this.id+"_"+this.inBlock}}),Y=r({constructor:function(t,e,n,s){this.name=t,this.pattern=e,this.key=n||0,this.type=s||E},name:null,pattern:null,peek:null,type:null,key:0,toString:function(){var t="[";return t+="Matcher: "+this.name,t+=", Type: "+this.type,t+=", Pattern: "+(this.pattern?this.pattern.toString():null),t+="]"},get:function(){return[this.key,this.pattern]}}),te=r({Extends:Y},{constructor:function(t,e,n){this.name=t,this.pattern=e,this.type=m,this.key=n||0},get:function(t,e){var n;return(n=t.chr(this.pattern,e))?[this.key,n]:!1}}),ee=r({Extends:Y},{constructor:function(t,e,n){this.name=t,this.pattern=e,this.peek={peek:{},negativepeek:null},this.peek.peek[""+e.charAt(0)]=1,this.type=R,this.key=n||0},get:function(t,e){var n;return(n=t.str(this.pattern,this.peek,e))?[this.key,n]:!1}}),ne=r({Extends:Y},{constructor:function(t,e,n){this.name=t,this.pattern=e[0],this.peek=e[1],this.isComposite=e[2]||0,this.type=d,this.key=n||0},isComposite:0,get:function(t,e){var n;return(n=t.rex(this.pattern,this.peek,e,this.isComposite))?[this.key,n]:!1}}),se=r({Extends:Y},{constructor:function(t,e,n){this.name=t,this.type=y,this.key=n||0},get:function(t,e){return!1!==e&&t.end(),[this.key,""]}}),ie=r({Extends:Y},{constructor:function(t,e,n){this.name=t,this.matchers=e,this.type=O,this.ownKey=!1!==n},matchers:null,ownKey:!0,get:function(t,e){var n,s,i=this.matchers,r=i.length;for(n=0;r>n;n++)if(s=i[n].get(t,e))return this.ownKey?[n,s[1]]:s;return!1}}),re=r({Extends:Y},{constructor:function(t,e,n){this.name=t,this.type=v,this.start=new ie(this.name+"_StartMatcher",e,!1),this.pattern=this.start.pattern||null,this.end=n},start:null,end:null,get:function(t,e){var n=this.start.get(t,e);if(n){var s=this.end[n[0]];return o==I(s)&&(s=new ee(this.name+"_EndMatcher",n[1][s+1])),s}return!1}}),oe=function(t,e,n,s){n=n||0;var i,r=t+"_SimpleMatcher",c=I(e);return o==c?e:(s[r]||(i=h==c?new Y(r,e,n):f==c?new se(r,e,n):l==c?new te(r,e,n):u==c?new ee(r,e,n):a==c?new ne(r,e,n):e,s[r]=i),s[r])},he=function(t,e,n,s,i,r){var o,h,u,l,c,k=!1,f=!1,p=t+"_CompoMatcher";if(!r[p]){if(o=K(e),u=o.length,s)for(l=(u>>1)+1,h=0;l>=h;h++){if(a==I(o[h])||a==I(o[u-1-h])){k=!0;break}if(V(o[h],n)||V(o[u-1-h],n)){f=!0;break}}if(!s||k||f){for(h=0;u>h;h++)o[h]=a==I(o[h])?he(p+"_"+h,o[h],n,s,i,r):oe(p+"_"+h,J(o[h],n,i),h,r);c=o.length>1?new ie(p,o):o[0]}else c=oe(p,Q(o,s),0,r);r[p]=c}return r[p]},ue=function(t,e,n,s,i){var r,o,h,u,l,c,a,k=t+"_BlockMatcher";if(!i[k]){for(u=[],l=[],r=U(e),o=0,h=r.length;h>o;o++)c=oe(k+"_0_"+o,J(r[o][0],n,s),o,i),a=r[o].length>1?oe(k+"_1_"+o,J(r[o][1],n,s),o,i):c,u.push(c),l.push(a);i[k]=new re(k,u,l)}return i[k]},le=r({constructor:function(t,e,n,s){t&&(this.name=t),e&&(this.token=e),n&&(this.type=n),s&&(this.style=s),this.tokenName=this.name},name:null,token:null,tokenName:null,type:null,style:null,isRequired:!1,ERROR:!1,streamPos:null,stackPos:null,actionBefore:null,actionAfter:null,toString:function(){var t="[";return t+="Tokenizer: "+this.name,t+=", Type: "+this.type,t+=", Token: "+(this.token?this.token.toString():null),t+="]"},required:function(t){return this.isRequired=t?!0:!1,this},pushToken:function(t,e,n){return this.stackPos?t.splice(this.stackPos+(n||0),0,e):t.push(e),this},clone:function(){var t,e,n=D.call(arguments),s=n.length;for(t=new this.$class,t.name=this.name,t.tokenName=this.tokenName,t.token=this.token,t.type=this.type,t.style=this.style,t.isRequired=this.isRequired,t.ERROR=this.ERROR,t.streamPos=this.streamPos,t.stackPos=this.stackPos,t.actionBefore=this.actionBefore,t.actionAfter=this.actionAfter,e=0;s>e;e++)t[n[e]]=this[n[e]];return t},get:function(t,e){return this.token.get(t)?(e.currentToken=this.type,this.style):!1}}),ce=r({Extends:le},{constructor:function(t,e,n,s,i){t&&(this.name=t),e&&(this.token=e),n&&(this.type=n),s&&(this.style=s),this.multiline=!1!==i,this.endBlock=null,this.tokenName=this.name},multiline:!1,endBlock:null,get:function(t,e){var n=!1,s=!1;if(e.inBlock==this.name?(s=!0,this.endBlock=e.endBlock):!e.inBlock&&(this.endBlock=this.token.get(t))&&(s=!0,e.inBlock=this.name,e.endBlock=this.endBlock),s){for(this.stackPos=e.stack.length,n=this.endBlock.get(t);!n&&!t.eol();){if(this.endBlock.get(t)){n=!0;break}t.nxt()}return n=n||!this.multiline&&t.eol(),n?(e.inBlock=null,e.endBlock=null):this.pushToken(e.stack,this),e.currentToken=this.type,this.style}return e.inBlock=null,e.endBlock=null,!1}}),ae=r({Extends:ce},{constructor:function(t,e,n,s,i,r){t&&(this.name=t),e&&(this.token=e),n&&(this.type=n),s&&(this.style=s),this.escape=i||"\\",this.multiline=r||!1,this.endBlock=null,this.tokenName=this.name},escape:"\\",get:function(t,e){var n="",s=!1,i=!1,r=!1;if(e.inBlock==this.name?(i=!0,this.endBlock=e.endBlock):!e.inBlock&&(this.endBlock=this.token.get(t))&&(i=!0,e.inBlock=this.name,e.endBlock=this.endBlock),i){for(this.stackPos=e.stack.length,s=this.endBlock.get(t);!s&&!t.eol();){if(!r&&this.endBlock.get(t)){s=!0;break}n=t.nxt(),r=!r&&n==this.escape}return s=s||!(r&&this.multiline),s?(e.inBlock=null,e.endBlock=null):this.pushToken(e.stack,this),e.currentToken=this.type,this.style}return e.inBlock=null,e.endBlock=null,!1}}),ke=r({Extends:le},{constructor:function(t,e){t&&(this.name=t),e&&(this.type=e),this.tokenName=this.name},tokens:null,buildTokens:function(t){return t&&(this.tokens=K(t),this.token=this.tokens[0]),this}}),fe=r({Extends:ke},{constructor:function(t,e){this.type=S,t&&(this.name=t),e&&this.buildTokens(e),this.tokenName=this.name},get:function(t,e){this.isRequired=!1,this.ERROR=!1,this.streamPos=t.pos;var n=this.token.get(t,e);return token.ERROR&&t.bck2(this.streamPos),n}}),pe=r({Extends:ke},{constructor:function(t,e){this.type=q,t&&(this.name=t),e&&this.buildTokens(e),this.tokenName=this.name},get:function(t,e,n){var s,i,r,o=this.tokens.length,h=0;for(this.isRequired=!1,this.ERROR=!1,this.streamPos=t.pos,this.stackPos=e.stack.length,s=0;o>s;s++){if(i=this.tokens[s],r=i.get(t,e,n),!1!==r)return this.pushToken(e.stack,this),r;i.ERROR&&(h++,t.bck2(this.streamPos))}return!1}}),ge=r({Extends:ke},{constructor:function(t,e){this.type=N,t&&(this.name=t),e&&this.buildTokens(e),this.foundOne=!1,this.tokenName=this.name},foundOne:!1,get:function(t,e,n){var s,i,r,o=this.tokens.length,h=0,u=0;for(this.isRequired=!this.foundOne,this.ERROR=!1,this.streamPos=t.pos,this.stackPos=e.stack.length,r=0;o>r;r++){if(i=this.tokens[r],s=i.get(t,e,n),h+=i.isRequired?1:0,!1!==s)return this.foundOne=!0,this.isRequired=!1,this.ERROR=!1,this.pushToken(e.stack,this.clone("tokens","foundOne")),this.foundOne=!1,s;i.ERROR&&(u++,t.bck2(this.streamPos))}return this.ERROR=this.foundOne?!1:!0,!1}}),me=r({Extends:ke},{constructor:function(t,e){this.type=C,t&&(this.name=t),e&&this.buildTokens(e),this.tokenName=this.name},get:function(t,e,n){var s,i,r,o=this.tokens.length,h=0,u=0;for(this.isRequired=!0,this.ERROR=!1,this.streamPos=t.pos,r=0;o>r;r++){if(i=this.tokens[r],s=i.get(t,e,n),h+=i.isRequired?1:0,!1!==s)return s;i.ERROR&&(u++,t.bck2(this.streamPos))}return this.isRequired=h>0?!0:!1,this.ERROR=o==u&&h>0?!0:!1,!1}}),Re=r({Extends:ke},{constructor:function(t,e){this.type=A,t&&(this.name=t),e&&this.buildTokens(e),this.tokenName=this.name},get:function(t,e,n){var s,i,r=this.tokens.length,o=!1;if(this.isRequired=!0,this.ERROR=!1,this.streamPos=t.pos,this.stackPos=e.stack.length,s=this.tokens[0],i=s.required(!0).get(t,e,n),!1!==i){this.stackPos=e.stack.length;for(var h=r-1;h>0;h--)this.pushToken(e.stack,this.tokens[h].required(!0),r-h);o=i}else s.ERROR?(this.ERROR=!0,t.bck2(this.streamPos)):s.isRequired&&(this.ERROR=!0);return o}}),de=r({Extends:ke},{constructor:function(t,e){this.type=_,t&&(this.name=t),e&&this.buildTokens(e),this.tokenName=this.tokens[0].name},get:function(t,e,n){var s,i,r=this.tokens.length,o=!1;if(this.isRequired=!1,this.ERROR=!1,this.streamPos=t.pos,this.stackPos=e.stack.length,s=this.tokens[0],i=s.required(!1).get(t,e,n),!1!==i){this.stackPos=e.stack.length;for(var h=r-1;h>0;h--)this.pushToken(e.stack,this.tokens[h].required(!0),r-h);o=i}else s.ERROR&&t.bck2(this.streamPos);return o}}),ye=function(t,e,n,i,r,o,h,u,l){var c,a,k,f,p,g=null;if(!l[t]){if(c=i[t]||r[t]||null)if(a=c.type||"simple",a=j[a.toUpperCase()],p=c.action||null,T==a||w==a)g=new ce(t,ue(t,c.tokens.slice(),e,h,u),a,o[t]||s,c.multiline);else if(b==a)g=new ae(t,ue(t,c.tokens.slice(),e,h,u),a,o[t]||s,c.escape||"\\",c.multiline||!1);else if(P==a)g=new le(t,he(t,c.tokens.slice(),e,n[t],h,u),a,o[t]||s);else if(L==a){k=M[c.match.toUpperCase()],f=K(c.tokens).slice();for(var m=0,R=f.length;R>m;m++)f[m]=ye(f[m],e,n,i,r,o,h,u,l);g=S==k?new fe(t,f):q==k?new pe(t,f):N==k?new ge(t,f):C==k?new me(t,f):new Re(t,f)}else if(_==a){g=U(K(c.tokens).slice()).slice();for(var m=0,R=g.length;R>m;m++){for(var d=g[m],y=0,E=d.length;E>y;y++)d[y]=ye(d[y],e,n,i,r,o,h,u,l);g[m]=new de(t+"_NGRAM_"+m,d)}}l[t]=g}return l[t]},Ee=r({constructor:function(t,e){this.LOC=e,this.Style=t.Style||{},this.electricChars=t.electricChars?t.electricChars:!1,this.DEF=this.LOC.DEFAULT,this.ERR=this.Style.error||this.LOC.ERROR,this.tokens=t.Parser||[]},LOC:null,ERR:null,DEF:null,Style:null,electricChars:!1,tokens:null,getToken:function(t,e){var n,s,i,r,o,h=this.tokens.length,u=this.LOC,l=this.DEF,c=this.ERR;if(o=e.stack,r=(new W).fromStream(t),r.space())return e.currentToken=B,l;for(;o.length;){if(s=o.pop(),i=s.get(r,e,u),!1!==i)return i;if(s.ERROR||s.isRequired)return o.length=0,r.nxt(),e.currentToken=x,c}for(n=0;h>n;n++){if(s=this.tokens[n],i=s.get(r,e,u),!1!==i)return i;if(s.ERROR||s.isRequired)return o.length=0,r.nxt(),e.currentToken=x,c}return r.nxt(),e.currentToken=B,l},indent:function(){return CodeMirror.Pass}}),Oe=function(t,e){return new Ee(t,e)},ve=function(t){return function(e,n){return t.LOC.conf=e,t.LOC.parserConf=n,{startState:function(){return new X},electricChars:t.electricChars,copyState:function(t){return t.clone()},token:function(e,n){return t.getToken(e,n)},indent:function(e,n,s){return t.indent(e,n,s)}}}},xe={RegExpID:null,RegExpGroups:null,Style:{error:"error"},Lex:null,Syntax:null,Parser:null},Be=function(t){var e,n,s,i,r,o,h,u,l,c,k,f={},p={},g={};if(t.__parsed)return t;for(t=$(t,xe),e=t.RegExpID||null,t.RegExpID=null,delete t.RegExpID,n=t.RegExpGroups||{},t.RegExpGroups=null,delete t.RegExpGroups,h=t.Lex||{},t.Lex=null,delete t.Lex,u=t.Syntax||{},t.Syntax=null,delete t.Syntax,o=t.Style||{},r=t.Parser||[],i=r.length,s=[],l=0;i>l;l++)c=r[l],k=ye(c,e,n,h,u,o,f,p,g)||null,k&&(a==I(k)?s=s.concat(k):s.push(k));return t.Parser=s,t.Style=o,t.__parsed=!0,t},Pe={VERSION:i,extend:$,parse:Be,getMode:function(t,e){s=null,t=Be(t);var n={DEFAULT:e||s,ERROR:xe.Style.error};return ve(Oe(t,n))}};return Pe});