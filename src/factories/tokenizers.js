    
    //
    // tokenizer factories
    var
        getError = function(tokenizer) {
            if (T_NONSPACE == tokenizer.tt) return "NONSPACE Required";
            else if (T_EOL == tokenizer.tt) return "EOL Required";
            return (tokenizer.required) ? ('Token Missing "'+tokenizer.tn+'"') : ('Syntax Error "'+tokenizer.tn+'"');
        },
        
        SimpleToken = Class({
            
            constructor : function(name, token, style) {
                var ayto = this;
                ayto.tt = T_SIMPLE;
                ayto.tn = name;
                ayto.t = token;
                ayto.r = style;
                ayto.required = 0;
                ayto.ERR = 0;
                ayto.toClone = ['t', 'r'];
            },
            
            // tokenizer/token name
            tn : null,
            // tokenizer type
            tt : null,
            // tokenizer token matcher
            t : null,
            // tokenizer return val
            r : null,
            required : 0,
            ERR : 0,
            toClone: null,
            
            get : function( stream, state ) {
                var ayto = this, token = ayto.t, type = ayto.tt;
                // match EOL ( with possible leading spaces )
                if ( T_EOL == type ) 
                { 
                    stream.spc();
                    if ( stream.eol() )
                    {
                        state.t = T_DEFAULT; 
                        //state.r = ayto.r; 
                        return ayto.r; 
                    }
                }
                // match non-space
                else if ( T_NONSPACE == type ) 
                { 
                    ayto.ERR = ( ayto.required && stream.spc() && !stream.eol() ) ? 1 : 0;
                    ayto.required = 0;
                }
                // else match a simple token
                else if ( token.get(stream) ) 
                { 
                    state.t = ayto.tt; 
                    //state.r = ayto.r; 
                    return ayto.r; 
                }
                return false;
            },
            
            require : function(bool) { 
                this.required = (bool) ? 1 : 0;
                return this;
            },
            
            push : function(stack, pos, token) {
                if ( /*pos &&*/ stack.length ) stack.splice( pos, 0, token );
                else stack.push( token );
                return this;
            },
            
            clone : function() {
                var ayto = this, t, i, toClone = ayto.toClone, toClonelen;
                
                t = new ayto.$class();
                t.tt = ayto.tt;
                t.tn = ayto.tn;
                
                if (toClone && toClone.length)
                {
                    toClonelen = toClone.length;
                    for (i=0; i<toClonelen; i++)   
                        t[ toClone[i] ] = ayto[ toClone[i] ];
                }
                return t;
            },
            
            toString : function() {
                return ['[', 'Tokenizer: ', this.tn, ', Matcher: ', ((this.t) ? this.t.toString() : null), ']'].join('');
            }
        }),
        
        BlockToken = Class(SimpleToken, {
            
            constructor : function(type, name, token, style, styleInterior, allowMultiline, escChar) {
                var ayto = this;
                ayto.$super('constructor', name, token, style);
                ayto.ri = ( 'undefined' == typeof(styleInterior) ) ? ayto.r : styleInterior;
                ayto.tt = type;
                // a block is multiline by default
                ayto.mline = ( 'undefined' == typeof(allowMultiline) ) ? 1 : allowMultiline;
                ayto.esc = escChar || "\\";
                ayto.toClone = ['t', 'r', 'ri', 'mline', 'esc'];
            },    
            
            // return val for interior
            ri : null,
            mline : 0,
            esc : null,
            
            get : function( stream, state ) {
            
                var ayto = this, ended = 0, found = 0, endBlock, next = "", continueToNextLine, stackPos, 
                    allowMultiline = ayto.mline, startBlock = ayto.t, thisBlock = ayto.tn, type = ayto.tt,
                    style = ayto.r, styleInterior = ayto.ri, differentInterior = (style != styleInterior),
                    charIsEscaped = 0, isEscapedBlock = (T_ESCBLOCK == type), escChar = ayto.esc,
                    isEOLBlock, alreadyIn, ret, streamPos, streamPos0, continueBlock
                ;
                
                /*
                    This tokenizer class handles many different block types ( BLOCK, COMMENT, ESC_BLOCK, SINGLE_LINE_BLOCK ),
                    having different styles ( DIFFERENT BLOCK DELIMS/INTERIOR ) etc..
                    So logic can become somewhat complex,
                    descriptive names and logic used here for clarity as far as possible
                */
                
                // comments in general are not required tokens
                if ( T_COMMENT == type ) ayto.required = 0;
                
                alreadyIn = 0;
                if ( state.inBlock == thisBlock )
                {
                    found = 1;
                    endBlock = state.endBlock;
                    alreadyIn = 1;
                    ret = styleInterior;
                }    
                else if ( !state.inBlock && (endBlock = startBlock.get(stream)) )
                {
                    found = 1;
                    state.inBlock = thisBlock;
                    state.endBlock = endBlock;
                    ret = style;
                }    
                
                if ( found )
                {
                    stackPos = state.stack.length;
                    
                    isEOLBlock = (T_NULL == endBlock.tt);
                    
                    if ( differentInterior )
                    {
                        if ( alreadyIn && isEOLBlock && stream.sol() )
                        {
                            ayto.required = 0;
                            state.inBlock = null;
                            state.endBlock = null;
                            return false;
                        }
                        
                        if ( !alreadyIn )
                        {
                            ayto.push( state.stack, stackPos, ayto.clone() );
                            state.t = type;
                            //state.r = ret; 
                            return ret;
                        }
                    }
                    
                    ended = endBlock.get(stream);
                    continueToNextLine = allowMultiline;
                    continueBlock = 0;
                    
                    if ( !ended )
                    {
                        streamPos0 = stream.pos;
                        while ( !stream.eol() ) 
                        {
                            streamPos = stream.pos;
                            if ( !(isEscapedBlock && charIsEscaped) && endBlock.get(stream) ) 
                            {
                                if ( differentInterior )
                                {
                                    if ( stream.pos > streamPos && streamPos > streamPos0)
                                    {
                                        ret = styleInterior;
                                        stream.bck2(streamPos);
                                        continueBlock = 1;
                                    }
                                    else
                                    {
                                        ret = style;
                                        ended = 1;
                                    }
                                }
                                else
                                {
                                    ret = style;
                                    ended = 1;
                                }
                                break;
                            }
                            else
                            {
                                next = stream.nxt();
                            }
                            charIsEscaped = !charIsEscaped && next == escChar;
                        }
                    }
                    else
                    {
                        ret = (isEOLBlock) ? styleInterior : style;
                    }
                    continueToNextLine = allowMultiline || (isEscapedBlock && charIsEscaped);
                    
                    if ( ended || (!continueToNextLine && !continueBlock) )
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    else
                    {
                        ayto.push( state.stack, stackPos, ayto.clone() );
                    }
                    
                    state.t = type;
                    //state.r = ret; 
                    return ret;
                }
                
                //state.inBlock = null;
                //state.endBlock = null;
                return false;
            }
        }),
                
        RepeatedTokens = Class(SimpleToken, {
                
            constructor : function( name, tokens, min, max ) {
                var ayto = this;
                ayto.tt = T_REPEATED;
                ayto.tn = name || null;
                ayto.t = null;
                ayto.ts = null;
                ayto.min = min || 0;
                ayto.max = max || INF;
                ayto.found = 0;
                ayto.toClone = ['ts', 'min', 'max', 'found'];
                if (tokens) ayto.set( tokens );
            },
            
            ts: null,
            min: 0,
            max: 1,
            found : 0,
            
            set : function( tokens ) {
                if ( tokens ) this.ts = make_array( tokens );
                return this;
            },
            
            get : function( stream, state ) {
            
                var ayto = this, i, token, style, tokens = ayto.ts, n = tokens.length, 
                    found = ayto.found, min = ayto.min, max = ayto.max,
                    tokensRequired = 0, streamPos, stackPos;
                
                ayto.ERR = 0;
                ayto.required = 0;
                streamPos = stream.pos;
                stackPos = state.stack.length;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone().require(1);
                    style = token.get(stream, state);
                    
                    if ( false !== style )
                    {
                        ++found;
                        if ( found <= max )
                        {
                            // push it to the stack for more
                            ayto.found = found;
                            ayto.push( state.stack, stackPos, ayto.clone() );
                            ayto.found = 0;
                            return style;
                        }
                        break;
                    }
                    else if ( token.required )
                    {
                        tokensRequired++;
                    }
                    if ( token.ERR ) stream.bck2( streamPos );
                }
                
                ayto.required = found < min;
                ayto.ERR = found > max || (found < min && 0 < tokensRequired);
                return false;
            }
        }),
        
        EitherTokens = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_EITHER;
            },
            
            get : function( stream, state ) {
            
                var ayto = this, style, token, i, tokens = ayto.ts, n = tokens.length, 
                    tokensRequired = 0, tokensErr = 0, streamPos;
                
                ayto.required = 1;
                ayto.ERR = 0;
                streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone();
                    style = token.get(stream, state);
                    
                    tokensRequired += (token.required) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        return style;
                    }
                    else if ( token.ERR )
                    {
                        tokensErr++;
                        stream.bck2( streamPos );
                    }
                }
                
                ayto.required = (tokensRequired > 0);
                ayto.ERR = (n == tokensErr && tokensRequired > 0);
                return false;
            }
        }),

        AllTokens = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_ALL;
            },
            
            get : function( stream, state ) {
                
                var ayto = this, token, style, tokens = ayto.ts, n = tokens.length,
                    streamPos, stackPos;
                
                ayto.required = 1;
                ayto.ERR = 0;
                streamPos = stream.pos;
                stackPos = state.stack.length;
                token = tokens[ 0 ].clone().require( 1 );
                style = token.get(stream, state);
                
                if ( false !== style )
                {
                    for (var i=n-1; i>0; i--)
                        ayto.push( state.stack, stackPos+n-i-1, tokens[ i ].clone().require( 1 ) );
                        
                    return style;
                }
                else if ( token.ERR /*&& token.required*/ )
                {
                    ayto.ERR = 1;
                    stream.bck2( streamPos );
                }
                else if ( token.required )
                {
                    ayto.ERR = 1;
                }
                
                return false;
            }
        }),
                
        NGramToken = Class(RepeatedTokens, {
                
            constructor : function( name, tokens ) {
                this.$super('constructor', name, tokens, 1, 1);
                this.tt = T_NGRAM;
            },
            
            get : function( stream, state ) {
                
                var ayto = this, token, style, tokens = ayto.ts, n = tokens.length, 
                    streamPos, stackPos;
                
                ayto.required = 0;
                ayto.ERR = 0;
                streamPos = stream.pos;
                stackPos = state.stack.length;
                token = tokens[ 0 ].clone().require( 0 );
                style = token.get(stream, state);
                
                if ( false !== style )
                {
                    for (var i=n-1; i>0; i--)
                        ayto.push( state.stack, stackPos+n-i-1, tokens[ i ].clone().require( 1 ) );
                    
                    return style;
                }
                else if ( token.ERR )
                {
                    stream.bck2( streamPos );
                }
                
                return false;
            }
        }),
                
        getTokenizer = function(tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords) {
            
            if ( null === tokenID )
            {
                // EOL Tokenizer
                var token = new SimpleToken( tokenID, tokenID, DEFAULTSTYLE );
                token.tt = T_EOL;
                return token;
            }
            
            else if ( "" === tokenID )
            {
                // NONSPACE Tokenizer
                var token = new SimpleToken( tokenID, tokenID, DEFAULTSTYLE );
                token.tt = T_NONSPACE;
                return token;
            }
            
            else
            {
                tokenID = '' + tokenID;
                
                if ( !cachedTokens[ tokenID ] )
                {
                    var tok, token = null, type, combine, action, matchType, tokens, subTokenizers;
                
                    // allow token to be literal and wrap to simple token with default style
                    tok = Lex[ tokenID ] || Syntax[ tokenID ] || { type: "simple", tokens: tokenID };
                    
                    if ( tok )
                    {
                        // tokens given directly, no token configuration object, wrap it
                        if ( (T_STR | T_ARRAY) & get_type( tok ) )
                        {
                            tok = { type: "simple", tokens: tok };
                        }
                        
                        // provide some defaults
                        type = (tok.type) ? tokenTypes[ tok.type.toUpperCase().replace('-', '').replace('_', '') ] : T_SIMPLE;
                        
                        if ( (T_SIMPLE & type) && "" === tok.tokens )
                        {
                            // NONSPACE Tokenizer
                            token = new SimpleToken( tokenID, "", DEFAULTSTYLE );
                            token.tt = T_NONSPACE;
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            return token;
                        }
            
                        tok.tokens = make_array( tok.tokens );
                        action = tok.action || null;
                        
                        if ( T_SIMPLE & type )
                        {
                            if ( tok.autocomplete ) getAutoComplete(tok, tokenID, keywords);
                            
                            // combine by default if possible using word-boundary delimiter
                            combine = ( 'undefined' ==  typeof(tok.combine) ) ? "\\b" : tok.combine;
                            token = new SimpleToken( 
                                        tokenID,
                                        getCompositeMatcher( tokenID, tok.tokens.slice(), RegExpID, combine, cachedRegexes, cachedMatchers ), 
                                        Style[ tokenID ] || DEFAULTSTYLE
                                    );
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                        }
                        
                        else if ( T_BLOCK & type )
                        {
                            if ( T_COMMENT & type ) getComments(tok, comments);

                            token = new BlockToken( 
                                        type,
                                        tokenID,
                                        getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
                                        Style[ tokenID ] || DEFAULTSTYLE,
                                        // allow block delims / block interior to have different styles
                                        Style[ tokenID + '.inside' ],
                                        tok.multiline,
                                        tok.escape
                                    );
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            if ( tok.interleave ) commentTokens.push( token.clone() );
                        }
                        
                        else if ( T_GROUP & type )
                        {
                            tokens = tok.tokens.slice();
                            if ( T_ARRAY & get_type( tok.match ) )
                            {
                                token = new RepeatedTokens(tokenID, null, tok.match[0], tok.match[1]);
                            }
                            else
                            {
                                matchType = groupTypes[ tok.match.toUpperCase() ]; 
                                
                                if (T_ZEROORONE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 0, 1);
                                
                                else if (T_ZEROORMORE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 0, INF);
                                
                                else if (T_ONEORMORE == matchType) 
                                    token = new RepeatedTokens(tokenID, null, 1, INF);
                                
                                else if (T_EITHER & matchType) 
                                    token = new EitherTokens(tokenID, null);
                                
                                else //if (T_ALL == matchType)
                                    token = new AllTokens(tokenID, null);
                            }
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            subTokenizers = [];
                            for (var i=0, l=tokens.length; i<l; i++)
                                subTokenizers = subTokenizers.concat( getTokenizer( tokens[i], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) );
                            
                            token.set( subTokenizers );
                            
                        }
                        
                        else if ( T_NGRAM & type )
                        {
                            // get n-gram tokenizer
                            token = make_array_2( tok.tokens.slice() ).slice(); // array of arrays
                            var ngrams = [], ngram;
                            
                            for (var i=0, l=token.length; i<l; i++)
                            {
                                // get tokenizers for each ngram part
                                ngrams[i] = token[i].slice();
                                // get tokenizer for whole ngram
                                token[i] = new NGramToken( tokenID + '_NGRAM_' + i, null );
                            }
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            for (var i=0, l=token.length; i<l; i++)
                            {
                                ngram = ngrams[i];
                                
                                subTokenizers = [];
                                for (var j=0, l2=ngram.length; j<l2; j++)
                                    subTokenizers = subTokenizers.concat( getTokenizer( ngram[j], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens,  comments, keywords ) );
                                
                                // get tokenizer for whole ngram
                                token[i].set( subTokenizers );
                            }
                        }
                    }
                }
                return cachedTokens[ tokenID ];
            }
        },
        
        getComments = function(tok, comments) {
            // build start/end mappings
            var tmp = make_array_2(tok.tokens.slice()); // array of arrays
            var start, end, lead;
            for (i=0, l=tmp.length; i<l; i++)
            {
                start = tmp[i][0];
                end = (tmp[i].length>1) ? tmp[i][1] : tmp[i][0];
                lead = (tmp[i].length>2) ? tmp[i][2] : "";
                
                if ( null === end )
                {
                    // line comment
                    comments.line = comments.line || [];
                    comments.line.push( start );
                }
                else
                {
                    // block comment
                    comments.block = comments.block || [];
                    comments.block.push( [start, end, lead] );
                }
            }
        },
        
        getAutoComplete = function(tok, type, keywords) {
            var kws = [].concat(make_array(tok.tokens)).map(function(word) { return { word: word, meta: type }; });
            keywords.autocomplete = concat.apply( keywords.autocomplete || [], kws );
        },
        
        parseGrammar = function(grammar) {
            var RegExpID, tokens, numTokens, _tokens, 
                Style, Lex, Syntax, t, tokenID, token, tok,
                cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords;
            
            // grammar is parsed, return it
            // avoid reparsing already parsed grammars
            if ( grammar.__parsed ) return grammar;
            
            cachedRegexes = {}; cachedMatchers = {}; cachedTokens = {}; comments = {}; keywords = {};
            commentTokens = [];
            grammar = clone( grammar );
            
            RegExpID = grammar.RegExpID || null;
            grammar.RegExpID = null;
            delete grammar.RegExpID;
            
            Lex = grammar.Lex || {};
            grammar.Lex = null;
            delete grammar.Lex;
            
            Syntax = grammar.Syntax || {};
            grammar.Syntax = null;
            delete grammar.Syntax;
            
            Style = grammar.Style || {};
            
            _tokens = grammar.Parser || [];
            numTokens = _tokens.length;
            tokens = [];
            
            
            // build tokens
            for (t=0; t<numTokens; t++)
            {
                tokenID = _tokens[ t ];
                
                token = getTokenizer( tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) || null;
                
                if ( token )
                {
                    if ( T_ARRAY & get_type( token ) )  tokens = tokens.concat( token );
                    
                    else  tokens.push( token );
                }
            }
            
            grammar.Parser = tokens;
            grammar.cTokens = commentTokens;
            grammar.Style = Style;
            grammar.Comments = comments;
            grammar.Keywords = keywords;
            
            // this grammar is parsed
            grammar.__parsed = 1;
            
            return grammar;
        }
    ;
  