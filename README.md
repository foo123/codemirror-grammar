codemirror-grammar
==================

__Transform a JSON grammar into a CodeMirror syntax-highlight parser__



A simple and light-weight ( ~ 15kB minified) [CodeMirror](https://github.com/marijnh/codemirror) add-on

to generate syntax-highlight parsers (codemirror modes) from a grammar specification in JSON format.


See also:  [ace-grammar](https://github.com/foo123/ace-grammar)


###Contents

* [Live Example](http://foo123.github.io/examples/codemirror-grammar)
* [Todo](#todo)
* [Features](#features)
* [How To use](#how-to-use)
* [API Reference](/api-reference.md)
* [Other Examples](#other-examples)

[![Build your own syntax-highlight mode on the fly](/test/screenshot.png)](http://foo123.github.io/examples/codemirror-grammar)


###Todo

Code Indentation is Codemirror default, looking for ways to add more elaborate indentation and code folding rules to the grammar specification. (maybe add "actions" to the grammar syntax part ?? )


###Features

* A grammar can **extend other grammars** (so arbitrary variations and dialects can be parsed more easily)
* Grammar includes: **Style Model** , **Lex Model** and **Syntax Model** (optional), plus a couple of *settings* (see examples)
* Grammar **specification can be minimal** (defaults will be used) (see example grammars)
* Grammar Syntax Model can enable highlight in a more context-specific way, plus detect possible *syntax errors*
* Generated highlight modes can support **toggle comments** and **keyword autocompletion** functionality if defined in the grammar
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

    //
    // Style model
    "Style" : {
        // lang token type  -> CodeMirror (style) tag
        "commentBlock":         "comment",
        "metaBlock":            "meta",
        "atom":                 "atom",
        "cdataBlock":           "atom",
        "startTag":             "tag",
        "endTag":               "tag",
        "autocloseTag":         "tag",
        "closeTag":             "tag",
        "attribute":            "attribute",
        "assignment":           "operator",
        "number":               "number",
        "number2":              "number",
        "string":               "string"
    },

    "electricChars" : null,
    
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
                [ "RegExp::<\\?[_a-zA-Z][\\w\\._\\-]*",   "?>" ]
            ]
        },
        
        // attribute assignment
        "assignment" : "=",
        
        // tag attributes
        "attribute" : "RegExp::[_a-zA-Z][_a-zA-Z0-9\\-]*",
        
        // numbers, in order of matching
        "number" : [
            // floats
            "RegExp::\\d+\\.\\d*",
            "RegExp::\\.\\d+",
            // integers
            // decimal
            "RegExp::[1-9]\\d*(e[\\+\\-]?\\d+)?",
            // just zero
            "RegExp::0(?![\\dx])"
        ],
        
        // hex colors
        "number2" : "RegExp::#[0-9a-fA-F]+",

        // strings
        "string" : {
            "type" : "escaped-block",
            "escape" : "\\",
            "multiline" : false,
            "tokens" : [ 
                // start, end of string (can be the matched regex group ie. 1 )
                // if no end given, end is same as start
                [ "\"" ], 
                [ "'" ] 
            ]
        },
        
        // atoms
        // "simple" token type is default, if no token type
        //"type" : "simple",
        "atom" : [
            "RegExp::&[a-zA-Z][a-zA-Z0-9]*;",
            "RegExp::&#[\\d]+;",
            "RegExp::&#x[a-fA-F\\d]+;"
        ],
        
        // tags
        "startTag" : "RegExp::<[_a-zA-Z][_a-zA-Z0-9\\-]*",
        
        "endTag" : ">",
        
        "autocloseTag" : "/>",
        
        // close tag, outdent action
        "closeTag" : "RegExp::</[_a-zA-Z][_a-zA-Z0-9\\-]*>"
    },
    
    //
    // Syntax model (optional)
    "Syntax" : {
        
        "stringOrNumber" : {
            "type" : "group",
            "match" : "either",
            "tokens" : [ "string", "number", "number2" ] 
        },
        
        "tagAttribute" : { 
            "type" : "group",
            "match" : "all",
            "tokens" : [ "attribute", "assignment", "stringOrNumber" ]
        },
        
        "tagAttributes" : { 
            "type" : "group",
            "match" : "zeroOrMore",
            "tokens" : [ "tagAttribute" ]
        },
        
        "startCloseTag" : { 
            "type" : "group",
            "match" : "either",
            "tokens" : [ "endTag", "autocloseTag" ]
        },
        
        // n-grams define syntax sequences
        "openTag" : { 
            "type" : "n-gram",
            "tokens" :[
                [ "startTag", "tagAttributes", "startCloseTag" ]
            ]
        }
    },
    
    // what to parse and in what order
    "Parser" : [
        "commentBlock",
        "cdataBlock",
        "metaBlock",
        "openTag",
        "closeTag",
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


![js-grammar](/test/grammar-js.png)


![css-grammar](/test/grammar-css.png)


![python-grammar](/test/grammar-python.png)


![php-grammar](/test/grammar-php.png)

