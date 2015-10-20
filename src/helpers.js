
//
// tokenizer helpers
var escaped_re = /([.*+?^${}()|[\]\/\\\-])/g, peg_bnf_special_re = /^([.\[\]{}()*+?\/|'"]|\s)/;

function esc_re( s )
{
    return s.replace(escaped_re, '\\$1');
}

function new_re( re, fl )
{
    return new RegExp(re, fl||'');
}

function get_delimited( src, delim, esc, collapse_esc )
{
    var c, i=src.pos, l=src.length, s='', escaped, is_esc, esc_cnt, can_be_escaped=!!esc;
    if ( can_be_escaped )
    {
        collapse_esc = !!collapse_esc; escaped = false; esc_cnt = 0;
        while ( i<l )
        {
            c = src[CHAR](i++);
            if ( delim === c && !escaped ) break;
            is_esc = esc === c; escaped = !escaped && is_esc;
            if ( collapse_esc )
            {
                if ( is_esc ) esc_cnt++;
                if ( !is_esc || esc_cnt&2 )
                {
                    s += c;
                    esc_cnt = 0;
                }
            }
            else s += c;
        }
        if ( esc_cnt&2 ) s += esc;
    }
    else
    {
        while ( i<l )
        {
            c = src[CHAR](i++);
            if ( delim === c ) break;
            s += c;
        }
    }
    src.pos = i;
    return s;
}

function group_replace( pattern, token, raw )
{
    var i, l, c, g, replaced, offset = true === raw ? 0 : 1;
    if ( T_STR & get_type(token) ) { token = [token, token]; offset = 0; }
    l = pattern.length; replaced = ''; i = 0;
    while ( i<l )
    {
        c = pattern[CHAR](i);
        if ( (i+1<l) && '$' === c )
        {
            g = pattern.charCodeAt(i+1);
            if ( 36 === g ) // escaped $ character
            {
                replaced += '$';
                i += 2;
            }
            else if ( 48 <= g && g <= 57 ) // group between 0 and 9
            {
                replaced += token[ offset + g - 48 ] || '';
                i += 2;
            }
            else
            {
                replaced += c;
                i += 1;
            }
        }
        else
        {
            replaced += c;
            i += 1;
        }
    }
    return replaced;
}

function get_re( r, rid, cachedRegexes )
{
    if ( !r || ((T_NUM|T_REGEX) & get_type(r)) ) return r;
    
    var l = rid ? (rid.length||0) : 0, i;
    
    if ( l && rid === r.substr(0, l) ) 
    {
        var regexSource = r.substr(l), delim = regexSource[CHAR](0), flags = '',
            regexBody, regexID, regex, i, ch
        ;
        
        // allow regex to have delimiters and flags
        // delimiter is defined as the first character after the regexID
        i = regexSource.length;
        while ( i-- )
        {
            ch = regexSource[CHAR](i);
            if ( delim === ch ) break;
            else if ('i' === ch.toLowerCase() ) flags = 'i';
        }
        regexBody = regexSource.substring(1, i);
        regexID = "^(" + regexBody + ")";
        
        if ( !cachedRegexes[ regexID ] )
        {
            regex = new_re( regexID, flags );
            // shared, light-weight
            cachedRegexes[ regexID ] = regex;
        }
        
        return cachedRegexes[ regexID ];
    }
    else
    {
        return r;
    }
}

function get_combined_re( tokens, boundary, case_insensitive )
{
    var b = "", combined;
    if ( T_STR & get_type(boundary) ) b = boundary;
    combined = map( tokens.sort( by_length ), esc_re ).join( "|" );
    return [ new_re("^(" + combined + ")"+b, case_insensitive ? "i": ""), 1 ];
}


function get_simplematcher( name, pattern, key, cachedMatchers ) 
{
    var T = get_type( pattern );
    
    if ( T_NUM === T ) return pattern;
    if ( cachedMatchers[ name ] ) return cachedMatchers[ name ];
    
    key = key || 0;
    var mtcher, is_char_list = 0;
    
    if ( pattern && pattern.isCharList ) { is_char_list = 1; del(pattern,'isCharList'); }
    
    // get a fast customized matcher for < pattern >
    if ( T_NULL === T ) mtcher = new matcher( P_SIMPLE, name, pattern, T_NULL, key );
    else if ( T_CHAR === T ) mtcher = new matcher( P_SIMPLE, name, pattern, T_CHAR, key );
    else if ( T_REGEX_OR_ARRAY & T ) mtcher = new matcher( P_SIMPLE, name, pattern, T_REGEX, key );
    else if ( T_STR & T ) mtcher = new matcher( P_SIMPLE, name, pattern, is_char_list ? T_CHARLIST : T_STR, key );
    else mtcher = pattern; // unknown
    
    return cachedMatchers[ name ] = mtcher;
}

function get_compositematcher( name, tokens, RegExpID, combined, caseInsensitive, cachedRegexes, cachedMatchers ) 
{
    if ( cachedMatchers[ name ] ) return cachedMatchers[ name ];
    
    var tmp, i, l, l2, array_of_arrays = 0, 
        has_regexs = 0, is_char_list = 1, 
        T1, T2, mtcher;
    
    tmp = make_array( tokens ); l = tmp.length;
    
    if ( 1 === l )
    {
        mtcher = get_simplematcher( name, get_re( tmp[0], RegExpID, cachedRegexes ), 0, cachedMatchers );
    }
    else if ( 1 < l /*combined*/ )
    {   
        l2 = (l>>>1) + 1;
        // check if tokens can be combined in one regular expression
        // if they do not contain sub-arrays or regular expressions
        for (i=0; i<=l2; i++)
        {
            T1 = get_type( tmp[i] ); T2 = get_type( tmp[l-1-i] );
            
            if ( (T_CHAR !== T1) || (T_CHAR !== T2) ) 
            {
                is_char_list = 0;
            }
            
            if ( (T_ARRAY & T1) || (T_ARRAY & T2) ) 
            {
                array_of_arrays = 1;
                //break;
            }
            else if ( (T_REGEX & T1) || (T_REGEX & T2) || 
                has_prefix( tmp[i], RegExpID ) || has_prefix( tmp[l-1-i], RegExpID ) )
            {
                has_regexs = 1;
                //break;
            }
        }
        
        if ( is_char_list && ( !combined || !( T_STR & get_type(combined) ) ) )
        {
            tmp = tmp.slice().join('');
            tmp.isCharList = 1;
            mtcher = get_simplematcher( name, tmp, 0, cachedMatchers );
        }
        else if ( combined && !(array_of_arrays || has_regexs) )
        {   
            mtcher = get_simplematcher( name, get_combined_re( tmp, combined, caseInsensitive ), 0, cachedMatchers );
        }
        else if ( array_of_arrays || has_regexs )
        {
            for (i=0; i<l; i++)
            {
                if ( T_ARRAY & get_type( tmp[i] ) )
                    tmp[i] = get_compositematcher( name + '_' + i, tmp[i], RegExpID, combined, caseInsensitive, cachedRegexes, cachedMatchers );
                else
                    tmp[i] = get_simplematcher( name + '_' + i, get_re( tmp[i], RegExpID, cachedRegexes ), i, cachedMatchers );
            }
            
            mtcher = l > 1 ? new matcher( P_COMPOSITE, name, tmp ) : tmp[0];
        }
        else /* strings */
        {
            tmp = tmp.sort( by_length );
            for (i=0; i<l; i++)
            {
                tmp[i] = get_simplematcher( name + '_' + i, get_re( tmp[i], RegExpID, cachedRegexes ), i, cachedMatchers );
            }
            
            mtcher = l > 1 ? new matcher( P_COMPOSITE, name, tmp ) : tmp[0];
        }
    }
    return cachedMatchers[ name ] = mtcher;
}

function get_blockmatcher( name, tokens, RegExpID, cachedRegexes, cachedMatchers ) 
{
    if ( cachedMatchers[ name ] ) return cachedMatchers[ name ];

    var tmp = make_array_2( tokens ), start = [], end = [];
    
    // build start/end mappings
    iterate(function( i ) {
        var t1, t2;
        t1= get_simplematcher( name + '_0_' + i, get_re( tmp[i][0], RegExpID, cachedRegexes ), i, cachedMatchers );
        if ( tmp[i].length > 1 )
        {
            if ( T_REGEX === t1.ptype && T_STR === get_type( tmp[i][1] ) && !has_prefix( tmp[i][1], RegExpID ) )
                t2 = tmp[i][1];
            else
                t2 = get_simplematcher( name + '_1_' + i, get_re( tmp[i][1], RegExpID, cachedRegexes ), i, cachedMatchers );
        }
        else
        {
            t2 = t1;
        }
        start.push( t1 );  end.push( t2 );
    }, 0, tmp.length-1);
    
    return cachedMatchers[ name ] = new matcher( P_BLOCK, name, [start, end] );
}

function get_comments( tok, comments ) 
{
    // build start/end mappings
    var tmp = make_array_2(tok.tokens.slice());
    iterate(function( i ) {
        var start = tmp[i][0],
            end = tmp[i].length>1 ? tmp[i][1] : tmp[i][0],
            lead = tmp[i].length>2 ? tmp[i][2] : "";
        
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
    }, 0, tmp.length-1);
}

function get_autocomplete( tok, type, keywords ) 
{
    var meta = tok.meta || type, case_insesitive = !!(tok.caseInsesitive||tok.ci),
        kws = map(make_array( tok.tokens ), function( word ) {
            return {word:word, meta:meta, ci:case_insesitive};
        });
    keywords.autocomplete = (keywords.autocomplete || []).concat( kws );
}

function preprocess_grammar( grammar )
{
    if ( !grammar.Lex ) grammar.Lex = {};
    if ( !grammar.Syntax ) grammar.Syntax = {};
    var id, type, t, tok, T, xtends, xtok, tl, tt,
        Lex = grammar.Lex, Syntax = grammar.Syntax, 
        conf = [Lex, Syntax], nG = conf.length, G, i, i1, i2, T1;
    
    // handle token-type annotations in token_ID
    i = 0;
    while ( i < nG )
    {
        G = conf[i++];
        for (t in G)
        {
            if ( !G[HAS](t) ) continue;
            id = t.split(':');
            type = id[1] && trim(id[1]).length ? trim(id[1]) : null;
            id = trim(id[0]);
            if ( !id.length ) { id=t; type=null; } // literal ':' token, bypass
            if ( id !== t )
            {
                G[id] = G[t]; del(G,t);
                if ( type )
                {
                    type = type[LOWER]();
                    tok = G[id]; T = get_type(tok);
                    if ( T_OBJ === T )
                    {
                        if ( !G[id].type ) G[id].type = type;
                    }
                    else
                    {
                        G[id] = {type:type};
                        if ( 'error' === type )
                        {
                            G[id].type = 'action';
                            G[id].error = tok;
                        }
                        else if ( 'group' === type )
                        {
                            G[id].type = 'sequence';
                            G[id].tokens = tok;
                        }
                        else if ( 'action' === type && T_STR === T )
                        {
                            G[id][tok] = true;
                        }
                        else
                        {                            
                            G[id].tokens = tok;
                        }
                    }
                }
            }
            if ( Lex === G )
            {
                if ( T_STR_OR_ARRAY_OR_REGEX & get_type(G[id]) )
                {
                    // simple token given as literal token, wrap it
                    G[id] = {type:"simple", tokens:G[id]};
                }
                //if ( !G[id].type ) G[id].type = 'simple';
                tok = G[id];
                
                if ( tok.type )
                {
                    tl = tok.type = tok.type[LOWER]();
                    
                    if ( 'line-block' === tl )
                    {
                        tok.type = 'block';
                        tok.multiline = false;
                        tok.escape = false;
                    }
                    else if ( 'escaped-line-block' === tl )
                    {
                        tok.type = 'block';
                        tok.multiline = false;
                        tok.escape = '\\';
                    }
                    else if ( 'escaped-block' === tl )
                    {
                        tok.type = 'block';
                        tok.multiline = true;
                        tok.escape = '\\';
                    }
                }
            }
        }
    }
    
    // handle token extensions in Lex, if any
    G = Lex;
    for (id in G)
    {
        if ( !G[HAS](id) ) continue;
        tok = G[id];
        // allow tokens to extend / reference other tokens
        while ( tok['extend'] )
        {
            xtends = tok['extend']; del(tok,'extend');
            xtok = Lex[ xtends ]/* || Syntax[ xtends ]*/;
            if ( xtok ) 
            {
                // tokens given directly, no token configuration object, wrap it
                if ( T_STR_OR_ARRAY_OR_REGEX & get_type( xtok ) )
                {
                    xtok = Lex[ xtends ] = {type:"simple", tokens:xtok};
                }
                //if ( !xtok.type ) xtok.type = 'simple';
                tok = extend( xtok, tok );
            }
            // xtok may in itself extend another tok and so on,
            // loop and get all references
        }
    }
    
    // handle Lex shorthands and defaults
    G = Lex;
    for (id in G)
    {
        if ( !G[HAS](id) ) continue;
        tok = G[id];
        if ( tok.type )
        {
            tl = tok.type = tok.type[LOWER]();
            if ( 'line-block' === tl )
            {
                tok.type = 'block';
                tok.multiline = false;
                tok.escape = false;
            }
            else if ( 'escaped-line-block' === tl )
            {
                tok.type = 'block';
                tok.multiline = false;
                tok.escape = '\\';
            }
            else if ( 'escaped-block' === tl )
            {
                tok.type = 'block';
                tok.multiline = true;
                tok.escape = '\\';
            }
        }
        else
        {
            if ( tok['escaped-line-block'] )
            {
                tok.type = "block";
                tok.multiline = false;
                if ( !tok.escape ) tok.escape = '\\';
                tok.tokens = tok['escaped-line-block'];
                del(tok,'escaped-line-block');
            }
            else if ( tok['escaped-block'] )
            {
                tok.type = "block";
                tok.multiline = true;
                if ( !tok.escape ) tok.escape = '\\';
                tok.tokens = tok['escaped-block'];
                del(tok,'escaped-block');
            }
            else if ( tok['line-block'] )
            {
                tok.type = "block";
                tok.multiline = false;
                tok.escape = false;
                tok.tokens = tok['line-block'];
                del(tok,'line-block');
            }
            else if ( tok['comment'] )
            {
                tok.type = "comment";
                tok.escape = false;
                tok.tokens = tok['comment'];
                del(tok,'comment');
            }
            else if ( tok['block'] )
            {
                tok.type = "block";
                tok.tokens = tok['block'];
                del(tok,'block');
            }
            else if ( tok['simple'] )
            {
                tok.type = "simple";
                tok.tokens = tok['simple'];
                del(tok,'simple');
            }
            else if ( tok['error'] )
            {
                tok.type = "action";
                tok.action = [ 'error', tok.error, !!tok['in-context'] ];
                del(tok,'error');
            }
            else if ( tok[HAS]('context') )
            {
                tok.type = "action";
                tok.action = [ !!tok.context ? 'context-start' : 'context-end', tok['context'], !!tok['in-context'] ];
                del(tok,'context');
            }
            else if ( tok['indent'] )
            {
                tok.type = "action";
                tok.action = [ 'indent', tok.indent, !!tok['in-context'] ];
                del(tok,'indent');
            }
            else if ( tok['outdent'] )
            {
                tok.type = "action";
                tok.action = [ 'outdent', tok.outdent, !!tok['in-context'] ];
                del(tok,'outdent');
            }
            else if ( tok['unique'] )
            {
                tok.type = "action";
                tok.action = [ 'unique', T_STR&get_type(tok.unique) ? ['_DEFAULT_', tok.unique] : tok.unique, !!tok['in-context'] ];
                del(tok,'unique');
            }
            else if ( tok['push'] )
            {
                tok.type = "action";
                tok.action = [ 'push', tok.push, !!tok['in-context'] ];
                del(tok,'push');
            }
            else if ( tok[HAS]('pop') )
            {
                tok.type = "action";
                tok.action = [ 'pop', tok.pop, !!tok['in-context'] ];
                del(tok,'pop');
            }
            else
            {
                tok.type = "simple";
            }
        }
        if ( 'action' === tok.type )
        {
            tok.ci = !!(tok.caseInsesitive||tok.ci);
        }
        else if ( 'block' === tok.type || 'comment' === tok.type )
        {
            tok.multiline = tok[HAS]('multiline') ? !!tok.multiline : true;
            if ( !(T_STR & get_type(tok.escape)) ) tok.escape = false;
        }
        else if ( 'simple' === tok.type )
        {
            tok.autocomplete = !!tok.autocomplete;
            tok.meta = tok.autocomplete && (T_STR & get_type(tok.meta)) ? tok.meta : null;
            tok.combine = !tok[HAS]('combine') ? "\\b" : tok.combine;
            tok.ci = !!(tok.caseInsesitive||tok.ci);
        }
    }
    
    // handle Syntax shorthands and defaults
    G = Syntax;
    for (id in G)
    {
        if ( !G[HAS](id) ) continue;
        tok = G[id];
        if ( T_OBJ === get_type(tok) && !tok.type )
        {
            if ( tok['ngram'] || tok['n-gram'] )
            {
                tok.type = "ngram";
                tok.tokens = tok['ngram'] || tok['n-gram'];
                if ( tok['n-gram'] ) del(tok,'n-gram'); else del(tok,'ngram');
            }
            else if ( tok['sequence'] || tok['all']  )
            {
                tok.type = "sequence";
                tok.tokens = tok['sequence'] || tok['all'];
                if ( tok['all'] ) del(tok,'all'); else del(tok,'sequence');
            }
            else if ( tok['alternation'] || tok['either'] )
            {
                tok.type = "alternation";
                tok.tokens = tok['alternation'] || tok['either'];
                if ( tok['either'] ) del(tok,'either'); else del(tok,'alternation');
            }
            else if ( tok['zeroOrOne'] )
            {
                tok.type = "zeroOrOne";
                tok.tokens = tok['zeroOrOne'];
                del(tok,'zeroOrOne');
            }
            else if ( tok['zeroOrMore'] )
            {
                tok.type = "zeroOrMore";
                tok.tokens = tok['zeroOrMore'];
                del(tok,'zeroOrMore');
            }
            else if ( tok['oneOrMore'] )
            {
                tok.type = "oneOrMore";
                tok.tokens = tok['oneOrMore'];
                del(tok,'oneOrMore');
            }
        }
        else if ( tok.type )
        {
            tl = tok.type = tok.type[LOWER]();
            if ( 'group' === tl && tok.match )
            {
                T = get_type(tok.match);
                if ( T_STR & T )
                {
                    tt = tok.match[LOWER]();
                    if ( 'alternation' === tt || 'either' === tt )
                    {
                        tok.type = 'alternation';
                        del(tok,'match');
                    }
                    else if ( 'sequence' === tt || 'all' === tt )
                    {
                        tok.type = 'sequence';
                        del(tok,'match');
                    }
                    else if ( 'zeroorone' === tt )
                    {
                        tok.type = 'zeroOrOne';
                        del(tok,'match');
                    }
                    else if ( 'zeroormore' === tt )
                    {
                        tok.type = 'zeroOrMore';
                        del(tok,'match');
                    }
                    else if ( 'oneormore' === tt )
                    {
                        tok.type = 'oneOrMore';
                        del(tok,'match');
                    }
                    else
                    {
                        tok.type = 'sequence';
                        del(tok,'match');
                    }
                }
                else if ( T_ARRAY & T )
                {
                    tok.type = "repeat";
                    tok.repeat = tok.match;
                    del(tok,'match');
                }
            }
            else if ( 'either' === tl )
            {
                tok.type = "alternation";
            }
            else if ( 'all' === tl )
            {
                tok.type = "sequence";
            }
        }
    }
    return grammar;
}

function parse_peg_bnf_notation( tok, Lex, Syntax )
{
    var alternation, sequence, token, literal, repeat, 
        t, c, fl, prev_token, curr_token, stack, tmp, modifier = false, lookahead = false;
    
    t = new String( trim(tok) ); t.pos = 0;
    
    if ( 1 === t.length )
    {
        curr_token = '' + tok;
        if ( !Lex[ curr_token ] ) Lex[ curr_token ] = { type:"simple", tokens:tok };
        tok = curr_token;
    }
    else
    {
        // parse PEG/BNF-like shorthand notations for syntax groups
        alternation = [ ]; sequence = [ ];
        token = ''; stack = [];
        while ( t.pos < t.length )
        {
            c = t[CHAR]( t.pos++ );
            
            if ( peg_bnf_special_re.test( c ) )
            {
                if ( token.length )
                {
                    if ( modifier )
                    {
                        // interpret as modifier / group / decorator
                        if ( sequence.length )
                        {
                            prev_token = sequence[sequence.length-1];
                            curr_token  = prev_token + '.' + token;
                            if ( !Lex[curr_token] && !Syntax[curr_token] )
                            {
                                Syntax[ curr_token ] = clone(Lex[prev_token] || Syntax[prev_token]);
                                Syntax[ curr_token ].modifier = token;
                            }
                            sequence[ sequence.length-1 ] = curr_token;
                        }
                        modifier = false;
                    }
                    else if ( '0' === token )
                    {
                        // interpret as empty tokenizer
                        if ( !Lex[$T_EMPTY$] ) Lex[$T_EMPTY$] = { type:"simple", tokens:0/*T_EMPTY*/ };
                        sequence.push( $T_EMPTY$ );
                    }
                    else if ( '^^' === token )
                    {
                        // interpret as SOF tokenizer
                        if ( !Lex[$T_SOF$] ) Lex[$T_SOF$] = { type:"simple", tokens:T_SOF };
                        sequence.push( $T_SOF$ );
                    }
                    else if ( '^' === token )
                    {
                        // interpret as SOL tokenizer
                        if ( !Lex[$T_SOL$] ) Lex[$T_SOL$] = { type:"simple", tokens:T_SOL };
                        sequence.push( $T_SOL$ );
                    }
                    else if ( '$' === token )
                    {
                        // interpret as EOL tokenizer
                        if ( !Lex[$T_EOL$] ) Lex[$T_EOL$] = { type:"simple", tokens:T_EOL };
                        sequence.push( $T_EOL$ );
                    }
                    else
                    {
                        if ( !Lex[token] && !Syntax[token] ) Lex[ token ] = { type:'simple', tokens:token };
                        sequence.push( token );
                    }
                    token = '';
                }
            
                if ( '.' === c )
                {
                    modifier = true;
                }
                
                else if ( '"' === c || "'" === c )
                {
                    // literal token, quoted
                    literal = get_delimited( t, c, '\\', true );
                    if ( literal.length )
                    {
                        curr_token = '' + literal;
                        if ( !Lex[curr_token] ) Lex[curr_token] = { type:'simple', tokens:literal };
                        sequence.push( curr_token );
                    }
                    else
                    {
                        // interpret as non-space tokenizer
                        if ( !Lex[$T_NONSPACE$] ) Lex[$T_NONSPACE$] = { type:"simple", tokens:'' };
                        sequence.push( $T_NONSPACE$ );
                    }
                }
                
                else if ( '/' === c )
                {
                    // literal regex token
                    literal = get_delimited( t, c, '\\', true ); fl = '';
                    if ( literal.length )
                    {
                        if ( t.pos < t.length && 'i' === t[CHAR](t.pos) ) { t.pos++; fl = 'i'; }
                        curr_token = '/' + literal + '/' + fl;
                        if ( !Lex[curr_token] ) Lex[curr_token] = { type:'simple', tokens:new_re("^("+literal+")",fl) };
                        sequence.push( curr_token );
                    }
                }
                
                else if ( '*' === c || '+' === c || '?' === c )
                {
                    // repeat modifier, applies to token that comes before
                    prev_token = sequence[sequence.length-1];
                    curr_token = '' + prev_token + c;
                    if ( !Syntax[ curr_token ] )
                        Syntax[ curr_token ] = {
                            type:'*' === c ? 'zeroOrMore' : ('+' === c ? 'oneOrMore' : 'zeroOrOne'),
                            tokens:[prev_token]
                        }
                    sequence[sequence.length-1] = curr_token;
                }
                
                else if ( '{' === c )
                {
                    // literal repeat modifier, applies to token that comes before
                    repeat = get_delimited( t, '}', false );
                    repeat = map( repeat.split( ',' ), trim );
                    
                    if ( !repeat[0].length ) repeat[0] = 0; // {,m} match 0 times or more
                    else repeat[0] = parseInt(repeat[0], 10) || 0;// {n,m} match n times up to m times
                    if ( 0 > repeat[0] ) repeat[0] = 0;
                    
                    if ( 2 > repeat.length ) repeat.push( repeat[0] ); // {n} match exactly n times
                    else if ( !repeat[1].length ) repeat[1] = INF; // {n,} match n times or more (INF)
                    else repeat[1] = parseInt(repeat[1], 10) || INF; // {n,m} match n times up to m times
                    if ( 0 > repeat[1] ) repeat[1] = 0;
                    
                    prev_token = sequence[sequence.length-1];
                    curr_token = '' + prev_token + [
                        '{',
                        repeat[0],
                        ',',
                        isFinite(repeat[1]) ? repeat[1] : '',
                        '}'
                    ].join('');
                    if ( !Syntax[ curr_token ] )
                        Syntax[ curr_token ] = { type:'repeat', repeat:[repeat[0], repeat[1]], tokens:[prev_token] }
                    sequence[sequence.length-1] = curr_token;
                }
                
                else if ( '}' === c )
                {
                    // literal repeat end modifier, should be handled in previous case
                    // added here just for completeness
                    continue;
                }
                
                else if ( '[' === c )
                {
                    // start of character select
                    literal = get_delimited( t, ']', '\\', true );
                    curr_token = '[' + literal + ']';
                    if ( !Lex[curr_token] )
                        Lex[curr_token] = {
                            type:'simple',
                            tokens:new_re("^(["+('^'===literal[CHAR](0)?('^'+esc_re(literal.slice(1))):esc_re(literal))+"])")
                            //                                          negative match,      else   positive match
                        /*literal.split('')*/};
                    sequence.push( curr_token );
                }
                
                else if ( ']' === c )
                {
                    // end of character select, should be handled in previous case
                    // added here just for completeness
                    continue;
                }
                
                else if ( '|' === c )
                {
                    modifier = false;
                    // alternation
                    if ( sequence.length > 1 )
                    {
                        curr_token = '' + sequence.join( " " );
                        if ( !Syntax[curr_token] ) Syntax[curr_token] = { type:'sequence', tokens:sequence };
                        alternation.push( curr_token );
                    }
                    else if ( sequence.length )
                    {
                        alternation.push( sequence[0] );
                    }
                    else
                    {
                        // ??
                    }
                    sequence = [];
                }
                
                else if ( '(' === c )
                {
                    // start of grouped sub-sequence
                    stack.push([sequence, alternation, token]);
                    sequence = []; alternation = []; token = '';
                }
                
                else if ( ')' === c )
                {
                    // end of grouped sub-sequence
                    if ( sequence.length > 1 )
                    {
                        curr_token = '' + sequence.join( " " );
                        if ( !Syntax[curr_token] ) Syntax[curr_token] = { type:'sequence', tokens:sequence };
                        alternation.push( curr_token );
                    }
                    else if ( sequence.length )
                    {
                        alternation.push( sequence[0] );
                    }
                    sequence = [];
                    
                    if ( alternation.length > 1 )
                    {
                        curr_token = '' + alternation.join( " | " );
                        if ( !Syntax[curr_token] ) Syntax[curr_token] = { type:'alternation', tokens:alternation };
                    }
                    else if ( alternation.length )
                    {
                        curr_token = alternation[ 0 ];
                    }
                    alternation = [];
                    
                    tmp = stack.pop( );
                    sequence = tmp[0]; alternation = tmp[1]; token = tmp[2];
                    
                    prev_token = curr_token;
                    curr_token = '(' + prev_token + ')';
                    if ( !Syntax[curr_token] ) Syntax[curr_token] = clone( Lex[prev_token] || Syntax[prev_token] );
                    sequence.push( curr_token );
                }
                
                else // space
                {
                    // space separator, i.e sequence of tokens
                    //continue;
                }
            }
            else
            {
                token += c;
            }
        }
        
        if ( token.length )
        {
            if ( modifier )
            {
                // interpret as modifier / decorator
                if ( sequence.length )
                {
                    prev_token = sequence[sequence.length-1];
                    curr_token  = prev_token + '.' + token;
                    if ( !Lex[curr_token] && !Syntax[curr_token] )
                    {
                        Syntax[ curr_token ] = clone(Lex[prev_token] || Syntax[prev_token]);
                        Syntax[ curr_token ].modifier = token;
                    }
                    sequence[ sequence.length-1 ] = curr_token;
                }
                modifier = false;
            }
            else if ( '0' === token )
            {
                // interpret as empty tokenizer
                if ( !Lex[$T_EMPTY$] ) Lex[$T_EMPTY$] = { type:"simple", tokens:0/*T_EMPTY*/ };
                sequence.push( $T_EMPTY$ );
            }
            else if ( '^^' === token )
            {
                // interpret as SOF tokenizer
                if ( !Lex[$T_SOF$] ) Lex[$T_SOF$] = { type:"simple", tokens:T_SOF };
                sequence.push( $T_SOF$ );
            }
            else if ( '^' === token )
            {
                // interpret as SOL tokenizer
                if ( !Lex[$T_SOL$] ) Lex[$T_SOL$] = { type:"simple", tokens:T_SOL };
                sequence.push( $T_SOL$ );
            }
            else if ( '$' === token )
            {
                // interpret as EOL tokenizer
                if ( !Lex[$T_EOL$] ) Lex[$T_EOL$] = { type:"simple", tokens:T_EOL };
                sequence.push( $T_EOL$ );
            }
            else
            {
                if ( !Lex[token] && !Syntax[token] ) Lex[ token ] = { type:'simple', tokens:token };
                sequence.push( token );
            }
        }
        token = '';
        
        if ( sequence.length > 1 )
        {
            curr_token = '' + sequence.join( " " );
            if ( !Syntax[curr_token] ) Syntax[curr_token] = { type:'sequence', tokens:sequence };
            alternation.push( curr_token );
        }
        else if ( sequence.length )
        {
            alternation.push( sequence[0] );
        }
        else
        {
            // ??
        }
        sequence = [];
        
        if ( alternation.length > 1 )
        {
            curr_token = '' + alternation.join( " | " );
            if ( !Syntax[curr_token] ) Syntax[curr_token] = { type:'alternation', tokens:alternation };
            tok = curr_token;
        }
        else if ( alternation.length )
        {
            tok = alternation[ 0 ];
        }
        else
        {
            // ??
        }
        alternation = [];
    }
    return tok;
}

function get_tokenizer( tokenID, RegExpID, Lex, Syntax, Style, 
                    cachedRegexes, cachedMatchers, cachedTokens, 
                    interleavedTokens, comments, keywords ) 
{
    var $token$ = null, $msg$ = null, $modifier$ = null, $type$, $tokens$, t, tt, token, combine;
    
    if ( T_SOF === tokenID || T_SOL === tokenID || T_EOL === tokenID )
    {
        // SOF/SOL/EOL Token
        return new tokenizer( tokenID, (T_SOF===tokenID?$T_SOF$:(T_SOL===tokenID?$T_SOL$:$T_EOL$)), tokenID, $msg$ );
    }
    
    else if ( false === tokenID || 0/*T_EMPTY*/ === tokenID )
    {
        // EMPTY Token
        return new tokenizer( T_EMPTY, $T_EMPTY$, 0, $msg$ );
    }
    
    else if ( '' === tokenID )
    {
        // NONSPACE Token
        return new tokenizer( T_NONSPACE, $T_NONSPACE$, '', $msg$ );
    }
    
    else if ( null === tokenID )
    {
        // skip-to-EOL Token
        return new tokenizer( T_SIMPLE, $T_NULL$, T_NULL, $msg$, $modifier$ );
    }
    
    else if ( T_ARRAY & get_type( tokenID ) )
    {
        // literal n-gram as array
        t = tokenID;
        tokenID = "NGRAM_" + t.join("_");
        if ( !Syntax[ tokenID ] ) Syntax[ tokenID ] = { type:"ngram", tokens:t };
    }
    
    tokenID = '' + tokenID;
    if ( cachedTokens[ tokenID ] ) return cachedTokens[ tokenID ];
    
    token = Lex[ tokenID ] || Syntax[ tokenID ] || tokenID;
    if ( T_STR & get_type(token) )
    {
        token = parse_peg_bnf_notation( token, Lex, Syntax );
        token = Lex[ token ] || Syntax[ token ] || null;
    }
    if ( !token ) return null;
    
    $type$ = token.type ? tokenTypes[ token.type[LOWER]( ).replace( dashes_re, '' ) ] || T_SIMPLE : T_SIMPLE;
    $msg$ = token.msg || null; $modifier$ = token.modifier || null;
    $tokens$ = token.tokens;
    
    if ( T_SIMPLE & $type$ )
    {
        if ( T_SOF === $tokens$ || T_SOL === $tokens$ || T_EOL === $tokens$ )
        {
            // SOF/SOL/EOL Token
            $token$ = new tokenizer( $tokens$, tokenID, $tokens$, $msg$ );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = $token$; return $token$;
        }
        
        else if ( false === $tokens$ || 0/*T_EMPTY*/ === $tokens$ )
        {
            // EMPTY Token
            $token$ = new tokenizer( T_EMPTY, tokenID, 0, $msg$ );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = $token$; return $token$;
        }
        
        else if ( '' === $tokens$ )
        {
            // NONSPACE Token
            $token$ = new tokenizer( T_NONSPACE, tokenID, '', $msg$ );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = $token$; return $token$;
        }
        
        else if ( null === $tokens$ )
        {
            // skip-to-EOL Token
            $token$ = new tokenizer( T_SIMPLE, tokenID, T_NULL, $msg$, $modifier$ );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = $token$;
            return $token$;
        }
        
        else if ( !$tokens$ )
        {
            return null;
        }
    }

    if ( T_ACTION & $type$ )
    {
        if ( !token[HAS]('action') )
        {
            if ( token[HAS]('error') ) token.action = [A_ERROR, token.error, !!token['in-context']];
            else if ( token[HAS]('context') ) token.action = [!!token.context?A_CTXSTART:A_CTXEND, token['context'], !!token['in-context']];
            else if ( token[HAS]('context-start') ) token.action = [A_CTXSTART, token['context-start'], !!token['in-context']];
            else if ( token[HAS]('context-end') ) token.action = [A_CTXEND, token['context-end'], !!token['in-context']];
            else if ( token[HAS]('push') ) token.action = [A_MCHSTART, token.push, !!token['in-context']];
            else if ( token[HAS]('pop') ) token.action = [A_MCHEND, token.pop, !!token['in-context']];
            else if ( token[HAS]('unique') ) token.action = [A_UNIQUE, T_STR&get_type(token.unique)?['_DEFAULT_',token.unique]:token.unique, !!token['in-context']];
            else if ( token[HAS]('indent') ) token.action = [A_INDENT, token.indent, !!token['in-context']];
            else if ( token[HAS]('outdent') ) token.action = [A_OUTDENT, token.outdent, !!token['in-context']];
        }
        else
        {
            if ( 'error' === token.action[0] ) token.action[0] = A_ERROR;
            else if ( 'context-start' === token.action[0] ) token.action[0] = A_CTXSTART;
            else if ( 'context-end' === token.action[0] ) token.action[0] = A_CTXEND;
            else if ( 'push' === token.action[0] ) token.action[0] = A_MCHSTART;
            else if ( 'pop' === token.action[0] ) token.action[0] = A_MCHEND;
            else if ( 'unique' === token.action[0] ) token.action[0] = A_UNIQUE;
            else if ( 'indent' === token.action[0] ) token.action[0] = A_INDENT;
            else if ( 'outdent' === token.action[0] ) token.action[0] = A_OUTDENT;
        }
        $token$ = new tokenizer( T_ACTION, tokenID, token.action.slice(), $msg$, $modifier$ );
        $token$.ci = !!token.caseInsensitive||token.ci;
        // pre-cache tokenizer to handle recursive calls to same tokenizer
        cachedTokens[ tokenID ] = $token$;
    }
    
    else
    {
        $tokens$ = make_array( $tokens$ );
        
        if ( T_SIMPLE & $type$ )
        {
            if ( token.autocomplete ) get_autocomplete( token, tokenID, keywords );
            
            // combine by default if possible using word-boundary delimiter
            combine = !token[HAS]('combine') ? "\\b" : token.combine;
            $token$ = new tokenizer( T_SIMPLE, tokenID,
                        get_compositematcher( tokenID, $tokens$.slice(), RegExpID, combine,
                        !!(token.caseInsensitive||token.ci), cachedRegexes, cachedMatchers ), 
                        $msg$, $modifier$
                    );
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = $token$;
        }
        
        else if ( T_BLOCK & $type$ )
        {
            if ( T_COMMENT === $type$ ) get_comments( token, comments );

            $token$ = new tokenizer( $type$, tokenID,
                        get_blockmatcher( tokenID, $tokens$.slice(), RegExpID, cachedRegexes, cachedMatchers ), 
                        $msg$
                    );
            $token$.mline = token[HAS]('multiline')?!!token.multiline:true;
            $token$.esc = token[HAS]('escape') ? token.escape : false;
            // allow block delims / block interior to have different styles
            $token$.inter = !!Style[ tokenID + '.inside' ];
            if ( (T_COMMENT === $type$) && token.interleave ) interleavedTokens.push( t_clone( $token$ ) );
            if ( $modifier$ ) $token$.modifier = $modifier$;
            // pre-cache tokenizer to handle recursive calls to same tokenizer
            cachedTokens[ tokenID ] = $token$;
        }
        
        else if ( T_COMPOSITE & $type$ )
        {
            if ( T_NGRAM === $type$ )
            {
                // get n-gram tokenizer
                tt = make_array_2( $tokens$ ); // array of arrays
                
                $token$ = map( tt, function( _, i ) {
                    // get tokenizer for whole ngram
                    return new tokenizer( T_NGRAM, tokenID+'_NGRAM_'+i, null, $msg$, $modifier$ );
                } );
                
                // pre-cache tokenizer to handle recursive calls to same tokenizer
                cachedTokens[ tokenID ] = $token$;
                
                iterate( function( i ) {
                    // get tokenizer for whole ngram
                    $token$[i].token = make_array( operate( tt[i], function( subTokenizers, t ){
                        return subTokenizers.concat( get_tokenizer( t, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, interleavedTokens,  comments, keywords ) );
                    }, [] ) );
                }, 0, tt.length-1 );
            }
            
            else
            {
                if ( (T_REPEATED & $type$) && (T_ARRAY & get_type( token.repeat )) )
                {
                    $token$ = new tokenizer( T_REPEATED, tokenID, null, $msg$, $modifier$ );
                    $token$.min = token.repeat[0]; $token$.max = token.repeat[1];
                }
                else if ( T_ZEROORONE === $type$ )
                {
                    $token$ = new tokenizer( T_ZEROORONE, tokenID, null, $msg$, $modifier$ );
                    $token$.min = 0; $token$.max = 1;
                }
                
                else if ( T_ZEROORMORE === $type$ )
                {
                    $token$ = new tokenizer( T_ZEROORMORE, tokenID, null, $msg$, $modifier$ );
                    $token$.min = 0; $token$.max = INF;
                }
                
                else if ( T_ONEORMORE === $type$ )
                {
                    $token$ = new tokenizer( T_ONEORMORE, tokenID, null, $msg$, $modifier$ );
                    $token$.min = 1; $token$.max = INF;
                }
                
                else if ( T_ALTERNATION === $type$ )
                {
                    $token$ = new tokenizer( T_ALTERNATION, tokenID, null, $msg$, $modifier$ );
                }
                
                else //if ( T_SEQUENCE === $type$ )
                {
                    $token$ = new tokenizer( T_SEQUENCE, tokenID, null, $msg$, $modifier$ );
                }
                
                // pre-cache tokenizer to handle recursive calls to same tokenizer
                cachedTokens[ tokenID ] = $token$;
                
                $token$.token = make_array( operate( $tokens$, function( subTokenizers, t ){
                    return subTokenizers.concat( get_tokenizer( t, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, interleavedTokens, comments, keywords ) );
                }, [] ) );
            }
        }
    }
    return cachedTokens[ tokenID ];
}

function parse_grammar( grammar ) 
{
    var RegExpID, tokens,
        Extra, Style, Lex, Syntax, 
        cachedRegexes, cachedMatchers, cachedTokens, 
        interleavedTokens, comments, keywords;
    
    // grammar is parsed, return it, avoid reparsing already parsed grammars
    if ( grammar.__parsed ) return grammar;
    
    //grammar = clone( grammar );
    RegExpID = grammar.RegExpID || null;
    Extra = grammar.Extra ? clone(grammar.Extra) : { };
    Style = grammar.Style ? clone(grammar.Style) : { };
    Lex = grammar.Lex ? clone(grammar.Lex) : { };
    Syntax = grammar.Syntax ? clone(grammar.Syntax) : { };
    
    cachedRegexes = { }; cachedMatchers = { }; cachedTokens = { }; 
    comments = { }; keywords = { }; interleavedTokens = [ ];
    
    tokens = grammar.Parser ? clone(grammar.Parser) : [ ];
    
    grammar = preprocess_grammar({
        Style           : Style,
        Lex             : Lex,
        Syntax          : Syntax,
        $parser         : null,
        $interleaved    : null,
        $comments       : null,
        $autocomplete   : null,
        $extra          : Extra,
        __parsed        : 0
    });
    
    grammar.$parser = operate( tokens, function( tokens, tokenID ) {
        var token = get_tokenizer( tokenID, RegExpID, Lex, Syntax, Style, cachedRegexes, cachedMatchers, cachedTokens, interleavedTokens, comments, keywords ) || null;
        if ( token )
        {
            if ( T_ARRAY & get_type( token ) ) tokens = tokens.concat( token );
            else tokens.push( token );
        }
        return tokens;
    }, [] );
    grammar.$interleaved = interleavedTokens&&interleavedTokens.length ? interleavedTokens : null;
    grammar.$comments = comments;
    grammar.$autocomplete = keywords&&keywords.autocomplete&&keywords.autocomplete.length ? keywords.autocomplete : null;
    // this grammar is parsed
    grammar.__parsed = 1;
    return grammar;
}

