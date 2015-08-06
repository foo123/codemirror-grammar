codemirror-grammar
==================

__Transform a JSON grammar into a CodeMirror syntax-highlight parser__



A simple and light-weight (~ 20kB minified, ~ 8kB zipped) [CodeMirror](https://github.com/marijnh/codemirror) add-on

to generate syntax-highlight parsers (codemirror modes) from a grammar specification in JSON format.


See also:  [ace-grammar](https://github.com/foo123/ace-grammar) , [prism-grammar](https://github.com/foo123/prism-grammar)


###Contents

* [Live Example](http://foo123.github.io/examples/codemirror-grammar)
* [Todo](#todo)
* [Features](#features)
* [How To use](#how-to-use)
* [API Reference](/api-reference.md)
* [Grammar Reference](/grammar-reference.md)
* [Other Examples](#other-examples)

[![Build your own syntax-highlight mode on the fly](/test/screenshot.png)](http://foo123.github.io/examples/codemirror-grammar)


###Todo

Code Indentation is Codemirror default, looking for ways to add more elaborate indentation and code folding rules to the grammar specification. (maybe add "actions" to the grammar syntax part ?? )


###Features

* A grammar can **extend other grammars** (so arbitrary variations and dialects can be parsed more easily)
* [`Grammar`](/grammar-reference.md) includes: `Style` Model , `Lex` Model and `Syntax` Model (optional), plus a couple of *settings* (see examples)
* `Grammar` **specification can be minimal** (defaults will be used) (see example grammars)
* [`Grammar Syntax Model`](/grammar-reference.md) can enable highlight in a more context-specific way, plus detect possible *syntax errors*
* [`Grammar Syntax Model`](/grammar-reference.md) can contain *recursive references* (see `/test/grammar-js-recursion.html`)
* [`Grammar Syntax Model`](/grammar-reference.md) can be specificed using [`PEG`](https://en.wikipedia.org/wiki/Parsing_expression_grammar)-like notation or [`BNF`](https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_Form)-like notation  (**NEW feature**)
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
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID" : "RegExp::",

    "Extra" : {
        "fold" : "xml"
    },
    
    //
    // Style model
    "Style" : {
        // lang token type  -> Editor (style) tag
        "commentBlock":         "comment",
        "metaBlock":            "meta",
        "cdataBlock":           "atom",
        "atom":                 "atom",
        "openTag":              "tag",
        "closeTag":             "tag",
        "autoCloseTag":         "tag",
        "endTag":               "tag",
        "attribute":            "attribute",
        "number":               "number",
        "string":               "string"
    },

    //
    // Lexical model
    "Lex" : {
        
        "commentBlock" : {
            "type" : "comment",
            "tokens" : [
                // block comments
                // start,    end  delims
                [ "<!--",    "-->" ]
            ]
        },
        
        "cdataBlock" : {
            "type" : "block",
            "tokens" : [
                // cdata block
                //   start,        end  delims
                [ "<![CDATA[",    "]]>" ]
            ]
        },
        
        "metaBlock" : {
            "type" : "block",
            "tokens" : [
                // meta block
                //        start,                          end  delims
                [ "RegExp::/<\\?[_a-zA-Z][\\w\\._\\-]*/",   "?>" ]
            ]
        },
        
        // strings
        "string" : {
            "type" : "block",
            "multiline" : false,
            "tokens" : [ 
                // if no end given, end is same as start
                [ "\"" ], [ "'" ] 
            ]
        },
        
        // numbers, in order of matching
        "number" : [
            // integers
            // decimal
            "RegExp::/[1-9]\\d*(e[\\+\\-]?\\d+)?/",
            // just zero
            "RegExp::/0(?![\\dx])/",
            // hex colors
            "RegExp::/#[0-9a-fA-F]+/"
        ],
        
        // atoms
        "atom" : [
            "RegExp::/&[a-zA-Z][a-zA-Z0-9]*;/",
            "RegExp::/&#[\\d]+;/",
            "RegExp::/&#x[a-fA-F\\d]+;/"
        ],
        
        // tag attributes
        "attribute" : "RegExp::/[_a-zA-Z][_a-zA-Z0-9\\-]*/",
        
        // tags
        "closeTag" : ">",
        
        "openTag" : {
            // allow to match start/end tags
            "push" : "TAG<$1>",
            "tokens" : "RegExp::/<([_a-zA-Z][_a-zA-Z0-9\\-]*)/"
        },
        
        "autoCloseTag" : {
            // allow to match start/end tags
            "pop" : null,
            "tokens" : "/>"
        },
        
        "endTag" : {
            // allow to match start/end tags
            "pop" : "TAG<$1>",
            "tokens" : "RegExp::/<\\/([_a-zA-Z][_a-zA-Z0-9\\-]*)>/"
        }
    },
    
    //
    // Syntax model (optional)
    "Syntax" : {
        // NEW feature
        // using BNF-like shorthands, instead of multiple grammar configuration objects
        
        "tagAttribute": "attribute '=' (string | number)",
        
        "startTag": "openTag tagAttribute* (closeTag | autoCloseTag)",
        
        "tags": {
            "type": "ngram",
            "tokens": [
                ["startTag"], 
                ["endTag"]
            ]
        }
    },
    
    // what to parse and in what order
    "Parser" : [
        "commentBlock",
        "cdataBlock",
        "metaBlock",
        "tags",
        "atom"
    ]
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

![xml-grammar](/test/grammar-xml.png)




###Other Examples:


####grammar annotations

![grammar-annotations](/test/grammar-annotations.png)


![js-grammar](/test/grammar-js.png)


![js-recursive-grammar](/test/grammar-js-recursion.png)


![css-grammar](/test/grammar-css.png)


![python-grammar](/test/grammar-python.png)


![php-grammar](/test/grammar-php.png)

