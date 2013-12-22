    
    //
    // parser factories
    var
        CodemirrorParser = Class({
            
            constructor: function(grammar, LOCALS) {
                this.LOC = LOCALS;
                this.Grammar = grammar;
                this.Comments = grammar.Comments || {};
                this.Tokens = grammar.Parser || [];
                this.DEF = this.LOC.DEFAULT;
                this.ERR = (grammar.Style && grammar.Style.error) ? grammar.Style.error : this.LOC.ERROR;
                this.electricChars = (grammar.electricChars) ? grammar.electricChars : false;
            },
            
            LOC: null,
            ERR: null,
            DEF: null,
            Grammar: null,
            Comments: null,
            Tokens: null,
            electricChars: false,
            
            // Codemirror Tokenizer compatible
            getToken: function(stream_, state) {
                
                var i,
                    t, type, tokens = this.Tokens, numTokens = tokens.length, 
                    stream, stack,
                    LOC = this.LOC,
                    DEFAULT = this.DEF,
                    ERROR = this.ERR
                ;
                
                stack = state.stack;
                stream = new ParserStream().fromStream( stream_ );
                
                if ( stream.spc() ) 
                {
                    state.t = T_DEFAULT;
                    return DEFAULT;
                }
                
                while ( stack.length )
                {
                    t = stack.pop();
                    type = t.get(stream, state, LOC);
                    
                    // match failed
                    if ( false === type )
                    {
                        // error
                        if ( t.ERROR || t.isRequired )
                        {
                            // empty the stack
                            stack.length = 0;
                            // skip this character
                            stream.nxt();
                            // generate error
                            state.t = T_ERROR;
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
                    t = tokens[i];
                    type = t.get(stream, state, LOC);
                    
                    // match failed
                    if ( false === type )
                    {
                        // error
                        if ( t.ERROR || t.isRequired )
                        {
                            // empty the stack
                            stack.length = 0;
                            // skip this character
                            stream.nxt();
                            // generate error
                            state.t = T_ERROR;
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
                state.t = T_DEFAULT;
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
                    
                    lineComment: (parser.Comments.line) ? parser.Comments.line[0] : null,
                    blockCommentStart: (parser.Comments.block) ? parser.Comments.block[0][0] : null,
                    blockCommentEnd: (parser.Comments.block) ? parser.Comments.block[0][1] : null,
                    blockCommentLead: (parser.Comments.block) ? parser.Comments.block[0][2] : null,
                    
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
  