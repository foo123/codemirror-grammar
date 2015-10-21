codemirror-grammar
==================

__Transform a JSON grammar into a CodeMirror syntax-highlight parser__



A simple and light-weight (~ 30kB minified, ~ 11kB zipped) [CodeMirror](https://github.com/marijnh/codemirror) add-on

to generate syntax-highlight parsers (codemirror modes) from a grammar specification in JSON format.


See also: [ace-grammar](https://github.com/foo123/ace-grammar) , [prism-grammar](https://github.com/foo123/prism-grammar)

**Note:** The invariant codebase for all the `*-grammar` add-ons resides at [editor-grammar](https://github.com/foo123/editor-grammar) repository (used as a `git submodule`)


###Contents

* [Live Example](http://foo123.github.io/examples/codemirror-grammar)
* [Todo](#todo)
* [Features](#features)
* [How To use](#how-to-use)
* [API Reference](/api-reference.md)
* [Grammar Reference](https://github.com/foo123/editor-grammar/grammar-reference.md)
* [Other Examples](#other-examples)

[![Build your own syntax-highlight mode on the fly](/test/screenshot.png)](http://foo123.github.io/examples/codemirror-grammar)


###Todo

Code Indentation is Codemirror default, looking for ways to add more elaborate indentation and code folding rules to the grammar specification via "grammar action tokens" (see gramar reference)


###Features

* A [`Grammar`](https://github.com/foo123/editor-grammar/grammar-reference.md) can **extend other `Grammars`** (so arbitrary `variations` and `dialects` can be handled more easily)
* `Grammar` includes: [`Style Model`](https://github.com/foo123/editor-grammar/grammar-reference.md#style-model) , [`Lex Model`](https://github.com/foo123/editor-grammar/grammar-reference.md#lexical-model) and [`Syntax Model` (optional)](https://github.com/foo123/editor-grammar/grammar-reference.md#syntax-model), plus a couple of [*settings*](https://github.com/foo123/editor-grammar/grammar-reference.md#extra-settings) (see examples)
* **`Grammar` specification can be minimal**, defaults will be used (see example grammars)
* [`Grammar.Syntax Model`](https://github.com/foo123/editor-grammar/grammar-reference.md#syntax-model) can enable highlight in a more *context-specific* way, plus detect possible *syntax errors* and display appropriate *error messages* (see below)
* [`Grammar.Syntax Model`](https://github.com/foo123/editor-grammar/grammar-reference.md#syntax-model) can contain **recursive references** (see `/test/grammar-js-recursion.html`)
* [`Grammar.Syntax Model`](https://github.com/foo123/editor-grammar/grammar-reference.md#syntax-pegbnf-like-notations) can be (fully) specificed using [`PEG`](https://en.wikipedia.org/wiki/Parsing_expression_grammar)-like notation or [`BNF`](https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_Form)-like notation  (**NEW feature**)
* `Grammar` can define [*action* tokens](https://github.com/foo123/editor-grammar/grammar-reference.md#action-tokens) to perform *complex context-specific* parsing functionality, including **associated tag matching** and **duplicate identifiers** (see for example `xml.grammar` example) (**NEW feature**)
* Generated highlight modes can support **toggle comments** and **keyword autocompletion** functionality if defined in the grammar
* Generated highlight modes can support **lint-like syntax-annotation** functionality generated from the grammar
* Generated parsers are **optimized for speed and size**
* Can generate a syntax-highlight parser from a grammar **interactively and on-the-fly** ( see example, http://foo123.github.io/examples/codemirror-grammar )


###How to use:

See working examples under [/test](/test) folder.

An example for XML:


```javascript

// 1. a partial xml grammar in simple JSON format
var xml_grammar = {
    
    // prefix ID for regular expressions, represented as strings, used in the grammar
    "RegExpID": "RE::",

    "Extra": {
        "fold" : "xml"
        //"electricChars" : "<"
    },
    
    // Style model
    "Style": {
        // lang token type  -> Editor (style) tag
        "declaration"          : "tag",
        "doctype"              : "meta",
        "meta"                 : "meta",
        "comment"              : "comment",
        "cdata"                : "atom",
        "atom"                 : "atom",
        "open_tag"             : "tag",
        "close_open_tag"       : "tag",
        "auto_close_open_tag"  : "tag",
        "close_tag"            : "tag",
        "att"                  : "attribute",
        "number"               : "number",
        "string"               : "string",
        "error"                : "error"
    },

    // Lexical model
    "Lex": {
        "declaration:block": ["<?xml","?>"],
        "doctype:block": ["RE::/<!doctype\\b/i",">"],
        "meta:block": ["RE::/<\\?[_a-zA-Z][\\w\\._\\-]*/","?>"],
        "comment:comment": ["<!--","-->"],
        "cdata:block": ["<![CDATA[","]]>"],
        "string:line-block": [[ "\"" ],[ "'" ]],
        "number": ["RE::/[0-9]\\d*/", "RE::/#[0-9a-fA-F]+/"],
        "atom": ["RE::/&#x[a-fA-F\\d]+;/", "RE::/&#[\\d]+;/", "RE::/&[a-zA-Z][a-zA-Z0-9]*;/"],
        "att": "RE::/[_a-zA-Z][_a-zA-Z0-9\\-]*/",
        "open_tag": "RE::/<([_a-zA-Z][_a-zA-Z0-9\\-]*)/",
        "close_open_tag": ">",
        "auto_close_open_tag": "/>",
        "close_tag": "RE::/<\\/([_a-zA-Z][_a-zA-Z0-9\\-]*)>/",
        "text": "RE::/[^<&]+/",
        
        // actions
        "ctx:action": {"context":true},
        "\\ctx:action": {"context":false},
        "unique:action": {
            "unique": ["id", "$1"],
            "msg": "Duplicate id value \"$0\""
        },
        "unique_att:action": {
            "unique": ["att", "$0"],
            "in-context":true,
            "msg": "Duplicate attribute \"$0\""
        },
        "match:action": {"push":"<$1>","ci": true},
        "\\match:action": {
            "pop": "<$1>",
            "ci": true,
            "msg": "Tags \"$0\" and \"$1\" do not match"
        },
        "nomatch:action": {"pop":null},
        "out_of_place:error": "\"$2>\" can only be at the beginning of XML document"
    },
    
    // Syntax model (optional)
    "Syntax": {
        "tag_att": "'id'.att unique_att '=' string unique | att unique_att '=' (string | number)",
        "start_tag": "open_tag match ctx tag_att* (close_open_tag | auto_close_open_tag nomatch) \\ctx",
        "end_tag": "close_tag \\match",
        "xml": "(^^ $* declaration? doctype?)? (declaration.error out_of_place | doctype.error out_of_place | comment | meta | cdata | start_tag | end_tag | atom | text)*"
    },
    
    // what to parse and in what order
    "Parser": [ ["xml"] ]
};
        
// 2. parse the grammar into a Codemirror syntax-highlight mode
var xml_mode = CodeMirrorGrammar.getMode(xml_grammar);

// 3. use it with Codemirror
CodeMirror.defineMode("xml", xml_mode);
var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    mode: "xml",
    lineNumbers: true,
    indentUnit: 4,
    indentWithTabs: false
});

```


Result:

![xml-grammar-1](/test/grammar-xml-annotations-1.png)
![xml-grammar-2](/test/grammar-xml-annotations-2.png)




###Other Examples:


![js-grammar](/test/grammar-js.png)


![js-recursive-grammar](/test/grammar-js-recursion.png)


![css-grammar](/test/grammar-css.png)


![python-grammar](/test/grammar-python.png)


![php-grammar](/test/grammar-php.png)

