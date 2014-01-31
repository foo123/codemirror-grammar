    
    //
    // tokenizer factories
    var
        _id_ = 0, getId = function() { return ++_id_; },
        emptyStack = function(stack, id) {
            if ( id )
            {
                while (stack.length && id == stack[stack.length-1].sID) stack.pop();
            }
            else stack.length = 0;
            return stack;
        },
        pushStack = function(stack, pos, token, stackId) {
            // associate a stack id with this token
            // as part of a posible syntax sequence
            if ( stackId ) token.sID = stackId;
            if ( pos < stack.length ) stack.splice( pos, 0, token );
            else stack.push( token );
            return stack;
        },
            
        
        SimpleToken = Class({
            
            constructor : function(name, token, style) {
                var ayto = this;
                ayto.tt = T_SIMPLE;
                ayto.tn = name;
                ayto.t = token;
                ayto.r = style;
                ayto.REQ = 0;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                ayto.CLONE = ['t', 'r'];
            },
            
            // stack id
            sID: null,
            // tokenizer/token name
            tn: null,
            // tokenizer type
            tt: null,
            // tokenizer token matcher
            t: null,
            // tokenizer return val
            r: null,
            // tokenizer match action (optional)
            tm: null,
            REQ: 0,
            ERR: 0,
            MTCH: 0,
            CLONE: null,
            
            m : function(token, state) {
                var matchAction = this.tm || null, t, T, data = state.data;
                
                if ( matchAction )
                {
                    t = matchAction[1];
                    
                    if ( "push" == matchAction[0] && t )
                    {
                        if ( token )
                        {
                            T = get_type( t );
                            if ( T_NUM == T )  t = token[1][t];
                            else t = groupReplace(t, token[1]);
                        }
                        data.push( t );
                    }
                    
                    else if ( "pop" ==  matchAction[0] )
                    {
                        if ( t )
                        {
                            if ( token )
                            {
                                T = get_type( t );
                                if ( T_NUM == T )  t = token[1][t];
                                else t = groupReplace(t, token[1]);
                            }
                            
                            if ( !data.length || t != data.pop() ) return t;
                        }
                        else if ( data.length ) data.pop();
                    }
                }
                return 0;
            },
            
            get : function( stream, state ) {
                var ayto = this, matchAction = ayto.tm, token = ayto.t, 
                    type = ayto.tt, style = ayto.r, t = null;
                
                ayto.MTCH = 0;
                // match EOL ( with possible leading spaces )
                if ( T_EOL == type ) 
                { 
                    stream.spc();
                    if ( stream.eol() )
                    {
                        state.t = T_DEFAULT; 
                        //state.r = style; 
                        return style; 
                    }
                }
                // match non-space
                else if ( T_NONSPACE == type ) 
                { 
                    ayto.ERR = ( ayto.REQ && stream.spc() && !stream.eol() ) ? 1 : 0;
                    ayto.REQ = 0;
                }
                // else match a simple token
                else if ( t = token.get(stream) ) 
                { 
                    if ( matchAction ) ayto.MTCH = ayto.m(t, state);
                    state.t = type; 
                    //state.r = style; 
                    return style; 
                }
                return false;
            },
            
            req : function(bool) { 
                this.REQ = (bool) ? 1 : 0;
                return this;
            },
            
            err : function() {
                var t = this;
                if ( t.REQ ) return ('Token "'+t.tn+'" Expected');
                else if ( t.MTCH ) return ('Token "'+t.MTCH+'" No Match')
                return ('Syntax Error: "'+t.tn+'"');
            },
        
            clone : function() {
                var ayto = this, t, i, toClone = ayto.CLONE, toClonelen;
                
                t = new ayto.$class();
                t.tt = ayto.tt;
                t.tn = ayto.tn;
                t.tm = (ayto.tm) ? ayto.tm.slice() : ayto.tm;
                
                if (toClone && toClone.length)
                {
                    for (i=0, toClonelen = toClone.length; i<toClonelen; i++)   
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
                ayto.CLONE = ['t', 'r', 'ri', 'mline', 'esc'];
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
                if ( T_COMMENT == type ) ayto.REQ = 0;
                
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
                            ayto.REQ = 0;
                            state.inBlock = null;
                            state.endBlock = null;
                            return false;
                        }
                        
                        if ( !alreadyIn )
                        {
                            pushStack( state.stack, stackPos, ayto.clone(), thisBlock );
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
                        pushStack( state.stack, stackPos, ayto.clone(), thisBlock );
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
                ayto.CLONE = ['ts', 'min', 'max', 'found'];
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
                    tokensRequired = 0, streamPos, stackPos, stackId;
                
                ayto.ERR = 0;
                ayto.REQ = 0;
                ayto.MTCH = 0;
                streamPos = stream.pos;
                stackPos = state.stack.length;
                stackId = ayto.tn + '_' + getId();
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone().req( 1 );
                    style = token.get(stream, state);
                    
                    if ( false !== style )
                    {
                        ++found;
                        if ( found <= max )
                        {
                            // push it to the stack for more
                            ayto.found = found;
                            pushStack( state.stack, stackPos, ayto.clone(), stackId );
                            ayto.found = 0;
                            ayto.MTCH = token.MTCH;
                            return style;
                        }
                        break;
                    }
                    else if ( token.REQ )
                    {
                        tokensRequired++;
                    }
                    if ( token.ERR ) stream.bck2( streamPos );
                }
                
                ayto.REQ = found < min;
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
                
                ayto.REQ = 1;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                streamPos = stream.pos;
                
                for (i=0; i<n; i++)
                {
                    token = tokens[i].clone().req( 1 );
                    style = token.get(stream, state);
                    
                    tokensRequired += (token.REQ) ? 1 : 0;
                    
                    if ( false !== style )
                    {
                        ayto.MTCH = token.MTCH;
                        return style;
                    }
                    else if ( token.ERR )
                    {
                        tokensErr++;
                        stream.bck2( streamPos );
                    }
                }
                
                ayto.REQ = (tokensRequired > 0);
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
                    streamPos, stackPos, stackId;
                
                ayto.REQ = 1;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                streamPos = stream.pos;
                stackPos = state.stack.length;
                stackId = ayto.tn + '_' + getId();
                token = tokens[ 0 ].clone().req( 1 );
                style = token.get(stream, state);
                
                if ( false !== style )
                {
                    for (var i=n-1; i>0; i--)
                        pushStack( state.stack, stackPos+n-i-1, tokens[ i ].clone().req( 1 ), stackId );
                        
                    ayto.MTCH = token.MTCH;
                    return style;
                }
                else if ( token.ERR /*&& token.REQ*/ )
                {
                    ayto.ERR = 1;
                    stream.bck2( streamPos );
                }
                else if ( token.REQ )
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
                    streamPos, stackPos, stackId, i;
                
                ayto.REQ = 0;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                streamPos = stream.pos;
                stackPos = state.stack.length;
                stackId = ayto.tn + '_' + getId();
                token = tokens[ 0 ].clone().req( 0 );
                style = token.get(stream, state);
                
                if ( false !== style )
                {
                    for (i=n-1; i>0; i--)
                        pushStack( state.stack, stackPos+n-i-1, tokens[ i ].clone().req( 1 ), stackId );
                    
                    ayto.MTCH = token.MTCH;
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
            
            var tok, token = null, type, combine, matchAction, matchType, tokens, subTokenizers,
                ngrams, ngram, i, l, j, l2;
            
            if ( null === tokenID )
            {
                // EOL Tokenizer
                token = new SimpleToken( tokenID, tokenID, DEFAULTSTYLE );
                token.tt = T_EOL;
                token.tn = 'EOL';
                return token;
            }
            
            else if ( "" === tokenID )
            {
                // NONSPACE Tokenizer
                token = new SimpleToken( tokenID, tokenID, DEFAULTSTYLE );
                token.tt = T_NONSPACE;
                token.tn = 'NONSPACE';
                return token;
            }
            
            else
            {
                tokenID = '' + tokenID;
                
                if ( !cachedTokens[ tokenID ] )
                {
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
                        
                        if ( T_SIMPLE & type )
                        {
                            if ( "" === tok.tokens )
                            {
                                // NONSPACE Tokenizer
                                token = new SimpleToken( tokenID, "", DEFAULTSTYLE );
                                token.tt = T_NONSPACE;
                                token.tn = 'NONSPACE';
                                // pre-cache tokenizer to handle recursive calls to same tokenizer
                                cachedTokens[ tokenID ] = token;
                                return token;
                            }
                            else if ( null === tok.tokens )
                            {
                                // EOL Tokenizer
                                token = new SimpleToken( tokenID, "", DEFAULTSTYLE );
                                token.tt = T_EOL;
                                token.tn = 'EOL';
                                // pre-cache tokenizer to handle recursive calls to same tokenizer
                                cachedTokens[ tokenID ] = token;
                                return token;
                            }
                        }
            
                        tok.tokens = make_array( tok.tokens );
                        
                        if ( T_SIMPLE & type )
                        {
                            if ( tok.autocomplete ) getAutoComplete(tok, tokenID, keywords);
                            
                            matchAction = null;
                            if ( tok.push )
                            {
                                matchAction = [ "push", tok.push ];
                            }
                            else if  ( 'undefined' != typeof(tok.pop) )
                            {
                                matchAction = [ "pop", tok.pop ];
                            }
                            
                            // combine by default if possible using word-boundary delimiter
                            combine = ( 'undefined' ==  typeof(tok.combine) ) ? "\\b" : tok.combine;
                            token = new SimpleToken( 
                                        tokenID,
                                        getCompositeMatcher( tokenID, tok.tokens.slice(), RegExpID, combine, cachedRegexes, cachedMatchers ), 
                                        Style[ tokenID ] || DEFAULTSTYLE
                                    );
                            
                            token.tm = matchAction;
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
                            for (i=0, l=tokens.length; i<l; i++)
                                subTokenizers = subTokenizers.concat( getTokenizer( tokens[i], RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, commentTokens, comments, keywords ) );
                            
                            token.set( subTokenizers );
                            
                        }
                        
                        else if ( T_NGRAM & type )
                        {
                            // get n-gram tokenizer
                            token = make_array_2( tok.tokens.slice() ).slice(); // array of arrays
                            ngrams = [];
                            
                            for (i=0, l=token.length; i<l; i++)
                            {
                                // get tokenizers for each ngram part
                                ngrams[i] = token[i].slice();
                                // get tokenizer for whole ngram
                                token[i] = new NGramToken( tokenID + '_NGRAM_' + i, null );
                            }
                            
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                            
                            for (i=0, l=token.length; i<l; i++)
                            {
                                ngram = ngrams[i];
                                
                                subTokenizers = [];
                                for (j=0, l2=ngram.length; j<l2; j++)
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
            grammar.Extra = grammar.Extra || {};
            
            // this grammar is parsed
            grammar.__parsed = 1;
            
            return grammar;
        }
    ;
  