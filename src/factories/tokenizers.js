    
    //
    // tokenizer factories
    var
        SimpleToken = Class({
            
            constructor : function(type, name, token) {
                var ayto = this;
                ayto.tt = type || T_SIMPLE;
                ayto.id = name;
                ayto.tk = token;
                ayto.REQ = 0;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                ayto.CLONE = ['tk'];
            },
            
            sID: null,
            // tokenizer/token name/id
            id: null,
            // tokenizer type
            tt: null,
            // tokenizer token matcher
            tk: null,
            // tokenizer match action (optional)
            tm: null,
            REQ: 0,
            ERR: 0,
            MTCH: 0,
            CLONE: null,
            
            // tokenizer match action (optional)
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
                            
                            if ( data.isEmpty() || t != data.peek() ) return t;
                            data.pop();
                        }
                        else if ( data.length ) data.pop();
                    }
                }
                return 0;
            },
            
            get : function( stream, state ) {
                var ayto = this, matchAction = ayto.tm, token = ayto.tk, 
                    type = ayto.tt, tokenID = ayto.id, t = null;
                
                ayto.MTCH = 0;
                // match EMPTY token
                if ( T_EMPTY == type ) 
                { 
                    ayto.ERR = 0;
                    ayto.REQ = 0;
                    return true;
                }
                // match EOL ( with possible leading spaces )
                else if ( T_EOL == type ) 
                { 
                    stream.spc();
                    if ( stream.eol() )
                    {
                        return tokenID; 
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
                    return tokenID; 
                }
                return false;
            },
            
            req : function(bool) { 
                this.REQ = (bool) ? 1 : 0;
                return this;
            },
            
            err : function() {
                var t = this;
                if ( t.REQ ) return ('Token "'+t.id+'" Expected');
                else if ( t.MTCH ) return ('Token "'+t.MTCH+'" No Match')
                return ('Syntax Error: "'+t.id+'"');
            },
        
            clone : function() {
                var ayto = this, t, i, toClone = ayto.CLONE, toClonelen;
                
                t = new ayto.$class();
                t.tt = ayto.tt;
                t.id = ayto.id;
                t.tm = (ayto.tm) ? ayto.tm.slice() : ayto.tm;
                
                if (toClone && toClone.length)
                {
                    for (i=0, toClonelen = toClone.length; i<toClonelen; i++)   
                        t[ toClone[i] ] = ayto[ toClone[i] ];
                }
                return t;
            },
            
            toString : function() {
                return ['[', 'Tokenizer: ', this.id, ', Matcher: ', ((this.tk) ? this.tk.toString() : null), ']'].join('');
            }
        }),
        
        BlockToken = Class(SimpleToken, {
            
            constructor : function(type, name, token, allowMultiline, escChar, hasInterior) {
                var ayto = this;
                ayto.$superv('constructor', [type, name, token]);
                // a block is multiline by default
                ayto.mline = ( 'undefined' == typeof(allowMultiline) ) ? 1 : allowMultiline;
                ayto.esc = escChar || "\\";
                ayto.inter = hasInterior;
                ayto.CLONE = ['tk', 'mline', 'esc', 'inter'];
            },    
            
            inter: 0,
            mline : 0,
            esc : null,
            
            get : function( stream, state ) {
            
                var ayto = this, ended = 0, found = 0, endBlock, next = "", continueToNextLine, stackPos, 
                    allowMultiline = ayto.mline, startBlock = ayto.tk, thisBlock = ayto.id, type = ayto.tt,
                    hasInterior = ayto.inter, thisBlockInterior = (hasInterior) ? (thisBlock+'.inside') : thisBlock,
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
                    ret = thisBlockInterior;
                }    
                else if ( !state.inBlock && (endBlock = startBlock.get(stream)) )
                {
                    found = 1;
                    state.inBlock = thisBlock;
                    state.endBlock = endBlock;
                    ret = thisBlock;
                }    
                
                if ( found )
                {
                    stackPos = state.stack.pos();
                    
                    isEOLBlock = (T_NULL == endBlock.tt);
                    
                    if ( hasInterior )
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
                            state.stack.pushAt( stackPos, ayto.clone(), 'sID', thisBlock );
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
                                if ( hasInterior )
                                {
                                    if ( stream.pos > streamPos && streamPos > streamPos0 )
                                    {
                                        ret = thisBlockInterior;
                                        stream.bck2(streamPos);
                                        continueBlock = 1;
                                    }
                                    else
                                    {
                                        ret = thisBlock;
                                        ended = 1;
                                    }
                                }
                                else
                                {
                                    ret = thisBlock;
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
                        ret = (isEOLBlock) ? thisBlockInterior : thisBlock;
                    }
                    continueToNextLine = allowMultiline || (isEscapedBlock && charIsEscaped);
                    
                    if ( ended || (!continueToNextLine && !continueBlock) )
                    {
                        state.inBlock = null;
                        state.endBlock = null;
                    }
                    else
                    {
                        state.stack.pushAt( stackPos, ayto.clone(), 'sID', thisBlock );
                    }
                    
                    return ret;
                }
                
                //state.inBlock = null;
                //state.endBlock = null;
                return false;
            }
        }),
                
        RepeatedTokens = Class(SimpleToken, {
                
            constructor : function( type, name, tokens, min, max ) {
                var ayto = this;
                ayto.tt = type || T_REPEATED;
                ayto.id = name || null;
                ayto.tk = null;
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
                stackPos = state.stack.pos();
                stackId = ayto.id+'_'+getId();
                
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
                            state.stack.pushAt( stackPos, ayto.clone(), 'sID', stackId );
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
                
            constructor : function( type, name, tokens ) {
                this.$superv('constructor', [type, name, tokens, 1, 1]);
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
                
            constructor : function( type, name, tokens ) {
                this.$superv('constructor', [type, name, tokens, 1, 1]);
            },
            
            get : function( stream, state ) {
                
                var ayto = this, token, style, tokens = ayto.ts, n = tokens.length,
                    streamPos, stackPos, stackId;
                
                ayto.REQ = 1;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                streamPos = stream.pos;
                stackPos = state.stack.pos();
                token = tokens[ 0 ].clone().req( 1 );
                style = token.get(stream, state);
                stackId = ayto.id+'_'+getId();
                
                if ( false !== style )
                {
                    // not empty token
                    if ( true !== style )
                    {
                        for (var i=n-1; i>0; i--)
                            state.stack.pushAt( stackPos+n-i-1, tokens[ i ].clone().req( 1 ), 'sID', stackId );
                    }
                        
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
                
            constructor : function( type, name, tokens ) {
                this.$superv('constructor', [type, name, tokens, 1, 1]);
            },
            
            get : function( stream, state ) {
                
                var ayto = this, token, style, tokens = ayto.ts, n = tokens.length, 
                    streamPos, stackPos, stackId, i;
                
                ayto.REQ = 0;
                ayto.ERR = 0;
                ayto.MTCH = 0;
                streamPos = stream.pos;
                stackPos = state.stack.pos();
                token = tokens[ 0 ].clone().req( 0 );
                style = token.get(stream, state);
                stackId = ayto.id+'_'+getId();
                
                if ( false !== style )
                {
                    // not empty token
                    if ( true !== style )
                    {
                        for (i=n-1; i>0; i--)
                            state.stack.pushAt( stackPos+n-i-1, tokens[ i ].clone().req( 1 ), 'sID', stackId );
                    }
                    
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
                return new SimpleToken( T_EOL, 'EOL', tokenID );
            }
            
            else if ( "" === tokenID )
            {
                // NONSPACE Tokenizer
                return new SimpleToken( T_NONSPACE, 'NONSPACE', tokenID );
            }
            
            else if ( false === tokenID || 0 === tokenID )
            {
                // EMPTY Tokenizer
                return new SimpleToken( T_EMPTY, 'EMPTY', tokenID );
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
                        
                        // allow tokens to extend / reference other tokens
                        while ( tok['extend'] )
                        {
                            var xtends = tok['extend'], xtendedTok = Lex[xtends] || Syntax[xtends];
                            delete tok['extend'];
                            if ( xtendedTok ) 
                            {
                                // tokens given directly, no token configuration object, wrap it
                                if ( (T_STR | T_ARRAY) & get_type( xtendedTok ) )
                                {
                                    xtendedTok = { type: "simple", tokens: xtendedTok };
                                }
                                tok = extend(xtendedTok, tok);
                            }
                            // xtendedTok may in itself extebnd another tok and so on,
                            // loop and get all references
                        }
                        
                        // provide some defaults
                        type = (tok.type) ? tokenTypes[ tok.type.toUpperCase().replace('-', '').replace('_', '') ] : T_SIMPLE;
                        
                        if ( T_SIMPLE & type )
                        {
                            if ( "" === tok.tokens )
                            {
                                // NONSPACE Tokenizer
                                token = new SimpleToken( T_NONSPACE, tokenID, tokenID );
                                // pre-cache tokenizer to handle recursive calls to same tokenizer
                                cachedTokens[ tokenID ] = token;
                                return token;
                            }
                            else if ( null === tok.tokens )
                            {
                                // EOL Tokenizer
                                token = new SimpleToken( T_EOL, tokenID, tokenID );
                                // pre-cache tokenizer to handle recursive calls to same tokenizer
                                cachedTokens[ tokenID ] = token;
                                return token;
                            }
                            else if ( false === tok.tokens || 0 === tok.tokens )
                            {
                                // EMPTY Tokenizer
                                token = new SimpleToken( T_EMPTY, tokenID, tokenID );
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
                            token = new SimpleToken( T_SIMPLE, tokenID,
                                        getCompositeMatcher( tokenID, tok.tokens.slice(), RegExpID, combine, cachedRegexes, cachedMatchers )
                                    );
                            
                            token.tm = matchAction;
                            // pre-cache tokenizer to handle recursive calls to same tokenizer
                            cachedTokens[ tokenID ] = token;
                        }
                        
                        else if ( T_BLOCK & type )
                        {
                            if ( T_COMMENT & type ) getComments(tok, comments);

                            token = new BlockToken( type, tokenID,
                                        getBlockMatcher( tokenID, tok.tokens.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
                                        tok.multiline,
                                        tok.escape,
                                        // allow block delims / block interior to have different styles
                                        Style[ tokenID + '.inside' ] ? 1 : 0
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
                                token = new RepeatedTokens(T_REPEATED, tokenID, null, tok.match[0], tok.match[1]);
                            }
                            else
                            {
                                matchType = groupTypes[ tok.match.toUpperCase() ]; 
                                
                                if (T_ZEROORONE == matchType) 
                                    token = new RepeatedTokens(T_ZEROORONE, tokenID, null, 0, 1);
                                
                                else if (T_ZEROORMORE == matchType) 
                                    token = new RepeatedTokens(T_ZEROORMORE, tokenID, null, 0, INF);
                                
                                else if (T_ONEORMORE == matchType) 
                                    token = new RepeatedTokens(T_ONEORMORE, tokenID, null, 1, INF);
                                
                                else if (T_EITHER & matchType) 
                                    token = new EitherTokens(T_EITHER, tokenID, null);
                                
                                else //if (T_ALL == matchType)
                                    token = new AllTokens(T_ALL, tokenID, null);
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
                                token[i] = new NGramToken( T_NGRAM, tokenID + '_NGRAM_' + i, null );
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
  