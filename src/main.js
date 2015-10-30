/**
*
*   CodeMirrorGrammar
*   @version: @@VERSION@@
*
*   Transform a grammar specification in JSON format, into a syntax-highlight parser mode for CodeMirror
*   https://github.com/foo123/codemirror-grammar
*   https://github.com/foo123/editor-grammar
*
**/


// codemirror supposed to be available
var $CodeMirror$ = 'undefined' !== typeof CodeMirror ? CodeMirror : { Pass : { toString: function(){return "CodeMirror.Pass";} } },
    // used for autocompletion
    RE_W = /[\w$]/, by_score = function( a, b ) { return b.score-a.score }
;

//
// parser factories
var CodeMirrorParser = Class(Parser, {
    constructor: function CodeMirrorParser( grammar, DEFAULT ) {
        var self = this, FOLD = null, TYPE;
        
        Parser.call(self, grammar, null, "error");
        self.DEF = DEFAULT || self.$DEF;
        self.ERR = grammar.Style.error || self.$ERR;
        
        // support comments toggle functionality
        self.LC = grammar.$comments.line ? grammar.$comments.line[0] : null;
        self.BCS = grammar.$comments.block ? grammar.$comments.block[0][0] : null;
        self.BCE = grammar.$comments.block ? grammar.$comments.block[0][1] : null;
        self.BCC = self.BCL = grammar.$comments.block ? grammar.$comments.block[0][2] : null;

        // comment-block folding
        if ( grammar.$comments.block && grammar.$comments.block.length )
        {
            TYPE = CodeMirrorParser.Type('comment');
            for(var i=0,l=grammar.$comments.block.length; i<l; i++)
            {
                self.$folders.push(CodeMirrorParser.Fold.Delimited(
                    grammar.$comments.block[i][0],
                    grammar.$comments.block[i][1],
                    TYPE
                ));
            }
        }
        // user-defined folding
        if ( grammar.Fold && (T_STR & get_type(grammar.Fold)) ) FOLD = grammar.Fold[LOWER]();
        else if ( grammar.$extra.fold ) FOLD = grammar.$extra.fold[LOWER]();
        if ( FOLD )
        {
            FOLD = FOLD.split('+');  // can use multiple folders, separated by '+'
            iterate(function( i, FOLDER ) {
            var FOLD = trim(FOLDER[i]);
            if ( 'brace' === FOLD || 'cstyle' === FOLD )
            {
                var blocks = get_block_types( grammar, 1 );
                TYPE = blocks.length ? CodeMirrorParser.Type(blocks, false) : TRUE;
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '{', '}', TYPE ) );
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '[', ']', TYPE ) );
            }
            else if ( 'indent' === FOLD || 'indentation' === FOLD )
            {
                self.$folders.push( CodeMirrorParser.Fold.Indented( ) );
            }
            else if ( 'markup' === FOLD || 'html' === FOLD || 'xml' === FOLD )
            {
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '<![CDATA[', ']]>', CodeMirrorParser.Type(['comment','tag'], false) ) );
                self.$folders.push( CodeMirrorParser.Fold.MarkedUp( CodeMirrorParser.Type('tag'), '<', '>', '/' ) );
            }
            }, 0, FOLD.length-1, FOLD);
        }
    }
    
    ,LC: null
    ,BCS: null
    ,BCE: null
    ,BCL: null
    ,BCC: null
    
    ,dispose: function( ) {
        var self = this;
        self.LC = self.BCS = self.BCE = self.BCL = self.BCC = null;
        return Parser[PROTO].dispose.call( self );
    }
    
    ,validate: function( code, options, CodeMirror )  {
        if ( !code || !code.length ) return [];
        var parser = this, errors = [], err, msg, error,
            err_type, err_msg, code_errors = parser.parse( code, ERRORS );
        if ( !code_errors ) return errors;
        
        options = options || {};
        err_type = options[HAS]('type') ? options.type : "error";
        err_msg = options[HAS]('msg') ? options.msg : "Syntax Error";
        
        for (err in code_errors)
        {
            if ( !code_errors[HAS](err) ) continue;
            error = code_errors[err];
            errors.push({
                message: error[4] || err_msg,
                severity: err_type,
                from: CodeMirror.Pos( error[0], error[1] ),
                to: CodeMirror.Pos( error[2], error[3] )
            });
        }
        return errors;
    }
    
    // adapted from codemirror anyword-hint helper
    ,autocomplete: function( cm, options, CodeMirror ) {
        var parser = this, list = [],
            cur = cm.getCursor(), curLine,
            start0 = cur.ch, start = start0, end0 = start0, end = end0,
            token, token_i, len, maxlen = 0, word_re, renderer,
            case_insensitive_match, prefix_match;
        if ( parser.$grammar.$autocomplete )
        {
            options = options || {};
            word_re = options.word || RE_W; curLine = cm.getLine(cur.line);
            prefix_match = options[HAS]('prefixMatch') ? !!options.prefixMatch : true;
            while (start && word_re.test(curLine[CHAR](start - 1))) --start;
            // operate similar to current ACE autocompleter equivalent
            if ( !prefix_match ) while (end < curLine.length && word_re.test(curLine[CHAR](end))) ++end;
            if ( start < end )
            {
                case_insensitive_match = options[HAS]('caseInsensitiveMatch') ? !!options.caseInsensitiveMatch : false;
                renderer = options.renderer || null;
                token = curLine.slice(start, end); token_i = token[LOWER](); len = token.length;
                operate(parser.$grammar.$autocomplete, function( list, word ){
                    var w = word.word, wl = w.length, 
                        wm, case_insensitive_word,
                        pos, pos_i, m1, m2, case_insensitive;
                    if ( wl >= len )
                    {
                        wm = word.meta;  case_insensitive_word = !!w.ci;
                        case_insensitive = case_insensitive_match || case_insensitive_word;
                        if ( case_insensitive ) { m1 = w[LOWER](); m2 = token_i; }
                        else { m1 = w; m2 = token; }
                        if ( ((pos_i = m1.indexOf( m2 )) >= 0) && (!prefix_match || (0 === pos_i)) )
                        {
                            pos = case_insensitive ? w.indexOf( token ) : pos_i;
                            if ( wl+wm.length > maxlen ) maxlen = wl+wm.length;
                            list.push({
                                text: w, name: w, meta: wm,
                                start: pos<0?pos_i:pos, end: (pos<0?pos_i:pos) + token.length, match: token,
                                displayText: w + "\t\t["+wm+"]",
                                render: renderer,
                                // longer matches or matches not at start have lower match score
                                score: 1000 - 10*(wl-len) - 5*(pos<0?pos_i+3:pos)
                            });
                        }
                    }
                    return list;
                }, list);
                if ( list.length ) list = list.sort( by_score );
                list.maxlen = maxlen; 
            }
        }
        return {
            list: list,
            from: CodeMirror.Pos( cur.line, start ),
            to: CodeMirror.Pos( cur.line, end )
        };
    }
    
    // adapted from codemirror
    ,indent: function( state, textAfter, fullLine, conf, parserConf, CodeMirror ) {
        //var indentUnit = conf.indentUnit || 4;
        // TODO
        return CodeMirror.Pass;
    }
    
    ,iterator: function( cm, CodeMirror ) {
        // adapted from codemirror
        var tabSize = cm.getOption("tabSize");
        return {
         row: 0, col: 0, min: 0, max: 0
        ,line: function( row ) { return cm.getLine( row ); }
        //,nlines: function( ) { return cm.lineCount( ); }
        ,first: function( ) { return cm.firstLine( ); }
        ,last: function( ) { return cm.lastLine( ); }
        ,next: function( ) {
            var iter = this;
            if ( iter.row >= iter.max ) return;
            iter.col = 0; iter.row++;
            return true;
        }
        ,prev: function( ) {
            var iter = this;
            if ( iter.row <= iter.min ) return;
            iter.col = 0; iter.row--;
            return true;
        }
        ,indentation: function( line ) { return count_column( line, null, tabSize ); }
        ,token: function( row, col ) { return cm.getTokenTypeAt( CodeMirror.Pos( row, col ) ); }
        };
    }
    
    ,fold: function( cm, start, CodeMirror ) {
        // adapted from codemirror
        var self = this, folders = self.$folders, i, l = folders.length, iter, fold;
        if ( l )
        {
            iter = self.iterator( cm, CodeMirror );
            iter.row = start.line; iter.col = start.ch||0;
            for (i=0; i<l; i++)
                if ( fold = folders[ i ]( iter ) )
                    return fold;
        }
    }
});
CodeMirrorParser.Type = Type;
CodeMirrorParser.Fold = Folder;


function autocomplete_renderer( elt, data, cmpl )
{
    var word = cmpl.text, type = cmpl.meta, p1 = cmpl.start, p2 = cmpl.end,
        padding = data.list.maxlen-word.length-type.length+5;
    elt.innerHTML = [
        '<span class="cmg-autocomplete-keyword">', esc_html( word.slice(0,p1) ),
        '<strong class="cmg-autocomplete-keyword-match">', esc_html( word.slice(p1,p2) ), '</strong>',
        esc_html( word.slice(p2) ), '</span>',
        new Array(1+padding).join('&nbsp;'),
        '<strong class="cmg-autocomplete-keyword-meta">', esc_html( type ), '</strong>',
        '&nbsp;'
    ].join('');
    // adjust to fit keywords
    elt.className = (elt.className&&elt.className.length ? elt.className+' ' : '') + 'cmg-autocomplete-keyword-hint';
    elt.style.position = 'relative'; //elt.style.boxSizing = 'border-box';
    elt.style.width = '100%'; elt.style.maxWidth = '120%';
}

function get_mode( grammar, DEFAULT, CodeMirror ) 
{
    // Codemirror-compatible Mode
    CodeMirror = CodeMirror || $CodeMirror$; /* pass CodeMirror reference if not already available */
    function CMode( conf, parserConf )
    {
        return {
        startState: function( ) { 
            return new State( );
        }
        
        ,copyState: function( state ) { 
            return new State( 0, state );
        }
        
        ,token: function( stream, state ) { 
            var pstream = Stream( stream.string, stream.start, stream.pos ), 
                token = CMode.$parser.token( pstream, state ).type;
            stream.pos = pstream.pos;
            return token;
        }
        
        ,indent: function( state, textAfter, fullLine ) { 
            return CMode.$parser.indent( state, textAfter, fullLine, conf, parserConf, CodeMirror ); 
        }
        
        // support comments toggle functionality
        ,lineComment: CMode.$parser.LC
        ,blockCommentStart: CMode.$parser.BCS
        ,blockCommentEnd: CMode.$parser.BCE
        ,blockCommentContinue: CMode.$parser.BCC
        ,blockCommentLead: CMode.$parser.BCL
        // support extra functionality defined in grammar
        // eg. code folding, electriChars etc..
        ,electricInput: CMode.$parser.$grammar.$extra.electricInput || false
        ,electricChars: CMode.$parser.$grammar.$extra.electricChars || false
        ,fold: CMode.foldType
        };
    }
    CMode.$id = uuid("codemirror_grammar_mode");
    CMode.$parser = new CodeMirrorGrammar.Parser( parse_grammar( grammar ), DEFAULT );
    // custom, user-defined, syntax lint-like validation/annotations generated from grammar
    CMode.supportGrammarAnnotations = false;
    CMode.validator = function validator( code, options )  {
        return CMode.supportGrammarAnnotations && CMode.$parser && code && code.length
        ? CMode.$parser.validate( code, validator.options||options||{}, CodeMirror )
        : [];
    };
    CMode.linter = CMode.validator; // alias
    // custom, user-defined, code folding generated from grammar
    CMode.supportCodeFolding = true;
    CMode.foldType = "fold_"+CMode.$id;
    CMode.folder = function folder( cm, start ) {
        var fold;
        if ( CMode.supportCodeFolding && CMode.$parser && (fold = CMode.$parser.fold( cm, start, CodeMirror )) )
        {
            return {
                from: CodeMirror.Pos( fold[0], fold[1] ),
                to: CodeMirror.Pos( fold[2], fold[3] )
            };
        }
    };
    // custom, user-defined, autocompletions generated from grammar
    CMode.supportAutoCompletion = true;
    CMode.autocompleter = function autocompleter( cm, options ) {
        if ( CMode.supportAutoCompletion && CMode.$parser )
        {
            options = autocompleter.options || options || {};
            if ( !options[HAS]('renderer') ) options.renderer = autocompleter.renderer || autocomplete_renderer;
            return CMode.$parser.autocomplete( cm, options, CodeMirror );
        }
    };
    CMode.autocompleter.renderer = autocomplete_renderer;
    CMode.autocomplete = CMode.autocompleter; // deprecated, alias for compatibility
    CMode.dispose = function( ) {
        if ( CMode.$parser ) CMode.$parser.dispose( );
        CMode.$parser = CMode.validator = CMode.linter = CMode.autocompleter = CMode.autocomplete = CMode.folder = null;
    };
    return CMode;
}

//
//  CodeMirror Grammar main class
/**[DOC_MARKDOWN]
*
* ###CodeMirrorGrammar Methods
*
* __For node:__
*
* ```javascript
* CodeMirrorGrammar = require('build/codemirror_grammar.js');
* ```
*
* __For browser:__
*
* ```html
* <script src="build/codemirror_grammar.js"></script>
* ```
*
[/DOC_MARKDOWN]**/
var CodeMirrorGrammar = exports['@@MODULE_NAME@@'] = {
    
    VERSION: "@@VERSION@@",
    
    // clone a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `clone`
    *
    * ```javascript
    * cloned_grammar = CodeMirrorGrammar.clone( grammar [, deep=true] );
    * ```
    *
    * Clone (deep) a `grammar`
    *
    * Utility to clone objects efficiently
    [/DOC_MARKDOWN]**/
    clone: clone,
    
    // extend a grammar using another base grammar
    /**[DOC_MARKDOWN]
    * __Method__: `extend`
    *
    * ```javascript
    * extended_grammar = CodeMirrorGrammar.extend( grammar, basegrammar1 [, basegrammar2, ..] );
    * ```
    *
    * Extend a `grammar` with `basegrammar1`, `basegrammar2`, etc..
    *
    * This way arbitrary `dialects` and `variations` can be handled more easily
    [/DOC_MARKDOWN]**/
    extend: extend,
    
    // pre-process a grammar (in-place)
    /**[DOC_MARKDOWN]
    * __Method__: `pre_process`
    *
    * ```javascript
    * pre_processed_grammar = CodeMirrorGrammar.pre_process( grammar );
    * ```
    *
    * This is used internally by the `CodeMirrorGrammar` Class `parse` method
    * In order to pre-process a `JSON grammar` (in-place) to transform any shorthand configurations to full object configurations and provide defaults.
    * It also parses `PEG`/`BNF` (syntax) notations into full (syntax) configuration objects, so merging with other grammars can be easier, if needed.
    [/DOC_MARKDOWN]**/
    pre_process: preprocess_and_parse_grammar,
    
    // parse a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `parse`
    *
    * ```javascript
    * parsed_grammar = CodeMirrorGrammar.parse( grammar );
    * ```
    *
    * This is used internally by the `CodeMirrorGrammar` Class
    * In order to parse a `JSON grammar` to a form suitable to be used by the syntax-highlight parser.
    * However user can use this method to cache a `parsedgrammar` to be used later.
    * Already parsed grammars are NOT re-parsed when passed through the parse method again
    [/DOC_MARKDOWN]**/
    parse: parse_grammar,
    
    // get a codemirror syntax-highlight mode from a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `getMode`
    *
    * ```javascript
    * mode = CodeMirrorGrammar.getMode( grammar [, DEFAULT, CodeMirror] );
    * ```
    *
    * This is the main method which transforms a `JSON grammar` into a `CodeMirror` syntax-highlight parser.
    * `DEFAULT` is the default return value (`null` by default) for things that are skipped or not styled
    * In general there is no need to set this value, unless you need to return something else
    * The `CodeMirror` reference can also be passed as parameter, for example,
    * if `CodeMirror` is not already available when the add-on is first loaded (e.g via an `async` callback)
    [/DOC_MARKDOWN]**/
    getMode: get_mode,
    
    // make Parser class available
    /**[DOC_MARKDOWN]
    * __Parser Class__: `Parser`
    *
    * ```javascript
    * Parser = CodeMirrorGrammar.Parser;
    * ```
    *
    * The Parser Class used to instantiate a highlight parser, is available.
    * The `getMode` method will instantiate this parser class, which can be overriden/extended if needed, as needed.
    * In general there is no need to override/extend the parser, unless you definately need to.
    [/DOC_MARKDOWN]**/
    Parser: CodeMirrorParser
};
