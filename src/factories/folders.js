    
    // codemirror supposed to be available
    var _CodeMirror = CodeMirror || { Pass : { toString: function(){return "CodeMirror.Pass";} } };
    
    //
    // parser factories
    var
        CodemirrorParser = Class({
            
            constructor: function(grammar, LOC) {
                var ayto = this;
                
                // support extra functionality
                ayto.Extra = grammar.Extra || {};
                
                // support comments toggle functionality
                ayto.LC = (grammar.Comments.line) ? grammar.Comments.line[0] : null,
                ayto.BCS = (grammar.Comments.block) ? grammar.Comments.block[0][0] : null,
                ayto.BCE = (grammar.Comments.block) ? grammar.Comments.block[0][1] : null,
                ayto.BCC = ayto.BCL = (grammar.Comments.block) ? grammar.Comments.block[0][2] : null,
                ayto.DEF = LOC.DEFAULT;
                ayto.ERR = grammar.Style.error || LOC.ERROR;
                
                // support keyword autocompletion
                ayto.Keywords = grammar.Keywords.autocomplete || null;
                
                ayto.Tokens = grammar.Parser || [];
                ayto.cTokens = (grammar.cTokens.length) ? grammar.cTokens : null;
            },
            
            Extra: null,
            LC: null,
            BCS: null,
            BCE: null,
            BCL: null,
            BCC: null,
            ERR: null,
            DEF: null,
            Keywords: null,
            cTokens: null,
            Tokens: null,
            
            parse: function(code) {
                code = code || "";
                var lines = code.split(/\r\n|\r|\n/g), l = lines.length, i,
                    linetokens = [], tokens, state, stream;
                state = new ParserState( );
                state.parseAll = 1;
                for (i=0; i<l; i++)
                {
                    stream = new ParserStream( lines[i] );
                    tokens = [];
                    while ( !stream.eol() )
                    {
                        tokens.push( this.getToken(stream, state) );
                        //stream.sft();
                    }
                    linetokens.push( tokens );
                }
                return linetokens;
            },
            
            // Codemirror Tokenizer compatible
            getToken: function(stream_, state) {
                
                var i, ci, ayto = this, tokenizer, type, 
                    interleavedCommentTokens = ayto.cTokens, tokens = ayto.Tokens, numTokens = tokens.length, 
                    parseAll = state.parseAll, stream, stack, top,
                    DEFAULT = ayto.DEF, ERROR = ayto.ERR, ret
                ;
                
                stream = (parseAll) ? stream_ : new ParserStream().fromStream( stream_ );
                stack = state.stack;
                top = (stack.length) ? stack[stack.length-1] : null;
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
                if ( top && T_EOL == top.tt && stream.sol() ) 
                {
                    stack.pop();
                    top = (stack.length) ? stack[stack.length-1] : null;
                }
                
                // check for non-space tokenizer before parsing space
                if ( !top || T_NONSPACE != top.tt )
                {
                    if ( stream.spc() ) 
                    {
                        state.t = T_DEFAULT;
                        return (parseAll) ? { value: stream.cur(1), type: DEFAULT, error: null } : state.r = DEFAULT;
                    }
                }
                
                while ( stack.length )
                {
                    if (interleavedCommentTokens)
                    {
                        ci = 0;
                        while ( ci < interleavedCommentTokens.length )
                        {
                            tokenizer = interleavedCommentTokens[ci++];
                            type = tokenizer.get(stream, state);
                            if ( false !== type )
                            {
                                return (parseAll) ? { value: stream.cur(1), type: type, error: null } : state.r = type;
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
                            //stack.length = 0;
                            emptyStack(stack, tokenizer.sID);
                            // skip this character
                            stream.nxt();
                            // generate error
                            state.t = T_ERROR;
                            return (parseAll) ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.r = ERROR;
                        }
                        // optional
                        else
                        {
                            continue;
                        }
                    }
                    // found token
                    else
                    {
                        // match action error
                        if ( tokenizer.MTCH )
                        {
                            // empty the stack
                            //stack.length = 0;
                            emptyStack(stack, tokenizer.sID);
                            // generate error
                            state.t = T_ERROR;
                            return (parseAll) ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.r = ERROR;
                        }
                        else
                        {
                            return (parseAll) ? { value: stream.cur(1), type: type, error: null } : state.r = type;
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
                            //stack.length = 0;
                            emptyStack(stack, tokenizer.sID);
                            // skip this character
                            stream.nxt();
                            // generate error
                            state.t = T_ERROR;
                            return (parseAll) ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.r = ERROR;
                        }
                        // optional
                        else
                        {
                            continue;
                        }
                    }
                    // found token
                    else
                    {
                        // match action error
                        if ( tokenizer.MTCH )
                        {
                            // empty the stack
                            //stack.length = 0;
                            emptyStack(stack, tokenizer.sID);
                            // generate error
                            state.t = T_ERROR;
                            return (parseAll) ? { value: stream.cur(1), type: ERROR, error: tokenizer.err() } : state.r = ERROR;
                        }
                        else
                        {
                            return (parseAll) ? { value: stream.cur(1), type: type, error: null } : state.r = type;
                        }
                    }
                }
                
                // unknown, bypass
                stream.nxt();
                state.t = T_DEFAULT;
                return (parseAll) ? { value: stream.cur(1), type: DEFAULT, error: null } : state.r = DEFAULT;
            },
            
            indent : function(state, textAfter, fullLine, conf, parserConf) {
                var indentUnit = conf.indentUnit || 4, Pass = _CodeMirror.Pass;
                
                return Pass;
            }
        }),
        
        getCodemirrorMode = function(parser) {
                
            // Codemirror-compatible Mode
            var modeF = function(conf, parserConf) {
                
                //var supportGrammarAnnotations = conf ? conf.supportGrammarAnnotations : false;
                
                // return the (codemirror) parser mode for the grammar
                var mode = {
                    /*
                    // maybe needed in later versions..
                    
                    blankLine: function( state ) { },
                    
                    innerMode: function( state ) { },
                    */
                    
                    startState: function( ) { return new ParserState(); },
                    
                    copyState: function( state ) { return state.clone(); },
                    
                    token: function(stream, state) { return parser.getToken(stream, state); },
                    
                    indent: function(state, textAfter, fullLine) { return parser.indent(state, textAfter, fullLine, conf, parserConf); },
                    
                    // syntax, lint-like validator generated from grammar
                    // maybe use this as a worker (a-la ACE) ??
                    validator: function (text, options)  {
                        
                        if ( !modeF.supportGrammarAnnotations ) return [];
                        
                        var errorFound = 0, code = text, errors, linetokens, tokens, token, t, lines, line, row, column;
                        if ( !code || !code.length ) return [];
                        
                        errors = [];
                        linetokens = parser.parse( code );
                        lines = linetokens.length;
                        
                        for (line=0; line<lines; line++) 
                        {
                            tokens = linetokens[ line ];
                            if ( !tokens || !tokens.length ) continue;
                            
                            column = 0;
                            for (t=0; t<tokens.length; t++)
                            {
                                token = tokens[t];
                                
                                if ( parser.ERR == token.type )
                                {
                                    errors.push({
                                        message: token.error || 'Syntax Error',
                                        severity: "error",
                                        from: CodeMirror.Pos(line, column),
                                        to: CodeMirror.Pos(line, column+1)
                                    });
                                    
                                    errorFound = 1;
                                }
                                column += token.value.length;
                            }
                        }
                        if ( errorFound ) return errors;
                        else  return [];
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
            return modeF;
        },
        
        getMode = function(grammar, DEFAULT) {
            
            var LOCALS = { 
                    // default return code for skipped or not-styled tokens
                    // 'null' should be used in most cases
                    DEFAULT: DEFAULT || DEFAULTSTYLE,
                    ERROR: DEFAULTERROR
                }
            ;
            
            // build the grammar
            grammar = parseGrammar( grammar );
            //console.log(grammar);
            
            return getCodemirrorMode( new CodemirrorParser(grammar, LOCALS) );
        }
    ;
  