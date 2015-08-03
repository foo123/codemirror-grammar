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
function Parser( grammar, LOC ) 
{
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
Parser[PROTO] = {
     constructor: Parser
    
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
    
    ,parse: function( code ) {
        code = code || "";
        var self = this, lines = code.split(newline_re), l = lines.length, i,
            linetokens = [], tokens, state, stream;
        state = new State( );
        state.parseAll = 1;
        for (i=0; i<l; i++)
        {
            stream = new Stream( lines[i] );
            tokens = [];
            while ( !stream.eol() )
            {
                tokens.push( self.getToken( stream, state ) );
                //stream.sft();
            }
            linetokens.push( tokens );
        }
        return linetokens;
    }
    
    // Codemirror Tokenizer compatible
    ,getToken: function( stream, state ) {
        var self = this, i, ci, tokenizer, type, 
            interleavedCommentTokens = self.cTokens, tokens = self.Tokens, numTokens = tokens.length, 
            parseAll = !!state.parseAll, stack,
            Style = self.Style, DEFAULT = self.DEF, ERROR = self.ERR, ret
        ;
        
        stream = parseAll ? stream : Stream._( stream );
        stack = state.stack;
        /*
        var scopeOffset, lineOffset;
        //if ( stream.sol() ) 
        {
            scopeOffset = state.col;
            lineOffset = stream.ind();
            if ( lineOffset > scopeOffset ) 
            {
                state.col = lineOffset;
                state.indent = T_INDENT;
            } 
            else if ( lineOffset < scopeOffset ) 
            {
                state.col = lineOffset;
                state.indent = T_DEDENT;
            }
            console.log([state.indent, state.col, stream.toString()]);
        }
        */
        
        // if EOL tokenizer is left on stack, pop it now
        if ( stream.sol() && !stack.isEmpty() && T_EOL === stack.peek().tt ) 
        {
            stack.pop();
        }
        
        // check for non-space tokenizer before parsing space
        if ( (stack.isEmpty() || (T_NONSPACE !== stack.peek().tt)) && stream.spc() )
        {
            return parseAll ? { value: stream.cur(1), type: DEFAULT, error: null } : state.t = DEFAULT;
        }
        
        while ( !stack.isEmpty() && !stream.eol() )
        {
            if (interleavedCommentTokens)
            {
                ci = 0;
                while ( ci < interleavedCommentTokens.length )
                {
                    tokenizer = interleavedCommentTokens[ci++];
                    type = tokenizer.get( stream, state );
                    if ( false !== type )
                    {
                        type = Style[type] || DEFAULT;
                        return parseAll ? { value: stream.cur(1), type: type, error: null } : state.t = type;
                    }
                }
            }
            
            tokenizer = stack.pop();
            type = tokenizer.get(stream, state);
            
            // match failed
            if ( false === type )
            {
                // error
                if ( tokenizer.ERR || tokenizer.REQ )
                {
                    // empty the stack
                    stack.empty('sID', tokenizer.sID);
                    // skip this character
                    stream.nxt();
                    // generate error
                    state.t = type = ERROR;
                    return parseAll ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.t = ERROR;
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
                type = Style[type] || DEFAULT;
                // match action error
                if ( tokenizer.MTCH )
                {
                    // empty the stack
                    stack.empty('sID', tokenizer.sID);
                    // generate error
                    state.t = type = ERROR;
                    return parseAll ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.t = ERROR;
                }
                else
                {
                    return parseAll ? { value: stream.cur(1), type: type, error: null } : state.t = type;
                }
            }
        }
        
        for (i=0; i<numTokens; i++)
        {
            tokenizer = tokens[i];
            type = tokenizer.get(stream, state);
            
            // match failed
            if ( false === type )
            {
                // error
                if ( tokenizer.ERR || tokenizer.REQ )
                {
                    // empty the stack
                    stack.empty('sID', tokenizer.sID);
                    // skip this character
                    stream.nxt();
                    // generate error
                    state.t = type = ERROR;
                    return parseAll ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.t = ERROR;
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
                type = Style[type] || DEFAULT;
                // match action error
                if ( tokenizer.MTCH )
                {
                    // empty the stack
                    stack.empty('sID', tokenizer.sID);
                    // generate error
                    state.t = type = ERROR;
                    return parseAll ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.t = ERROR;
                }
                else
                {
                    return parseAll ? { value: stream.cur(1), type: type, error: null } : state.t = type;
                }
            }
        }
        
        // unknown, bypass
        stream.nxt();
        state.t = DEFAULT;
        return parseAll ? { value: stream.cur(1), type: DEFAULT, error: null } : state.t = DEFAULT;
    }
    
    ,indent: function(state, textAfter, fullLine, conf, parserConf) {
        var indentUnit = conf.indentUnit || 4, Pass = _CodeMirror.Pass;
        return Pass;
    }
};

function getMode( grammar, DEFAULT ) 
{
    grammar = parseGrammar( grammar );
    console.log( grammar );
    var parser = new Parser( grammar, { 
        // default return code for skipped or not-styled tokens
        // 'null' should be used in most cases
        DEFAULT: DEFAULT || DEFAULTSTYLE,
        ERROR: DEFAULTERROR
    });
    
    // Codemirror-compatible Mode
    var cm_mode = function cm_mode( conf, parserConf ) {
        
        // return the (codemirror) parser mode for the grammar
        var mode = {
            /*
            // maybe needed in later versions..
            
            blankLine: function( state ) { },
            
            innerMode: function( state ) { },
            */
            
            startState: function( ) { 
                return new State( ); 
            },
            
            copyState: function( state ) { 
                return state.clone( ); 
            },
            
            token: function( stream, state ) { 
                return parser.getToken( stream, state ); 
            },
            
            indent: function( state, textAfter, fullLine ) { 
                return parser.indent( state, textAfter, fullLine, conf, parserConf ); 
            }
        };
        
        // support comments toggle functionality
        mode.lineComment = parser.LC,
        mode.blockCommentStart = parser.BCS,
        mode.blockCommentEnd = parser.BCE,
        mode.blockCommentContinue = parser.BCC,
        mode.blockCommentLead = parser.BCL
        // support extra functionality defined in grammar
        // eg. code folding, electriChars etc..
        mode.electricChars = parser.Extra.electricChars || false;
        mode.fold = parser.Extra.fold || false;
        
        return mode;
    };
    cm_mode.supportGrammarAnnotations = false;
    // syntax, lint-like validator generated from grammar
    // maybe use this as a worker (a-la ACE) ??
    cm_mode.validator = function( code, options )  {
        if ( !cm_mode.supportGrammarAnnotations || !code || !code.length ) return [];
        
        var errors = [], 
            linetokens = parser.parse( code ), 
            tokens, token, t, 
            lines = linetokens.length, 
            line, row, column;
        
        for (line=0; line<lines; line++) 
        {
            tokens = linetokens[ line ];
            if ( !tokens || !tokens.length ) continue;
            
            column = 0;
            for (t=0; t<tokens.length; t++)
            {
                token = tokens[t];
                
                if ( parser.ERR === token.type )
                {
                    errors.push({
                        message: token.error || "Syntax Error",
                        severity: "error",
                        from: CodeMirror.Pos(line, column),
                        to: CodeMirror.Pos(line, column+1)
                    });
                }
                column += token.value.length;
            }
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
DEFAULTSTYLE = null;
DEFAULTERROR = "error";
var CodeMirrorGrammar = exports['@@MODULE_NAME@@'] = {
    
    VERSION: "@@VERSION@@",
    
    // extend a grammar using another base grammar
    /**[DOC_MARKDOWN]
    * __Method__: `extend`
    *
    * ```javascript
    * extendedgrammar = CodeMirrorGrammar.extend( grammar, basegrammar1 [, basegrammar2, ..] );
    * ```
    *
    * Extend a grammar with basegrammar1, basegrammar2, etc..
    *
    * This way arbitrary dialects and variations can be handled more easily
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
    * This is used internally by the CodeMirrorGrammar Class
    * In order to parse a JSON grammar to a form suitable to be used by the syntax-highlight parser.
    * However user can use this method to cache a parsedgrammar to be used later.
    * Already parsed grammars are NOT re-parsed when passed through the parse method again
    [/DOC_MARKDOWN]**/
    parse: parseGrammar,
    
    // get a codemirror syntax-highlight mode from a grammar
    /**[DOC_MARKDOWN]
    * __Method__: `getMode`
    *
    * ```javascript
    * mode = CodeMirrorGrammar.getMode( grammar [, DEFAULT] );
    * ```
    *
    * This is the main method which transforms a JSON grammar into a CodeMirror syntax-highlight parser.
    * DEFAULT is the default return value (null by default) for things that are skipped or not styled
    * In general there is no need to set this value, unless you need to return something else
    [/DOC_MARKDOWN]**/
    getMode: getMode
};
