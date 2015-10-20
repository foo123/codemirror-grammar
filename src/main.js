/**
*
*   CodeMirrorGrammar
*   @version: @@VERSION@@
*
*   Transform a grammar specification in JSON format, into a syntax-highlight parser mode for CodeMirror
*   https://github.com/foo123/codemirror-grammar
*
**/


// codemirror supposed to be available
var $CodeMirror$ = CodeMirror || { Pass : { toString: function(){return "CodeMirror.Pass";} } },
    // used for autocompletion
    RE_W = /[\w$]/, by_score = function( a, b ) { return b.score-a.score }
;

//
// parser factories
var CodeMirrorParser = Class(Parser, {
    constructor: function CodeMirrorParser( grammar, DEFAULT ) {
        var self = this;
        
        Parser.call(self, grammar, null, "error");
        self.DEF = DEFAULT || self.$DEF;
        self.ERR = grammar.Style.error || self.$ERR;
        
        // support comments toggle functionality
        self.LC = grammar.$comments.line ? grammar.$comments.line[0] : null;
        self.BCS = grammar.$comments.block ? grammar.$comments.block[0][0] : null;
        self.BCE = grammar.$comments.block ? grammar.$comments.block[0][1] : null;
        self.BCC = self.BCL = grammar.$comments.block ? grammar.$comments.block[0][2] : null;
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
    
    ,indent: function( state, textAfter, fullLine, conf, parserConf ) {
        var indentUnit = conf.indentUnit || 4, Pass = $CodeMirror$.Pass;
        return Pass;
    }
});

function get_mode( grammar, DEFAULT ) 
{
    // Codemirror-compatible Mode
    var cm_mode = function cm_mode( conf, parserConf ) {
        return {
            /*
            // maybe needed in later versions..?
            
            blankLine: function( state ) { }
            
            ,innerMode: function( state ) { }
            */
            
            startState: function( ) { 
                return cm_mode.$parser.state( );
            }
            
            ,copyState: function( state ) { 
                return cm_mode.$parser.state( 0, state );
            }
            
            ,token: function( stream, state ) { 
                var pstream = Stream._( stream ), 
                    token = cm_mode.$parser.token( pstream, state ).type;
                stream.pos = pstream.pos; pstream.dispose();
                return token;
            }
            
            ,indent: function( state, textAfter, fullLine ) { 
                return cm_mode.$parser.indent( state, textAfter, fullLine, conf, parserConf ); 
            }
            
            // support comments toggle functionality
            ,lineComment: cm_mode.$parser.LC
            ,blockCommentStart: cm_mode.$parser.BCS
            ,blockCommentEnd: cm_mode.$parser.BCE
            ,blockCommentContinue: cm_mode.$parser.BCC
            ,blockCommentLead: cm_mode.$parser.BCL
            // support extra functionality defined in grammar
            // eg. code folding, electriChars etc..
            ,electricInput: cm_mode.$parser.$grammar.$extra.electricInput || false
            ,electricChars: cm_mode.$parser.$grammar.$extra.electricChars || false
            ,fold: cm_mode.$parser.$grammar.$extra.fold || false
        };
    };
    
    cm_mode.$id = uuid("codemirror_grammar_mode");
    
    cm_mode.$parser = new CodeMirrorParser( parse_grammar( grammar ), DEFAULT );
    
    cm_mode.supportGrammarAnnotations = false;
    // syntax, lint-like validator generated from grammar
    // maybe use this as a worker (a-la ACE) ??
    cm_mode.validator = function( code, options )  {
        if ( !cm_mode.$parser || !cm_mode.supportGrammarAnnotations || !code || !code.length ) return [];
        
        var errors = [], err, msg, error, Pos = $CodeMirror$.Pos,
            code_errors = cm_mode.$parser.parse( code, ERRORS );
        if ( !code_errors ) return errors;
        
        for (err in code_errors)
        {
            if ( !code_errors[HAS](err) ) continue;
            error = code_errors[err];
            errors.push({
                message: error[4] || "Syntax Error",
                severity: "error",
                from: Pos(error[0], error[1]),
                to: Pos(error[2], error[3])
            });
        }
        return errors;
    };
    
    // autocompletion helper extracted from the grammar
    // adapted from codemirror anyword-hint helper
    cm_mode.autocomplete_renderer = function( elt, data, cmpl ) {
        var word = cmpl.text, type = cmpl.meta, p1 = cmpl.start, p2 = cmpl.end,
            padding = data.list.maxlen-word.length-type.length+5;
        elt.innerHTML = [
            '<span class="cmg-autocomplete-keyword">', word.slice(0,p1),
            '<strong class="cmg-autocomplete-keyword-match">', word.slice(p1,p2), '</strong>',
            word.slice(p2), '</span>',
            new Array(1+padding).join('&nbsp;'),
            '<strong class="cmg-autocomplete-keyword-meta">', type, '</strong>',
            '&nbsp;'
        ].join('');
        // adjust to fit keywords
        elt.className = (elt.className&&elt.className.length ? elt.className+' ' : '') + 'cmg-autocomplete-keyword-hint';
        elt.style.position = 'relative'; elt.style.boxSizing = 'border-box';
        elt.style.width = '100%'; elt.style.maxWidth = '100%';
    };
    cm_mode.autocomplete = function( cm, options ) {
        var list = [], Pos = $CodeMirror$.Pos,
            cur = cm.getCursor(), curLine,
            start0 = cur.ch, start = start0, end0 = start0, end = end0,
            token, token_i, len, maxlen = 0, word_re, renderer,
            case_insensitive_match, prefix_match;
        if ( cm_mode.$parser && cm_mode.$parser.$grammar.$autocomplete )
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
                renderer = options.renderer || cm_mode.autocomplete_renderer;
                token = curLine.slice(start, end); token_i = token[LOWER](); len = token.length;
                operate(cm_mode.$parser.$grammar.$autocomplete, function( list, word ){
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
            from: Pos( cur.line, start ),
            to: Pos( cur.line, end )
        };
    };
    cm_mode.dispose = function( ) {
        if ( cm_mode.$parser ) cm_mode.$parser.dispose( );
        cm_mode.$parser = null;
    };
    return cm_mode;
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
* CodeMirrorGrammar = require('build/codemirror_grammar.js').CodeMirrorGrammar;
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
    * cloned = CodeMirrorGrammar.clone( grammar [, deep=true] );
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
    * extendedgrammar = CodeMirrorGrammar.extend( grammar, basegrammar1 [, basegrammar2, ..] );
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
    * CodeMirrorGrammar.pre_process( grammar );
    * ```
    *
    * This is used internally by the `CodeMirrorGrammar` Class `parse` method
    * In order to pre-process, in-place, a `JSON grammar` 
    * to transform any shorthand configurations to full object configurations and provide defaults.
    [/DOC_MARKDOWN]**/
    pre_process: preprocess_grammar,
    
    // parse a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `parse`
    *
    * ```javascript
    * parsedgrammar = CodeMirrorGrammar.parse( grammar );
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
    * mode = CodeMirrorGrammar.getMode( grammar [, DEFAULT] );
    * ```
    *
    * This is the main method which transforms a `JSON grammar` into a `CodeMirror` syntax-highlight parser.
    * `DEFAULT` is the default return value (`null` by default) for things that are skipped or not styled
    * In general there is no need to set this value, unless you need to return something else
    [/DOC_MARKDOWN]**/
    getMode: get_mode
};
