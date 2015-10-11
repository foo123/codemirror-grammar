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
var _CodeMirror = CodeMirror || { Pass : { toString: function(){return "CodeMirror.Pass";} } };

//
// parser factories
DEFAULTSTYLE = null;
DEFAULTERROR = "error";
var Parser = Class({
    constructor: function Parser( grammar, LOC ) {
        var self = this;
        
        // support extra functionality
        self.Extra = grammar.Extra || {};
        
        // support comments toggle functionality
        self.LC = (grammar.Comments.line) ? grammar.Comments.line[0] : null,
        self.BCS = (grammar.Comments.block) ? grammar.Comments.block[0][0] : null,
        self.BCE = (grammar.Comments.block) ? grammar.Comments.block[0][1] : null,
        self.BCC = self.BCL = (grammar.Comments.block) ? grammar.Comments.block[0][2] : null,
        self.DEF = LOC.DEFAULT;
        self.ERR = grammar.Style.error || LOC.ERROR;
        
        // support keyword autocompletion
        self.Keywords = grammar.Keywords.autocomplete || null;
        
        self.Tokens = grammar.Parser || [];
        self.cTokens = grammar.cTokens.length ? grammar.cTokens : null;
        self.Style = grammar.Style;
    }
    
    ,Extra: null
    ,LC: null
    ,BCS: null
    ,BCE: null
    ,BCL: null
    ,BCC: null
    ,ERR: null
    ,DEF: null
    ,Keywords: null
    ,cTokens: null
    ,Tokens: null
    ,Style: null
    
    ,dispose: function( ) {
        var self = this;
        self.Extra = null;
        self.LC = null;
        self.BCS = null;
        self.BCE = null;
        self.BCL = null;
        self.BCC = null;
        self.ERR = null;
        self.DEF = null;
        self.Keywords = null;
        self.cTokens = null;
        self.Tokens = null;
        self.Style = null;
        return self;
    }
    
    ,parse: function( code, parse_type ) {
        code = code || "";
        var self = this, lines = code.split(newline_re), l = lines.length, i,
            linetokens, tokens, state, stream, ret, parse_errors, parse_tokens;
        
        parse_type = parse_type || TOKENS;
        parse_errors = !!(parse_type&ERRORS);
        parse_tokens = !!(parse_type&TOKENS);
        
        state = new State( 0, 0, parse_errors );
        state.parseAll = 1;
        
        if ( parse_tokens )
        {
            linetokens = [];
            for (i=0; i<l; i++)
            {
                state.line = i; stream = new Stream( lines[i] );
                tokens = [];
                while ( !stream.eol() ) tokens.push( self.getToken( stream, state ) );
                linetokens.push( tokens );
            }
        }
        else //if ( parse_errors )
        {
            for (i=0; i<l; i++)
            {
                state.line = i; stream = new Stream( lines[i] );
                while ( !stream.eol() ) self.getToken( stream, state );
            }
        }
        if ( parse_tokens && parse_errors ) ret = {tokens:linetokens, errors:state.err};
        else if ( parse_tokens ) ret = linetokens;
        else ret = state.err;
        stream.dispose(); state.dispose();
        return ret;
    }
    
    // Codemirror Tokenizer compatible
    ,getToken: function( stream, state ) {
        var self = this, i, ci, type, tokenizer, action,
            interleavedCommentTokens = self.cTokens, tokens = self.Tokens, numTokens = tokens.length, 
            parseAll = !!state.parseAll, stack, pos, line,
            Style = self.Style, DEFAULT = self.DEF, ERR = self.ERR
        ;
        
        stream = parseAll ? stream : Stream._( stream );
        stack = state.stack;
        
        // if EOL tokenizer is left on stack, pop it now
        if ( stream.sol() && !stack.isEmpty() && T_EOL === stack.peek().type ) 
        {
            stack.pop();
        }
        
        // check for non-space tokenizer before parsing space
        if ( (stack.isEmpty() || (T_NONSPACE !== stack.peek().type)) && stream.spc() )
        {
            return parseAll ? {value:stream.cur(1), type:DEFAULT} : (stream.upd()&&DEFAULT);
        }
        
        line = state.line;
        while ( !stack.isEmpty() && !stream.eol() )
        {
            if ( interleavedCommentTokens )
            {
                ci = 0;
                while ( ci < interleavedCommentTokens.length )
                {
                    tokenizer = interleavedCommentTokens[ci++];
                    type = tokenizer.get( stream, state );
                    if ( false !== type )
                    {
                        type = Style[type] || DEFAULT;
                        return parseAll ? {value:stream.cur(1), type:type} : (stream.upd()&&type);
                    }
                }
            }
            
            pos = stream.pos;
            tokenizer = stack.pop();
            type = tokenizer.get(stream, state);
            
            // match failed
            if ( false === type )
            {
                // error
                if ( tokenizer.status&REQUIRED_OR_ERROR )
                {
                    // empty the stack
                    stack.empty('$id', tokenizer.$id);
                    // skip this character
                    stream.nxt();
                    // generate error
                    type = ERR;
                    tokenizer.err(state, line, pos, line, stream.pos);
                    return parseAll ? {value:stream.cur(1), type:type} : (stream.upd()&&type);
                }
                // optional
                else
                {
                    continue;
                }
            }
            // found token (not empty)
            else if ( true !== type )
            {
                type = T_SPACE === type ? DEFAULT : Style[type] || DEFAULT;
                // action token follows, execute action on current token
                while ( !stack.isEmpty() && T_ACTION === stack.peek().type )
                {
                    action = stack.pop();
                    action.get(stream, state);
                    // action error
                    if ( action.status&ERROR )
                    {
                        // empty the stack
                        stack.empty('$id', /*action*/tokenizer.$id);
                        // generate error
                        //type = ERR;
                        //action.err(state, line, pos, line, stream.pos);
                        return parseAll ? {value:stream.cur(1), type:type} : (stream.upd()&&type);
                    }
                }
                return parseAll ? {value:stream.cur(1), type:type} : (stream.upd()&&type);
            }
        }
        
        for (i=0; i<numTokens; i++)
        {
            pos = stream.pos;
            tokenizer = tokens[i];
            type = tokenizer.get(stream, state);
            
            // match failed
            if ( false === type )
            {
                // error
                if ( tokenizer.status&REQUIRED_OR_ERROR )
                {
                    // empty the stack
                    stack.empty('$id', tokenizer.$id);
                    // skip this character
                    stream.nxt();
                    // generate error
                    type = ERR;
                    tokenizer.err(state, line, pos, line, stream.pos);
                    return parseAll ? {value:stream.cur(1), type:type} : (stream.upd()&&type);
                }
                // optional
                else
                {
                    continue;
                }
            }
            // found token (not empty)
            else if ( true !== type )
            {
                type = T_SPACE === type ? DEFAULT : Style[type] || DEFAULT;
                // action token follows, execute action on current token
                while ( !stack.isEmpty() && T_ACTION === stack.peek().type )
                {
                    action = stack.pop();
                    action.get(stream, state);
                    // action error
                    if ( action.status&ERROR )
                    {
                        // empty the stack
                        stack.empty('$id', tokenizer.$id);
                        // generate error
                        //type = ERR;
                        //action.err(state, line, pos, line, stream.pos);
                        return parseAll ? {value:stream.cur(1), type:type} : (stream.upd()&&type);
                    }
                }
                return parseAll ? {value: stream.cur(1), type: type} : (stream.upd()&&type);
            }
        }
        
        // unknown, bypass
        stream.nxt();
        return parseAll ? {value:stream.cur(1), type:DEFAULT} : (stream.upd()&&DEFAULT);
    }
    
    ,indent: function(state, textAfter, fullLine, conf, parserConf) {
        var indentUnit = conf.indentUnit || 4, Pass = _CodeMirror.Pass;
        return Pass;
    }
});

function get_mode( grammar, DEFAULT ) 
{
    var parser = new Parser( parse_grammar( grammar ), { 
        // default return code for skipped or not-styled tokens
        // 'null' should be used in most cases
        DEFAULT: DEFAULT || DEFAULTSTYLE,
        ERROR: DEFAULTERROR
    });
    
    // Codemirror-compatible Mode
    var cm_mode = function cm_mode( conf, parserConf ) {
        
        // return the (codemirror) parser mode for the grammar
        return {
            /*
            // maybe needed in later versions..
            
            blankLine: function( state ) { },
            
            innerMode: function( state ) { },
            */
            
            startState: function( ) { 
                return new State( ); 
            },
            
            copyState: function( state ) { 
                state = state.clone( ); state.line++;
                return state;
            },
            
            token: function( stream, state ) { 
                return parser.getToken( stream, state ); 
            },
            
            indent: function( state, textAfter, fullLine ) { 
                return parser.indent( state, textAfter, fullLine, conf, parserConf ); 
            },
            
            // support comments toggle functionality
            lineComment: parser.LC,
            blockCommentStart: parser.BCS,
            blockCommentEnd: parser.BCE,
            blockCommentContinue: parser.BCC,
            blockCommentLead: parser.BCL,
            // support extra functionality defined in grammar
            // eg. code folding, electriChars etc..
            electricChars: parser.Extra.electricChars || false,
            fold: parser.Extra.fold || false
        };
    };
    cm_mode.supportGrammarAnnotations = false;
    // syntax, lint-like validator generated from grammar
    // maybe use this as a worker (a-la ACE) ??
    cm_mode.validator = function( code, options )  {
        if ( !cm_mode.supportGrammarAnnotations || !code || !code.length ) return [];
        
        var errors = [], err, msg, error,
            code_errors = parser.parse( code, ERRORS );
        if ( !code_errors ) return errors;
        
        for (err in code_errors)
        {
            if ( !code_errors.hasOwnProperty(err) ) continue;
            error = code_errors[err];
            errors.push({
                message: error[4] || "Syntax Error",
                severity: "error",
                from: CodeMirror.Pos(error[0], error[1]),
                to: CodeMirror.Pos(error[2], error[3])
            });
        }
        return errors;
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
