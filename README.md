codemirror-grammar
==================

__Transform a JSON grammar into a CodeMirror syntax-highlight parser__



A simple and light-weight ( ~ 15kB minified) [CodeMirror](https://github.com/marijnh/codemirror) add-on

to generate syntax-highlight parsers (codemirror modes) from a grammar specification in JSON format.


See also:  [ace-grammar](https://github.com/foo123/ace-grammar)


__This is work in progress__

###Contents

* [Live Example](http://foo123.github.io/examples/codemirror-grammar)
* [Todo](#todo)
* [Features](#features)
* [How To use](#how-to-use)
* [API Reference](/api-reference.md)
* [Other Examples](#other-working-examples)

[![Build your own syntax-highlight mode on the fly](/test/screenshot.png)](http://foo123.github.io/examples/codemirror-grammar)


###Todo

Code Indentation is Codemirror default, looking for ways to add more elaborate indentation rules to the grammar specification. (maybe add "actions" to the grammar syntax part ?? )

<del>Also looking for ways to add context-specific parsing information to the grammar specification.</del>

__Support for syntax rules in grammars is added__  ( see for example [/test/grammar-xml.html](/test/grammar-xml.html) )

__UPDATE:__  Added context-specific grammar syntax information (groups and n-grams), ( see for example [/test/grammar-xml.html](/test/grammar-xml.html) )

This allows syntax-highlight in a more context-specific manner.

Made various optimizations in regex token matchers for speeding up the parser.




###Features

* A grammar can extend another grammar (so arbitrary variations and dialects can be parsed more easily)
* Grammar includes: Style Model, Lex Model and Syntax Model (optional), plus a couple of settings (see examples)
* Generated syntax-highlight parsers are optimized for speed
* Can generate a syntax-highlight parser from a grammar interactively and on-the-fly ( see example, http://foo123.github.io/examples/codemirror-grammar )


###How to use:

See working examples under [/test](/test) folder.

An example for XML:


```javascript

// 1. a partial xml grammar in simple JSON format
var xml_grammar = {
        
        // prefix ID for regular expressions used in the grammar
        "RegExpID" : "RegExp::",
    
        // lists of (simple/string) tokens to be grouped into one regular expression,
        // else matched one by one, 
        // this is usefull for speed fine-tuning the parser
        "RegExpGroups" : { },
    
        //
        // Style model
        "Style" : {
            // lang token type  -> CodeMirror (style) tag
            "error":                "error",
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
                "type" : "block",
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
            "assignment" : {
                "type" : "simple",
                "tokens" : [ "=" ]
            },
            
            // tag attributes
            "attribute" : {
                "type" : "simple",
                "tokens" : [
                    "RegExp::[_a-zA-Z][_a-zA-Z0-9\\-]*"
                ]
            },
            
            // numbers, in order of matching
            "number" : {
                "type" : "simple",
                "tokens" : [
                    // floats
                    "RegExp::\\d+\\.\\d*",
                    "RegExp::\\.\\d+",
                    // integers
                    // decimal
                    "RegExp::[1-9]\\d*(e[\\+\\-]?\\d+)?",
                    // just zero
                    "RegExp::0(?![\\dx])"
                ]
            },
            
            "number2" : {
                "type" : "simple",
                "tokens" : [
                    // hex colors
                    "RegExp::#[0-9a-fA-F]+"
                ]
            },

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
            "atom" : {
                "type" : "simple",
                "tokens" : [
                    "RegExp::&[a-zA-Z][a-zA-Z0-9]*;",
                    "RegExp::&#[\\d]+;",
                    "RegExp::&#x[a-fA-F\\d]+;"
                ]
            },
            
            // tags
            "startTag" : {
                "type" : "simple",
                "tokens" : [
                    "RegExp::<[_a-zA-Z][_a-zA-Z0-9\\-]*"
                ]
            },
            
            "endTag" : {
                "type" : "simple",
                "tokens" : [ ">" ]
            },
            
            "autocloseTag" : {
                "type" : "simple",
                "tokens" : [ "/>" ]
            },
            
            // close tag, outdent action
            "closeTag" : {
                "type" : "simple",
                "tokens" : [
                    "RegExp::</[_a-zA-Z][_a-zA-Z0-9\\-]*>"
                ]
            }
        },
        
        //
        // Syntax model
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

// 3. register the mode with Codemirror
CodeMirror.defineMode("xml", xml_mode);

// use it!
var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    mode: "xml",
    lineNumbers: true,
    matchBrackets: false,
    indentUnit: 4,
    indentWithTabs: false
});

```


Result:

![xml-grammar](/test/grammar-xml.png)




###Other Working examples:


![css-grammar](/test/grammar-css.png)


![python-grammar](/test/grammar-python.png)


![php-grammar](/test/grammar-php.png)

