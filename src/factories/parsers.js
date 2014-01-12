    
    // codemirror supposed to be available
    var _CodeMirror = CodeMirror || { Pass : { toString: function(){return "CodeMirror.Pass";} } };
    
    //
    // parser factories
    var
        CodemirrorParser = Class({
            
            constructor: function(grammar, LOC) {
                var ayto = this;
                ayto.electricChars = grammar.electricChars || false;
                
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
            //innerModes: null,
            //currentMode: null,
            
            // Codemirror Tokenizer compatible
            getToken: function(stream_, state) {
                
                var i, ci, ayto = this,
                    tokenizer, type, interleavedCommentTokens = ayto.cTokens, tokens = ayto.Tokens, numTokens = tokens.length, 
                    stream, stack, DEFAULT = ayto.DEF, ERROR = ayto.ERR, ret
                ;
                
                stack = state.stack;
                stream = new ParserStream().fromStream( stream_ );
                
                /*if ( ayto.currentMode )
                {
                    return ayto.handleInnerMode(stream_, state);
                }*/
                
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
            }/*,
            
            handleInnerMode : function(stream, state) {
            },
            
            addInnerMode : function(startToken, endToken, mode) {
                this.innerModes = this.innerModes || [];
                this.innerModes.push([startToken, endToken, mode]);
                return this;
            },
            
            removeInnerMode : function(mode) {
                if (this.innerModes)
                {
                    var modes = this.innerModes;
                    for (var i=0, l=modes.length; i<l; i++)
                    {
                        if ( mode === modes[i][2])
                        {
                            modes.splice(i, 1);
                            break;
                        }
                    }
                }
                return this;
            }*/
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
  