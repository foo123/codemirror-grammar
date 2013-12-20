

###CodeMirrorGrammar Methods

__For node with dependencies:__

```javascript
CodeMirrorGrammar = require('build/codemirror_grammar.js')(require('build/classy.min.js'), require('build/regexanalyzer.min.js'));
```

__For browser with dependencies:__

```html
<script src="../build/classy.min.js"></script>
<script src="../build/regexanalyzer.min.js"></script>
<script src="../build/codemirror_grammar.js"></script>
```

    


__Method__: *extend*

```javascript
extendedgrammar = CodeMirrorGrammar.extend(grammar, basegrammar1 [, basegrammar2, ..]);
```

Extend a grammar with basegrammar1, basegrammar2, etc..

This way arbitrary dialects and variations can be handled more easily
        


__Method__: *parse*

```javascript
parsedgrammar = CodeMirrorGrammar.parse(grammar);
```

This is used internally by the CodeMirrorGrammar Class
In order to parse a JSON grammar to a form suitable to be used by the syntax-highlight parser.
However user can use this method to cache a parsedgrammar to be used later.
Already parsed grammars are NOT re-parsed when passed through the parse method again
        


__Method__: *getMode*

```javascript
mode = CodeMirrorGrammar.getMode(grammar [, DEFAULT]);
```

This is the main method which transforms a JSON grammar into a CodeMirror syntax-highlight parser.
DEFAULT is the default return value (null by default) for things that are skipped or not styled
In general there is no need to set this value, unlees you need to return something else
        