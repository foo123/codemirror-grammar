/**
*
*   CodeMirrorGrammar
*   @version: @@VERSION@@
*
*   Transform a grammar specification in JSON format, into a syntax-highlight parser mode for CodeMirror
*   https://github.com/foo123/codemirror-grammar
*
**/
    
    //
    //  CodeMirror Grammar main class
    /**[DOC_MARKDOWN]
    *
    * ###CodeMirrorGrammar Methods
    *
    * __For node with dependencies:__
    *
    * ```javascript
    * CodeMirrorGrammar = require('build/codemirror_grammar.js').CodeMirrorGrammar;
    * // or
    * CodeMirrorGrammar = require('build/codemirror_grammar.bundle.js').CodeMirrorGrammar;
    * ```
    *
    * __For browser with dependencies:__
    *
    * ```html
    * <script src="../build/codemirror_grammar.bundle.js"></script>
    * <!-- or -->
    * <script src="../build/classy.js"></script>
    * <script src="../build/regexanalyzer.js"></script>
    * <script src="../build/codemirror_grammar.js"></script>
    * <script> // CodeMirrorGrammar.getMode(..) , etc.. </script>
    * ```
    *
    [/DOC_MARKDOWN]**/
    DEFAULTSTYLE = null;
    DEFAULTERROR = "error";
    var self = @@MODULE_NAME@@ = {
        
        VERSION : "@@VERSION@@",
        
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
        parse : parseGrammar,
        
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
        * In general there is no need to set this value, unless you need to return something else
        [/DOC_MARKDOWN]**/
        getMode : getMode
    };
