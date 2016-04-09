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
        var self = this, FOLD = null, MATCH = null, TYPE;
        
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
                    TYPE, 'comment'
                ));
            }
        }
        // user-defined folding
        if ( grammar.Fold && (T_STR & get_type(grammar.Fold)) ) FOLD = grammar.Fold[LOWER]();
        else if ( grammar.$extra.fold ) FOLD = grammar.$extra.fold[LOWER]();
        // user-defined matching
        if ( grammar.Match && (T_STR & get_type(grammar.Match)) ) MATCH = grammar.Match[LOWER]();
        else if ( grammar.$extra.match ) MATCH = grammar.$extra.match[LOWER]();
        else MATCH = FOLD;
        var blocks = get_block_types( grammar, 1 );
        TYPE = blocks.length ? CodeMirrorParser.Type(blocks, false) : TRUE;
        if ( FOLD )
        {
            FOLD = FOLD.split('+');  // can use multiple folders, separated by '+'
            iterate(function( i, FOLDER ) {
            var FOLD = trim(FOLDER[i]), p;
            if ( 'braces' === FOLD )
            {
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '{', '}', TYPE ) );
            }
            else if ( 'brackets' === FOLD )
            {
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '[', ']', TYPE ) );
            }
            else if ( 'parens' === FOLD || 'parentheses' === FOLD )
            {
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '(', ')', TYPE ) );
            }
            else if ( 'brace' === FOLD || 'cstyle' === FOLD || 'c' === FOLD )
            {
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '{', '}', TYPE ) );
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '[', ']', TYPE ) );
            }
            else if ( 'indent' === FOLD || 'indentation' === FOLD )
            {
                self.$folders.push( CodeMirrorParser.Fold.Indented( ) );
            }
            else if ( 'tags' === FOLD || 'markup' === FOLD || 'html' === FOLD || 'xml' === FOLD )
            {
                self.$folders.push( CodeMirrorParser.Fold.Delimited( '<![CDATA[', ']]>', CodeMirrorParser.Type(['comment','tag'], false) ) );
                self.$folders.push( CodeMirrorParser.Fold.MarkedUp( CodeMirrorParser.Type('tag'), '<', '>', '/' ) );
            }
            else if ( -1 < (p=FOLD.indexOf(',')) )
            {
                self.$folders.push( CodeMirrorParser.Fold.Delimited( FOLD.slice(0,p), FOLD.slice(p+1), TYPE ) );
            }
            }, 0, FOLD.length-1, FOLD);
        }
        // user-defined matching
        if ( MATCH )
        {
            MATCH = MATCH.split('+');  // can use multiple matchers, separated by '+'
            iterate(function( i, MATCHER ) {
            var MATCH = trim(MATCHER[i]), p;
            if ( 'braces' === MATCH )
            {
                self.$matchers.push( CodeMirrorParser.Match.Delimited( '{', '}' ) );
            }
            else if ( 'brackets' === MATCH )
            {
                self.$matchers.push( CodeMirrorParser.Match.Delimited( '[', ']' ) );
            }
            else if ( 'parens' === MATCH || 'parentheses' === MATCH )
            {
                self.$matchers.push( CodeMirrorParser.Match.Delimited( '(', ')' ) );
            }
            else if ( 'brace' === MATCH || 'cstyle' === MATCH || 'c' === MATCH )
            {
                self.$matchers.push( CodeMirrorParser.Match.Delimited( '{', '}' ) );
                self.$matchers.push( CodeMirrorParser.Match.Delimited( '[', ']' ) );
                self.$matchers.push( CodeMirrorParser.Match.Delimited( '(', ')' ) );
            }
            else if ( 'tags' === MATCH || 'markup' === MATCH || 'html' === MATCH || 'xml' === MATCH )
            {
                self.$matchers.push( CodeMirrorParser.Match.MarkedUp( CodeMirrorParser.Type('tag'), '<', '>', '/' ) );
            }
            else if ( -1 < (p=MATCH.indexOf(',')) )
            {
                self.$matchers.push( CodeMirrorParser.Match.Delimited( MATCH.slice(0,p), MATCH.slice(p+1) ) );
            }
            }, 0, MATCH.length-1, MATCH);
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
            case_insensitive_match, prefix_match, in_context, sort_by_score, score;
        if ( !!parser.$grammar.$autocomplete )
        {
            options = options || {};
            word_re = options.word || RE_W; curLine = cm.getLine(cur.line);
            prefix_match = options[HAS]('prefixMatch') ? !!options.prefixMatch : true;
            in_context = options[HAS]('inContext')? !!options.inContext : false;
            case_insensitive_match = options[HAS]('caseInsensitiveMatch') ? !!options.caseInsensitiveMatch : false;
            while (start && word_re.test(curLine[CHAR](start - 1))) --start;
            // operate similar to current ACE autocompleter equivalent
            if ( !prefix_match ) while (end < curLine.length && word_re.test(curLine[CHAR](end))) ++end;
            token = curLine.slice(start, end); token_i = token[LOWER](); len = token.length;
            renderer = options.renderer || null;
            sort_by_score = false; score = 1000;
            
            var suggest = function suggest( list, word ){
                var w = word.word, wl = w.length, 
                    wm, case_insensitive_word,
                    pos, pos_i, m1, m2, case_insensitive;
                if ( len )
                {
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
                }
                else
                {
                    wm = word.meta;
                    if ( wl+wm.length > maxlen ) maxlen = wl+wm.length;
                    list.push({
                        text: w, name: w, meta: wm,
                        start: 0, end: 0, match: '',
                        displayText: w + "\t\t["+wm+"]",
                        render: renderer,
                        // longer matches have lower match score
                        score: sort_by_score ? 1000 - 10*(wl) : score--
                    });
                }
                return list;
            };
            
            if ( in_context )
            {
                sort_by_score = false;
                list = operate(parser.autocompletion( cm.getTokenAt( CodeMirror.Pos( cur.line, start ), true ).state.state ), suggest, list);
                if ( !list.length )
                {
                    sort_by_score = true;
                    list = operate(parser.$grammar.$autocomplete, suggest, list);
                }
            }
            else
            {
                sort_by_score = true;
                list = operate(parser.$grammar.$autocomplete, suggest, list);
            }
            if ( list.length ) list = list.sort( by_score );
            list.maxlen = maxlen; 
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
        ,state: function( row, col ) { var s = cm.getTokenAt( CodeMirror.Pos( row, col||0 ) ).state; return s.state || s; }
        ,token: function( row, col ) { return cm.getTokenTypeAt( CodeMirror.Pos( row, col||0 ) ); }
        ,tokens: function( row ) { return cm.getLineTokens( row ); }
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
                if ( (fold = folders[ i ]( iter )) || (false === fold) )
                    return fold;
        }
    }
    
    ,match: function( cm, start, CodeMirror ) {
        // adapted from codemirror
        var self = this, matchers = self.$matchers, i, l = matchers.length, iter, match;
        if ( l )
        {
            iter = self.iterator( cm, CodeMirror );
            iter.row = start.line; iter.col = start.ch||0;
            for (i=0; i<l; i++)
                if ( (match = matchers[ i ]( iter )) || (false === match) )
                    return match;
        }
    }
});
CodeMirrorParser.Type = Type;
CodeMirrorParser.Fold = Folder;
CodeMirrorParser.Match = Matcher;


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
        // this is a generic multiplexing mode
        // since it supports multiple inner sub-grammar parsers
        // this means all folding/matching/autocompletion/comments multiplexing and so on..
        // should be handled by the mode itself taking account any sub-modes
        // and NOT by Codemirror!!
        var mode;
        mode = {
        Mode: CMode
        
        ,startState: function( ) { 
            return {parser: CMode.$parser, state: new State( ), inner: {}, name: null};
        }
        
        ,copyState: function( state ) { 
            return {parser: state.parser, state: new State( 0, state.state ), inner: state.inner, name: state.name};
        }
        
        ,token: function( stream, state ) { 
            var pstream = Stream( stream.string, stream.start, stream.pos ), 
                token = state.parser.get( pstream, state ).type;
            stream.pos = pstream.pos;
            return token;
        }
        
        ,indent: function( state, textAfter, fullLine ) { 
            return state.parser.indent( state.state, textAfter, fullLine, conf, parserConf, CodeMirror ); 
        }
        
        ,fold: CMode.foldType
        
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
        };
        // store a reference to mode here
        CMode.mode = mode;
        return mode;
    }
    CMode.$id = uuid("codemirror_grammar_mode");
    CMode.$parser = new CodeMirrorGrammar.Parser( parse_grammar( grammar ), DEFAULT );
    // store a reference to Mode here
    CMode.$parser.Mode = CMode;
    CMode.options = function( cm, pos, options ) {
        options = options || {};
        var s = cm.getTokenAt( pos ).state, parser = (s && s.parser) || CMode.$parser;
        options.lineComment = parser.LC;
        options.blockCommentStart = parser.BCS;
        options.blockCommentEnd = parser.BCE;
        options.blockCommentContinue = parser.BCC;
        options.blockCommentLead = parser.BCL;
        options.electricInput = parser.$grammar.$extra.electricInput || false;
        options.electricChars = parser.$grammar.$extra.electricChars || false;
        return options;
    };
    
    // custom, user-defined, syntax lint-like validation/annotations generated from grammar
    CMode.supportGrammarAnnotations = false;
    CMode.validator = function validator( code, options )  {
        return CMode.supportGrammarAnnotations && CMode.$parser && code && code.length
        ? CMode.$parser.validate( code, validator.options||options||{}, CodeMirror )
        : [];
    };
    // alias
    CMode.linter = CMode.validator;
    
    // custom, user-defined, (multiplexed) autocompletions generated from grammar
    CMode.supportAutoCompletion = true;
    CMode.autocompleter = function autocompleter( cm, options ) {
        if ( CMode.supportAutoCompletion )
        {
            var s = cm.getTokenAt( cm.getCursor() ).state, parser = (s && s.parser) || CMode.$parser;
            options = autocompleter.options /*|| Mode.autocompleter.options*/ || options || {};
            if ( !options[HAS]('renderer') ) options.renderer = autocompleter.renderer /*|| Mode.autocompleter.renderer*/ || autocomplete_renderer;
            return parser.autocomplete( cm, options, CodeMirror );
        }
    };
    CMode.autocompleter.renderer = autocomplete_renderer;
    // alias, deprecated for compatibility
    //CMode.autocomplete = CMode.autocompleter;
    
    // custom, user-defined, code (multiplexed) folding generated from grammar
    CMode.supportCodeFolding = true;
    CMode.foldType = "fold_"+CMode.$id;
    CMode.folder = function folder( cm, start ) {
        if ( CMode.supportCodeFolding )
        {
            var s = cm.getTokenAt( start ).state, parser = (s && s.parser) || CMode.$parser, fold;
            if ( fold = parser.fold( cm, start, CodeMirror ) )
            return {
                from: CodeMirror.Pos( fold[0], fold[1] ),
                to: CodeMirror.Pos( fold[2], fold[3] )
            };
        }
    };
    
    // custom, user-defined, code (multiplexed) matching generated from grammar
    CMode.supportCodeMatching = true;
    CMode.matchType = "match_"+CMode.$id;
    CMode.matcher = function matcher( cm ) {
        if ( CMode.supportCodeMatching )
        {
            matcher.clear( cm );
            if ( cm.state.$highlightPending ) return;
            var s = cm.getTokenAt( cm.getCursor() ).state, parser = (s && s.parser) || CMode.$parser;

            // perform highlight async to not block the browser during navigation
            cm.state.$highlightPending = true;
            setTimeout(function( ) {
            cm.operation(function( ) {
                cm.state.$highlightPending = false;
                // Disable matching in long lines, since it'll cause hugely slow updates
                var options =matcher.options /*|| Mode.matcher.options*/ || {}, maxHighlightLen = options.maxHighlightLineLength || 1000;
                var marks = [], ranges = cm.listSelections( ), range,
                    matched = "CodeMirror-matchingtag"/*"CodeMirror-matchingbracket"*/, unmatched = "CodeMirror-nonmatchingbracket";
                for (var i=0,l=ranges.length; i<1; i++)
                {
                    range = /*ranges[i].empty() &&*/ parser.match( cm, ranges[i].to(), CodeMirror );
                    if ( null == range ) continue;
                    if ( false === range )
                    {
                        if ( ranges[i].empty() )
                        {
                            range = ranges[i].to();
                            range = [CodeMirror.Pos(range.line, range.ch-1), range];
                        }
                        else
                        {
                            range = [ranges[i].from(), ranges[i].to()];
                        }
                        marks.push( cm.markText( range[0], range[1], {className: unmatched} ) );
                    }
                    else if ( false === range.match )
                    {
                        marks.push( cm.markText( CodeMirror.Pos(range[0], range[1]), CodeMirror.Pos(range[2], range[3]), {className: unmatched} ) );
                    }
                    else if ( ('end' === range.match) && (cm.getLine(range[0]).length <= maxHighlightLen) )
                    {
                        marks.push( cm.markText( CodeMirror.Pos(range[0], range[1]), CodeMirror.Pos(range[2], range[3]), {className: matched} ) );
                        if ( cm.getLine(range[4]).length <= maxHighlightLen )
                        marks.push( cm.markText( CodeMirror.Pos(range[4], range[5]), CodeMirror.Pos(range[6], range[7]), {className: matched} ) );
                    }
                    else if ( ('start' === range.match) && (cm.getLine(range[4]).length <= maxHighlightLen) )
                    {
                        marks.push( cm.markText( CodeMirror.Pos(range[4], range[5]), CodeMirror.Pos(range[6], range[7]), {className: matched} ) );
                        if ( cm.getLine(range[0]).length <= maxHighlightLen )
                        marks.push( cm.markText( CodeMirror.Pos(range[0], range[1]), CodeMirror.Pos(range[2], range[3]), {className: matched} ) );
                    }
                }
                cm.state[ CMode.matchType ] = marks;
            });
            }, 50);
        }
    };
    CMode.matcher.clear = function( cm ) {
        cm.operation(function( ){
            var marks = cm.state[ CMode.matchType ];
            cm.state[ CMode.matchType ] = null;
            if ( marks && marks.length )
                for(var i=0,l=marks.length; i<l; i++) marks[i].clear( );
        });
    };
    
    CMode.submode = function( lang, mode ) {
        CMode.$parser.subparser( lang, mode.Mode.$parser );
    };
    
    CMode.dispose = function( ) {
        if ( CMode.$parser ) CMode.$parser.dispose( );
        CMode.$parser = CMode.validator = CMode.linter = CMode.autocompleter = CMode.folder = CMode.matcher = CMode.mode = null;
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
