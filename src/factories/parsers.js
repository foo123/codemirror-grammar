    
    //
    // parser factories
    var
        CodemirrorParser = Class({
            
            constructor: function(grammar, LOCALS) {
                this.LOC = LOCALS;
                this.Grammar = grammar;
                this.Style = grammar.Style || {};
                this.Comments = grammar.Comments || {};
                this.electricChars = (grammar.electricChars) ? grammar.electricChars : false;
                this.tokens = grammar.Parser || [];
                this.DEF = this.LOC.DEFAULT;
                this.ERR = this.Style.error || this.LOC.ERROR;
            },
            
            LOC: null,
            ERR: null,
            DEF: null,
            Grammar: null,
            Style: null,
            Comments: null,
            electricChars: false,
            tokens: null,
            
            // Codemirror Tokenizer compatible
            getToken: function(stream_, state) {
                
                var i,
                    tokenizer, type, numTokens = this.tokens.length, 
                    stream, stack,
                    LOC = this.LOC,
                    DEFAULT = this.DEF,
                    ERROR = this.ERR
                ;
                
                stack = state.stack;
                stream = new StringStream().fromStream( stream_ );
                
                if ( stream.space() ) 
                {
                    state.currentToken = T_DEFAULT;
                    return DEFAULT;
                }
                
                while ( stack.length )
                {
                    tokenizer = stack.pop();
                    type = tokenizer.get(stream, state, LOC);
                    
                    // match failed
                    if ( false === type )
                    {
                        // error
                        if ( tokenizer.ERROR || tokenizer.isRequired )
                        {
                            // empty the stack
                            stack.length = 0;
                            // skip this character
                            stream.nxt();
                            // generate error
                            state.currentToken = T_ERROR;
                            return ERROR;
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
                        return type;
                    }
                }
                
                for (i=0; i<numTokens; i++)
                {
                    tokenizer = this.tokens[i];
                    type = tokenizer.get(stream, state, LOC);
                    
                    // match failed
                    if ( false === type )
                    {
                        // error
                        if ( tokenizer.ERROR || tokenizer.isRequired )
                        {
                            // empty the stack
                            stack.length = 0;
                            // skip this character
                            stream.nxt();
                            // generate error
                            state.currentToken = T_ERROR;
                            return ERROR;
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
                        return type;
                    }
                }
                
                // unknown, bypass
                stream.nxt();
                state.currentToken = T_DEFAULT;
                return DEFAULT;
            },
            
            indent : function(state, textAfter, fullLine) {
                // TODO
                return CodeMirror.Pass;
            }
        }),
        
        getParser = function(grammar, LOCALS) {
            return new CodemirrorParser(grammar, LOCALS);
        },
        
        getCodemirrorMode = function(parser) {
                
            //var startState = new ParserState();
            
            // Codemirror-compatible Mode
            return function(conf, parserConf) {
                
                parser.LOC.conf = conf;
                parser.LOC.parserConf = parserConf;
                
                // return the (codemirror) parser mode for the grammar
                return  {
                    startState: function( ) { return new ParserState(); },
                    
                    electricChars: parser.electricChars,
                    
                    lineComment: (parser.Comments.lineCommentStart) ? parser.Comments.lineCommentStart[0] : null,
                    blockCommentStart: (parser.Comments.blockCommentStart) ? parser.Comments.blockCommentStart[0] : null,
                    blockCommentEnd: (parser.Comments.blockCommentEnd) ? parser.Comments.blockCommentEnd[0] : null,
                    blockCommentLead: (parser.Comments.blockCommentLead) ? parser.Comments.blockCommentLead[0] : null,
                    
                    copyState: function( state ) { return state.clone(); },
                    
                    token: function(stream, state) { return parser.getToken(stream, state); },
                    
                    indent: function(state, textAfter, fullLine) { return parser.indent(state, textAfter, fullLine); }
                    
                    /*
                    // maybe needed in later versions..
                    
                    blankLine: function( state ) { },
                    
                    innerMode: function( state ) { }
                    */
                };
                
            };
        }
    ;
  