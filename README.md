codemirror-grammar
==================

__Transform a JSON grammar into a CodeMirror syntax-highlight parser__


![CodeMirror Grammar](/codemirror-grammar.png)

A simple and light-weight (~ 55kB minified, ~ 18kB zipped) [CodeMirror](https://github.com/marijnh/codemirror) add-on

to generate syntax-highlight parsers (codemirror modes) from a grammar specification in JSON format.


**see also:**

* [Abacus](https://github.com/foo123/Abacus) advanced Combinatorics and Algebraic Number Theory Symbolic Computation library for JavaScript, Python
* [Plot.js](https://github.com/foo123/Plot.js) simple and small library which can plot graphs of functions and various simple charts and can render to Canvas, SVG and plain HTML
* [HAAR.js](https://github.com/foo123/HAAR.js) image feature detection based on Haar Cascades in JavaScript (Viola-Jones-Lienhart et al Algorithm)
* [HAARPHP](https://github.com/foo123/HAARPHP) image feature detection based on Haar Cascades in PHP (Viola-Jones-Lienhart et al Algorithm)
* [FILTER.js](https://github.com/foo123/FILTER.js) video and image processing and computer vision Library in pure JavaScript (browser and node)
* [Xpresion](https://github.com/foo123/Xpresion) a simple and flexible eXpression parser engine (with custom functions and variables support), based on [GrammarTemplate](https://github.com/foo123/GrammarTemplate), for PHP, JavaScript, Python
* [Regex Analyzer/Composer](https://github.com/foo123/RegexAnalyzer) Regular Expression Analyzer and Composer for PHP, JavaScript, Python
* [GrammarTemplate](https://github.com/foo123/GrammarTemplate) grammar-based templating for PHP, JavaScript, Python
* [codemirror-grammar](https://github.com/foo123/codemirror-grammar) transform a formal grammar in JSON format into a syntax-highlight parser for CodeMirror editor
* [ace-grammar](https://github.com/foo123/ace-grammar) transform a formal grammar in JSON format into a syntax-highlight parser for ACE editor
* [prism-grammar](https://github.com/foo123/prism-grammar) transform a formal grammar in JSON format into a syntax-highlighter for Prism code highlighter
* [highlightjs-grammar](https://github.com/foo123/highlightjs-grammar) transform a formal grammar in JSON format into a syntax-highlight mode for Highlight.js code highlighter
* [syntaxhighlighter-grammar](https://github.com/foo123/syntaxhighlighter-grammar) transform a formal grammar in JSON format to a highlight brush for SyntaxHighlighter code highlighter
* [SortingAlgorithms](https://github.com/foo123/SortingAlgorithms) implementations of Sorting Algorithms in JavaScript
* [PatternMatchingAlgorithms](https://github.com/foo123/PatternMatchingAlgorithms) implementations of Pattern Matching Algorithms in JavaScript



**Note:** The invariant codebase for all the `*-grammar` add-ons resides at [editor-grammar](https://github.com/foo123/editor-grammar) repository (used as a `git submodule`)


### Contents

* [Live Playground Example](https://foo123.github.io/examples/codemirror-grammar)
* [Todo](#todo)
* [Features](#features)
* [How To use](#how-to-use)
* [API Reference](/api-reference.md)
* [Grammar Reference](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md)
* [Other Examples](#other-examples)

[![Build your own syntax-highlight mode on the fly](/test/screenshot.png)](https://foo123.github.io/examples/codemirror-grammar)


### Todo

Code Indentation is Codemirror default, see [Modularity and Future Directions](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#modularity-and-future-directions)


* handle arbitrary, user-defined, code `(de-)indentation` in the `grammar` specification (e.g via `indent action` tokens)
* handle arbitrary, user-defined, code `matching` (e.g `brackets`, `tags`, etc..) in the `grammar` specification (e.g via `match action` tokens) [DONE]
<!--* handle arbitrary, user-defined, `(operator) precedence` relations in the `grammar` specification (e.g via `precedence action` tokens)-->
* handle arbitrary, user-defined, `local/global/scoped` relations in the `grammar` specification (e.g via `scope action` tokens) [DONE]
* and so on..
* enable grammar add-on to pre-compile a grammar specification directly into mode source code, so it can be used without the add-on as standalone mode [TODO, maybe]



### Features

* A [`Grammar`](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md) can **extend other `Grammars`** (so arbitrary `variations` and `dialects` can be handled more easily)
* `Grammar` includes: [`Style Model`](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#style-model) , [`Lex Model`](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#lexical-model) and [`Syntax Model` (optional)](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#syntax-model), plus a couple of [*settings*](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#extra-settings) (see examples)
* **`Grammar` specification can be minimal**, defaults will be used (see example grammars)
* [`Grammar.Syntax Model`](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#syntax-model) can enable highlight in a more *context-specific* way, plus detect possible *syntax errors* and display appropriate *error messages* (see below)
* [`Grammar.Syntax Model`](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#syntax-model) can contain **recursive references** (see `/test/grammar-js-recursion.html`)
* [`Grammar.Syntax Model`](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#syntax-pegbnf-like-notations) can be (fully) specificed using [`PEG`](https://en.wikipedia.org/wiki/Parsing_expression_grammar)-like notation or [`BNF`](https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_Form)-like notation  (**NEW feature**)
* [`Grammar.Syntax Model`](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#syntax-pegbnf-like-notations) implements **positive / negative lookahead tokens** (analogous to `PEG` `and-`/`not-` predicates)  (**NEW feature**)
* [`Grammar.Syntax Model`](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#syntax-model) can include **external (sub-)grammars so that new multiplexed / mixed grammars** are created easily and intuitively (see test examples) (**NEW feature**)
* `Grammar` can define [*action* tokens](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#action-tokens) to perform *complex context-specific* parsing functionality, including **associated tag matching** and **duplicate identifiers** (see for example `xml.grammar` example) (**NEW feature**)
* Generated highlight modes can support **toggle comments** and **keyword autocompletion** functionality if defined in the grammar
* **Context-sensitive autocompletion** extracted directly from the grammar specification  (**NEW feature**)
* **Dynamic (Context-sensitive) autocompletion** from typed user actions like code/token/symbols  (**NEW feature**)
* Generated highlight modes can support **lint-like syntax-annotation** functionality generated from the grammar
* Generated highlight modes can support custom, user-defined, **code folding** functionality from the [grammar `fold` model](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#code-folding)  (**NEW feature**)
* Generated highlight modes can support custom, user-defined, **code token matching** functionality from the [grammar `match` model](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#code-matching)  (**NEW feature**)
* Generated parsers are **optimized for speed and size**
* Can generate a syntax-highlight parser from a grammar **interactively and on-the-fly** ( see example, http://foo123.github.io/examples/codemirror-grammar )
* see also [Modularity and Future Directions](https://github.com/foo123/editor-grammar/blob/master/grammar-reference.md#modularity-and-future-directions)



### How to use:

See working examples under [/test](/test) folder.

An example for XML:


```javascript
// 1. a partial xml grammar in simple JSON format
var xml_grammar = {
    
// prefix ID for regular expressions, represented as strings, used in the grammar
"RegExpID"                          : "RE::",

"Extra"                             : {
    
    "fold"                          : "xml"
    //"electricChars"               : "<"
    
},
    
// Style model
"Style"                             : {

     "comment"                      : "comment"
    ,"declaration"                  : "tag"
    ,"doctype"                      : "meta"
    ,"meta"                         : "meta"
    ,"cdata"                        : "atom"
    ,"tag"                          : "tag"
    ,"attribute"                    : "attribute"
    ,"string"                       : "string"
    ,"atom"                         : "atom"
    ,"number"                       : "number"
    ,"error"                        : "error"
    
},

// Lexical model
"Lex"                               : {
     
     "comment:comment"              : ["<!--", "-->"]
    ,"declaration:block"            : ["<?xml", "?>"]
    ,"doctype:block"                : ["RE::/<!doctype\\b/i", ">"]
    ,"meta:block"                   : ["RE::/<\\?[_a-zA-Z][\\w\\._\\-]*/", "?>"]
    ,"cdata:block"                  : ["<![CDATA[", "]]>"]
    ,"open_tag"                     : "RE::/<((?:[_a-zA-Z][_a-zA-Z0-9\\-]*:)?[_a-zA-Z][_a-zA-Z0-9\\-]*)\\b/"
    ,"close_tag"                    : "RE::/<\\/((?:[_a-zA-Z][_a-zA-Z0-9\\-]*:)?[_a-zA-Z][_a-zA-Z0-9\\-]*)>/"
    ,"attribute"                    : "RE::/[_a-zA-Z][_a-zA-Z0-9\\-]*/"
    ,"string:line-block"            : [["\""], ["'"]]
    ,"number"                       : ["RE::/[0-9]\\d*/", "RE::/#[0-9a-fA-F]+/"]
    ,"atom"                         : ["RE::/&#x[a-fA-F\\d]+;/", "RE::/&#[\\d]+;/", "RE::/&[a-zA-Z][a-zA-Z0-9]*;/"]
    ,"text"                         : "RE::/[^<&]+/"
    
    // actions
    ,"@tag:action"                  : {"context":true}
    ,"tag@:action"                  : {"context":false}
    ,"@unique_id:action"            : {"unique":["xml", "$1"],"msg":"Duplicate id value \"$0\"","mode":"hash"}
    ,"@unique_att:action"           : {"unique":["att", "$0"],"msg":"Duplicate attribute \"$0\"","mode":"hash","in-context":true}
    ,"@tag_opened:action"           : {"push":"<$1>","ci":true}
    ,"@tag_closed:action"           : {"pop":"<$1>","ci":true,"msg":"Tags \"$0\" and \"$1\" do not match"}
    ,"@tag_autoclosed:action"       : {"pop":null}
    ,"@autocomplete:action"         : {"define":["autocomplete","$1"],"msg":false,"autocomplete":true,"mode":"hash"}
    ,"@out_of_place:error"          : "\"$2$3\" can only be at the beginning of XML document"
    
},
    
// Syntax model (optional)
"Syntax"                            : {
     
     "tag_att"                      : "'id'.attribute @unique_att '=' string @unique_id | attribute @unique_att '=' (string | number)"
    ,"start_tag"                    : "open_tag.tag @tag @autocomplete @tag_opened tag_att* ('>'.tag | '/>'.tag @tag_autoclosed) tag@"
    ,"end_tag"                      : "close_tag.tag @autocomplete @tag_closed"
    ,"xml"                          : "(^^1 declaration? doctype?) (declaration.error @out_of_place | doctype.error @out_of_place | comment | meta | cdata | start_tag | end_tag | atom | text)*"
    
},
    
// what to parse and in what order
"Parser"                            : [ ["xml"] ]

};
        
// 2. parse the grammar into a Codemirror syntax-highlight mode
var xml_mode = CodeMirrorGrammar.getMode( xml_grammar );


// 3. use it with Codemirror
CodeMirror.defineMode("xml", xml_mode);

// enable user-defined code folding in the specification (new feature)
xml_mode.supportCodeFolding = true;
CodeMirror.registerHelper("fold", xml_mode.foldType, xml_mode.folder);

// enable user-defined code matching in the specification (new feature)
xml_mode.supportCodeMatching = true;
xml_mode.matcher.options = {maxHighlightLineLength:1000}; // default
CodeMirror.defineOption("matching", false, function( cm, val, old ) {
    if ( old && old != CodeMirror.Init )
    {
        cm.off( "cursorActivity", xml_mode.matcher );
        xml_mode.matcher.clear( cm );
    }
    if ( val )
    {
        cm.on( "cursorActivity", xml_mode.matcher );
        xml_mode.matcher( cm );
    }
});

// enable syntax lint-like validation in the grammar
xml_mode.supportGrammarAnnotations = true;
CodeMirror.registerHelper("lint", "xml", xml_mode.validator);

// enable user-defined autocompletion (if defined)
xml_mode.supportAutoCompletion = true;
CodeMirror.commands['my_autocompletion'] = function( cm ) {
    CodeMirror.showHint(cm, xml_mode.autocompleter, {prefixMatch:true, caseInsensitiveMatch:false});
};
// this also works (takes priority if set)
xml_mode.autocompleter.options = {prefixMatch:true, caseInsensitiveMatch:false};
// or for context-sensitive autocompletion, extracted from the grammar
xml_mode.autocompleter.options = {prefixMatch:true, caseInsensitiveMatch:false, inContext:true};
// or for dynamic (context-sensitive) autocompletion, extracted from user actions
xml_mode.autocompleter.options = {prefixMatch:true, caseInsensitiveMatch:false, inContext:true|false, dynamic:true};

var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    mode: "xml",
    lineNumbers: true,
    indentUnit: 4,
    indentWithTabs: false,
    lint: true,  // enable lint validation
    matching: true,  // enable token matching, e.g braces, tags etc..
    extraKeys: {"Ctrl-Space": 'my_autocompletion', "Ctrl-L": "toggleComment"},
    foldGutter: true,
    gutters: ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter"]
});

```


Result:

![xml-grammar-1](/test/grammar-xml.png)
![xml-grammar-2](/test/grammar-xml-2.png)
![xml-grammar-2](/test/grammar-xml-3.png)



### Other Examples:


![htmlmixed-grammar](/test/grammar-htmlmixed.png)

![js-recursive-grammar](/test/grammar-js-recursion.png)
![js-recursive-grammar-autocomplete](/test/grammar-js-recursion-2.png)

![js-scoped-grammar](/test/grammar-js-scoped.png)
![js-scoped-grammar](/test/grammar-js-scoped-2.png)

![css-grammar](/test/grammar-css.png)

![python-grammar](/test/grammar-python.png)

![php-grammar](/test/grammar-php.png)

![scheme-grammar](/test/grammar-scheme.png)
