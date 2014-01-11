    
    // codemirror supposed to be available
    var _CodeMirror = CodeMirror || { Pass : { toString: function(){return "CodeMirror.Pass";} } };
    
    //
    // parser factories
    var
        CodemirrorParser = Class({
            
            constructor: function(grammar, LOC) {
                this.electricChars = grammar.electricChars || false;
                
                // support comments toggle functionality
                this.LC = (grammar.Comments.line) ? grammar.Comments.line[0] : null,
                this.BCS = (grammar.Comments.block) ? grammar.Comments.block[0][0] : null,
                this.BCE = (grammar.Comments.block) ? grammar.Comments.block[0][1] : null,
                this.BCC = this.BCL = (grammar.Comments.block) ? grammar.Comments.block[0][2] : null,
                this.DEF = LOC.DEFAULT;
                this.ERR = grammar.Style.error || LOC.ERROR;
                
                // support keyword autocompletion
                this.Keywords = grammar.Keywords.autocomplete || null;
                
                this.Tokens = grammar.Parser || [];
                this.cTokens = (grammar.cTokens.length) ? grammar.cTokens : null;
            },
            
            conf: null,
            parserConf: null,
            electricChars: false,
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
            
            // Codemirror Tokenizer compatible
            getToken: function(stream_, state) {
                
                var i, ci,
                    tokenizer, type, interleavedCommentTokens = this.cTokens, tokens = this.Tokens, numTokens = tokens.length, 
                    stream, stack, DEFAULT = this.DEF, ERROR = this.ERR
                ;
                
                stack = state.stack;
                stream = new ParserStream().fromStream( stream_ );
                
                // if EOL tokenizer is left on stack, pop it now
                if ( stream.sol() && stack.length && T_EOL == stack[stack.length-1].tt ) stack.pop();
                
                // check for non-space tokenizer before parsing space
                if ( !stack.length || T_NONSPACE != stack[stack.length-1].tt )
                {
                    if ( stream.spc() ) 
                    {
                        state.t = T_DEFAULT;
                        return state.r = DEFAULT;
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
                                return state.r = type;
                            }
                        }
                    }
                    
                    tokenizer = stack.pop();
                    type = tokenizer.get(stream, state);
                    
                    // match failed
                    if ( false === type )
                    {
                        // error
                        if ( tokenizer.ERR || tokenizer.required )
                        {
                            // empty the stack
                            stack.length = 0;
                            // skip this character
                            stream.nxt();
                            // generate error
                            state.t = T_ERROR;
                            return state.r = ERROR;
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
                        return state.r = type;
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
                        if ( tokenizer.ERR || tokenizer.required )
                        {
                            // empty the stack
                            stack.length = 0;
                            // skip this character
                            stream.nxt();
                            // generate error
                            state.t = T_ERROR;
                            return state.r = ERROR;
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
                        return state.r = type;
                    }
                }
                
                // unknown, bypass
                stream.nxt();
                state.t = T_DEFAULT;
                return state.r = DEFAULT;
            },
            
            indent : function(state, textAfter, fullLine) {
                // Default for now, TODO
                return _CodeMirror.Pass;
            }
        }),
        
        getParser = function(grammar, LOCALS) {
            return new CodemirrorParser(grammar, LOCALS);
        },
        
        getCodemirrorMode = function(parser) {
                
            // Codemirror-compatible Mode
            return function(conf, parserConf) {
                
                parser.conf = conf;
                parser.parserConf = parserConf;
                
                // return the (codemirror) parser mode for the grammar
                return  {
                    /*
                    // maybe needed in later versions..
                    
                    blankLine: function( state ) { },
                    
                    innerMode: function( state ) { },
                    */
                    
                    startState: function( ) { return new ParserState(); },
                    
                    electricChars: parser.electricChars,
                    
                    // support comments toggle functionality
                    lineComment: parser.LC,
                    blockCommentStart: parser.BCS,
                    blockCommentEnd: parser.BCE,
                    blockCommentContinue: parser.BCC,
                    blockCommentLead: parser.BCL,
                    
                    copyState: function( state ) { return state.clone(); },
                    
                    token: function(stream, state) { return parser.getToken(stream, state); },
                    
                    indent: function(state, textAfter, fullLine) { return parser.indent(state, textAfter, fullLine); }
                };
                
            };
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
            
            return getCodemirrorMode( getParser( grammar, LOCALS ) );
        }
    ;
  