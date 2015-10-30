

###CodeMirrorGrammar Methods

__For node:__

```javascript
CodeMirrorGrammar = require('build/codemirror_grammar.js');
```

__For browser:__

```html
<script src="build/codemirror_grammar.js"></script>
```




__Method__: `clone`

```javascript
cloned_grammar = CodeMirrorGrammar.clone( grammar [, deep=true] );
```

Clone (deep) a `grammar`

Utility to clone objects efficiently
    


__Method__: `extend`

```javascript
extended_grammar = CodeMirrorGrammar.extend( grammar, basegrammar1 [, basegrammar2, ..] );
```

Extend a `grammar` with `basegrammar1`, `basegrammar2`, etc..

This way arbitrary `dialects` and `variations` can be handled more easily
    


__Method__: `pre_process`

```javascript
pre_processed_grammar = CodeMirrorGrammar.pre_process( grammar );
```

This is used internally by the `CodeMirrorGrammar` Class `parse` method
In order to pre-process a `JSON grammar` (in-place) to transform any shorthand configurations to full object configurations and provide defaults.
It also parses `PEG`/`BNF` (syntax) notations into full (syntax) configuration objects, so merging with other grammars can be easier, if needed.
    


__Method__: `parse`

```javascript
parsed_grammar = CodeMirrorGrammar.parse( grammar );
```

This is used internally by the `CodeMirrorGrammar` Class
In order to parse a `JSON grammar` to a form suitable to be used by the syntax-highlight parser.
However user can use this method to cache a `parsedgrammar` to be used later.
Already parsed grammars are NOT re-parsed when passed through the parse method again
    


__Method__: `getMode`

```javascript
mode = CodeMirrorGrammar.getMode( grammar [, DEFAULT, CodeMirror] );
```

This is the main method which transforms a `JSON grammar` into a `CodeMirror` syntax-highlight parser.
`DEFAULT` is the default return value (`null` by default) for things that are skipped or not styled
In general there is no need to set this value, unless you need to return something else
The `CodeMirror` reference can also be passed as parameter, for example,
if `CodeMirror` is not already available when the add-on is first loaded (e.g via an `async` callback)
    


__Parser Class__: `Parser`

```javascript
Parser = CodeMirrorGrammar.Parser;
```

The Parser Class used to instantiate a highlight parser, is available.
The `getMode` method will instantiate this parser class, which can be overriden/extended if needed, as needed.
In general there is no need to override/extend the parser, unless you definately need to.
    