
//
// tokenizers
// change to functional-oriented instead of object-oriented approach to tokenizers and parsing

function matcher( type, name, pattern, ptype, key )
{
    var self = this, PT, T;
    PT = self.type = type;
    self.name = name;
    self.pattern = pattern;
    T = self.ptype = ptype || T_STR;
    self.key = key || 0;
    if ( P_COMPOSITE === PT )
    {
        self.key = false !== key;
    }
    else if ( P_BLOCK === PT )
    {
        self.pattern[0] = new matcher( P_COMPOSITE, name + '_Start', pattern[0], null, false );
    }
    else //if ( P_SIMPLE === PT )
    {
        if ( T_NULL === T )
            self.pattern = null;
        else if ( T_REGEX === T )
            self.pattern = T_REGEX&get_type(pattern) ? [pattern, 0] : [pattern[0], pattern[1]||0];
    }
}

/*function m_dispose( t )
{
    t.type = null;
    t.name = null;
    t.pattern = null;
    t.ptype = null;
    t.key = null;
}*/

function t_match( t, stream, eat )
{
    var self = t, PT = self.type, name, type,
        pattern = self.pattern, key = self.key,
        start, ends, end, match, m, T, T0, i, n, c
    ;
    
    if ( P_BLOCK === PT )
    {
        name = self.name;
        start = pattern[0]; ends = pattern[1];
        
        // matches start of block using startMatcher
        // and returns the associated endBlock matcher
        if ( match = t_match( start, stream, eat ) )
        {
            // use the token key to get the associated endMatcher
            end = ends[ match[0] ];
            T = get_type( end ); T0 = start.pattern[ match[0] ].ptype;
            
            // regex group number given, get the matched group pattern for the ending of this block
            // string replacement pattern given, get the proper pattern for the ending of this block
            if ( T_REGEX === T0 && (T_STR_OR_NUM & T) )
            {
                // the regex is wrapped in an additional group, 
                // add 1 to the requested regex group transparently
                m = T_NUM & T ? match[1][ end+1 ] : group_replace( end, match[1] );
                end = new matcher( P_SIMPLE, name+'_End', m, m.length>1 ? T_STR : T_CHAR );
            }
            return end;
        }
    }
    else if ( P_COMPOSITE === PT )
    {
        for (i=0,n=pattern.length; i<n; i++)
        {
            // each one is a matcher in its own
            m = t_match( pattern[ i ], stream, eat );
            if ( m ) return key ? [ i, m[1] ] : m;
        }
    }
    else //if ( P_SIMPLE === PT )
    {
        type = self.ptype;
        if ( T_NULL === type /*|| null === pattern*/ )
        {
            // up to end-of-line
            if ( false !== eat ) stream.end( ); // skipToEnd
            return [ key, "" ];
        }
        else if ( T_REGEX === type )
        {
            m = stream.s.slice( stream.pos ).match( pattern[0] );
            if ( m && 0 === m.index )
            {
                if ( false !== eat ) stream.mov( m[ pattern[1]||0 ].length );
                return [ key, pattern[1] > 0 ? m[pattern[1]] : m ];
            }
        }
        else if ( T_CHARLIST === type )
        {
            m = stream.s[CHAR](stream.pos) || null;
            if ( m && (-1 < pattern.indexOf( m )) ) 
            {
                if ( false !== eat ) stream.mov( 1 );
                return [ key, m ];
            }
        }
        else if ( T_CHAR === type )
        {
            m = stream.s[CHAR](stream.pos) || null;
            if ( pattern === m ) 
            {
                if ( false !== eat ) stream.mov( 1 );
                return [ key, m ];
            }
        }
        else if ( T_STR === type ) // ?? some pattern is undefined !!!!!!!!!
        {
            n = pattern.length;
            if ( pattern === stream.s.substr(stream.pos, n) ) 
            {
                if ( false !== eat ) stream.mov( n );
                return [ key, pattern ];
            }
        }
    }
    return false;
}

function tokenizer( type, name, token, msg, modifier )
{
    var self = this;
    self.type = type;
    self.name = name;
    self.token = token;
    self.modifier = modifier || null;
    self.pos = null;
    self.msg = msg || null;
    self.$msg = null;
    self.status = 0;
    self.ci = false; self.mline = true; self.esc = false; self.inter = false;
    self.found = 0; self.min = 0; self.max = 1;
    self.$id = null;
}

function t_clone( t, required, modifier )
{
    var tt = new tokenizer( t.type, t.name, t.token, t.msg, t.modifier );
    tt.ci = t.ci; tt.mline = t.mline; tt.esc = t.esc; tt.inter = t.inter;
    tt.found = t.found; tt.min = t.min; tt.max = t.max;
    if ( required ) tt.status |= REQUIRED;
    if ( modifier ) tt.modifier = modifier;
    return tt;
}

/*function t_dispose( t )
{
    t.type = null;
    t.name = null;
    t.token = null;
    t.modifier = null;
    t.pos = null;
    t.msg = null; t.$msg = null;
    t.status = null;
    t.ci = null; t.mline = null; t.esc = null; t.inter = null;
    t.found = null; t.min = null; t.max = null;
    t.$id = null;
}*/

function t_err( t )
{
    var T = t.name;
    return t.$msg
        ? t.$msg
        : (
            t.status & REQUIRED
            ? 'Token "'+T+'" Expected'
            : 'Syntax Error: "'+T+'"'
        );
}

function error_( state, l1, c1, l2, c2, t, err )
{
    //if ( state.err )
    state.err[ l1+'_'+c1+'_'+l2+'_'+c2+'_'+t.name ] = [ l1, c1, l2, c2, err || t_err( t ) ];
    //return state;
}

function tokenize( t, stream, state, token )
{
    var T = t.type, 
        t_ = T_COMPOSITE & T
        ? t_composite
        : (
            T_BLOCK & T
            ? t_block
            : ( T_ACTION & T ? t_action : t_simple )
        );
    return t_( t, stream, state, token );
}

function t_action( a, stream, state, token )
{
    var self = a, action_def = self.token || null,
    action, case_insensitive = self.ci, aid = self.name,
    t, t0, ns, msg, queu, symb, scop, ctx,
    l1, c1, l2, c2, in_ctx, err, t_str, is_block,
    no_errors = !(state.status & ERRORS);

    self.status = 0; self.$msg = null;

    // do action only if state.status handles (action) errors, else dont clutter
    if ( no_errors || !action_def || !token || !token.pos ) return true;
    is_block = !!(T_BLOCK & token.T);
    // partial block not completed yet, postpone
    if ( is_block && !token.block ) return true;

    action = action_def[ 0 ]; t = action_def[ 1 ]; in_ctx = action_def[ 2 ];
    queu = state.queu; symb = state.symb; ctx = state.ctx;
    msg = self.msg;
    
    if ( is_block /*&& token.block*/ )
    {
        t_str = token.block.match || token.block.str;
        l1 = token.block.pos[0][0];                          c1 = token.block.pos[0][1];
        l2 = token.block.pos[token.block.pos.length-1][2];   c2 = token.block.pos[token.block.pos.length-1][3];
    }
    else
    {
        t_str = token.match || token.str;
        l1 = token.pos[0];                                   c1 = token.pos[1];
        l2 = token.pos[2];                                   c2 = token.pos[3];
    }

    if ( A_ERROR === action )
    {
        if ( !msg && (T_STR & get_type(t)) ) msg = t;
        self.$msg = msg ? group_replace( msg, t_str, true ) : 'Error "' + aid + '"';
        error_( state, l1, c1, l2, c2, self, t_err( self ) );
        self.status |= ERROR;
        return false;
    }

    else if ( A_INDENT === action )
    {
        // TODO
    }

    else if ( A_OUTDENT === action )
    {
        // TODO
    }

    else if ( A_CTXEND === action )
    {
        if ( ctx.length ) ctx.shift();
    }

    else if ( A_CTXSTART === action )
    {
        ctx.unshift({symb:{},scop:{},queu:[]});
    }

    else if ( A_UNIQUE === action )
    {
        if ( in_ctx )
        {
            if ( ctx.length ) symb = ctx[0].symb;
            else return true;
        }
        if ( token )
        {
            t0 = t[1]; ns = t[0];
            t0 = group_replace( t0, t_str, true );
            if ( case_insensitive ) t0 = t0[LOWER]();
            if ( !symb[HAS](ns) ) symb[ns] = { };
            if ( symb[ns][HAS](t0) )
            {
                // duplicate
                self.$msg = msg
                    ? group_replace( msg, t0, true )
                    : 'Duplicate "'+t0+'"';
                err = t_err( self );
                error_( state, symb[ns][t0][0], symb[ns][t0][1], symb[ns][t0][2], symb[ns][t0][3], self, err );
                error_( state, l1, c1, l2, c2, self, err );
                self.status |= ERROR;
                return false;
            }
            else
            {
                symb[ns][t0] = [l1, c1, l2, c2];
            }
        }
    }

    else if ( A_MCHEND === action )
    {
        if ( in_ctx )
        {
            if ( ctx.length ) queu = ctx[0].queu;
            else return true;
        }
        if ( t )
        {
            t = group_replace( t, t_str );
            if ( case_insensitive ) t = t[LOWER]();
            if ( !queu.length || t !== queu[0][0] ) 
            {
                // no match
                if ( queu.length )
                {
                    self.$msg = msg
                        ? group_replace( msg, [queu[0][0],t], true )
                        : 'Tokens do not match "'+queu[0][0]+'","'+t+'"';
                    err = t_err( self );
                    error_( state, queu[0][1], queu[0][2], queu[0][3], queu[0][4], self, err );
                    error_( state, l1, c1, l2, c2, self, err );
                    queu.shift( );
                }
                else
                {
                    self.$msg = msg
                        ? group_replace( msg, ['',t], true )
                        : 'Token does not match "'+t+'"';
                    err = t_err( self );
                    error_( state, l1, c1, l2, c2, self, err );
                }
                self.status |= ERROR;
                return false;
            }
            else
            {
                queu.shift( );
            }
        }
        else
        {
            // pop unconditionaly
            queu.shift( );
        }
    }

    else if ( (A_MCHSTART === action) && t )
    {
        if ( in_ctx )
        {
            if ( ctx.length ) queu = ctx[0].queu;
            else return true;
        }
        t = group_replace( t, t_str );
        if ( case_insensitive ) t = t[LOWER]();
        queu.unshift( [t, l1, c1, l2, c2] );
    }
    return true;
}

function t_simple( t, stream, state, token )
{
    var self = t, pattern = self.token, modifier = self.modifier,
        type = self.type, tokenID = self.name,
        line = state.line, pos = stream.pos, m = null, ret = false;
    
    self.status &= CLEAR_ERROR;
    self.$msg = self.msg || null;
    
    // match SOF (start-of-file, first line of source)
    if ( T_SOF === type ) { ret = 0 === line; }
    // match SOL (start-of-line)
    else if ( T_SOL === type ) { ret = stream.sol(); }
    // match EOL (end-of-line) ( with possible leading spaces )
    else if ( T_EOL === type ) 
    { 
        stream.spc();
        if ( stream.eol() ) ret = tokenID;
        else stream.bck( pos );
    }
    // match EMPTY token
    else if ( T_EMPTY === type ) { self.status = 0; ret = true; }
    // match non-space
    else if ( T_NONSPACE === type ) 
    { 
        if ( (self.status & REQUIRED) && stream.spc() && !stream.eol() )
        {
            stream.bck( pos );
            self.status |= ERROR;
        }
        else
        {
            ret = true;
        }
        self.status &= CLEAR_REQUIRED;
    }
    // match up to end-of-line
    else if ( T_NULL === pattern ) 
    { 
        stream.end( ); // skipToEnd
        ret = modifier || tokenID; 
    }
    // else match a simple token
    else if ( m = t_match( pattern, stream ) ) 
    { 
        m = m[ 1 ];
        ret = modifier || tokenID; 
    }
    if ( false !== ret )
    {
        token.T = type; token.id = tokenID; token.type = ret;
        token.str = stream.sel(pos, stream.pos); token.match = m;
        token.pos = [line, pos, line, stream.pos];
    }
    if ( !ret && self.status && self.$msg ) self.$msg = group_replace( self.$msg, tokenID, true );
    return ret;
}

function t_block( t, stream, state, token )
{
    var self = t, block = self.name, type = self.type, modifier = self.modifier,
        block_start = self.token, block_end,
        is_multiline = self.mline, has_interior = self.inter,
        block_interior = has_interior ? block+'.inside' : block,
        esc_char = self.esc, is_escaped = !!esc_char, is_eol,
        already_inside, found, ended, continued, continue_to_next_line,
        block_start_pos, block_end_pos, block_inside_pos,
        b_start = '', b_inside = '', b_inside_rest = '', b_end = '',
        char_escaped, next, ret, is_required, $id = self.$id || block,
        stack = state.stack, stream_pos, stream_pos0, stack_pos, line, pos
    ;

    /*
        This tokenizer class handles many different block types ( BLOCK, COMMENT, ESC_BLOCK, SINGLE_LINE_BLOCK ),
        having different styles ( DIFFERENT BLOCK DELIMS/INTERIOR ) etc..
        So logic can become somewhat complex,
        descriptive names and logic used here for clarity as far as possible
    */

    self.status &= CLEAR_ERROR;
    self.$msg = self.msg || null;
    line = state.line; pos = stream.pos;
    // comments are not required tokens
    if ( T_COMMENT === type ) self.status &= CLEAR_REQUIRED;
    
    is_required = self.status & REQUIRED; already_inside = 0; found = 0;
    
    if ( state.block && state.block.name === block )
    {
        found = 1; already_inside = 1; ret = block_interior;
        block_end = state.block.end;
        block_start_pos = state.block.sp; block_inside_pos = state.block.ip;  block_end_pos = state.block.ep;
        b_start = state.block.s;  b_inside = state.block.i;
    }    
    else if ( !state.block && (block_end = t_match(block_start, stream)) )
    {
        found = 1; ret = block;
        stream_pos = stream.pos;
        block_start_pos = [line, pos];
        block_inside_pos = [[line, stream_pos], [line, stream_pos]]; block_end_pos = [line, stream_pos];
        b_start = stream.sel(pos, stream_pos);  b_inside = '';  b_end = '';
        state.block = {
            name: block,  end: block_end,
            sp: block_start_pos, ip: block_inside_pos, ep: block_end_pos,
            s: b_start, i: b_inside, e: b_end
        };
    }    

    if ( found )
    {
        stack_pos = stack.length;
        is_eol = T_NULL === block_end.type;
        
        if ( has_interior )
        {
            if ( is_eol && already_inside && stream.sol() )
            {
                // eol block continued to start of next line, abort
                self.status &= CLEAR_REQUIRED;
                state.block = null;
                return false;
            }
            
            if ( !already_inside )
            {
                stream_pos = stream.pos;
                token.T = type; token.id = block; token.type = modifier || ret;
                token.str = stream.sel(pos, stream_pos); token.match = null;
                token.pos = [line, pos, line, stream_pos];
                push_at( stack, stack_pos, t_clone( self, is_required ), '$id', $id );
                return modifier || ret;
            }
        }
        
        ended = t_match( block_end, stream );
        continue_to_next_line = is_multiline;
        continued = 0;
        
        if ( !ended )
        {
            stream_pos0 = stream.pos;
            char_escaped = false;
            while ( !stream.eol( ) ) 
            {
                stream_pos = stream.pos;
                if ( !char_escaped && t_match(block_end, stream) ) 
                {
                    if ( has_interior )
                    {
                        if ( stream.pos > stream_pos && stream_pos > stream_pos0 )
                        {
                            ret = block_interior;
                            stream.bck( stream_pos );
                            continued = 1;
                        }
                        else
                        {
                            ret = block;
                            ended = 1;
                        }
                    }
                    else
                    {
                        ret = block;
                        ended = 1;
                    }
                    b_end = stream.cur().slice(b_inside_rest.length);
                    break;
                }
                else
                {
                    next = stream.nxt( 1 );
                    b_inside_rest += next;
                }
                char_escaped = is_escaped && !char_escaped && esc_char === next;
            }
        }
        else
        {
            ret = is_eol ? block_interior : block;
            b_end = stream.cur().slice(b_inside_rest.length);
        }
        continue_to_next_line = is_multiline || (is_escaped && char_escaped);
        
        b_inside += b_inside_rest;
        block_inside_pos[ 1 ] = [line, stream_pos]; block_end_pos = [line, stream.pos];
        
        if ( ended || (!continue_to_next_line && !continued) )
        {
            state.block = null;
        }
        else
        {
            state.block.ip = block_inside_pos;  state.block.ep = block_end_pos;
            state.block.i = b_inside; state.block.e = b_end;
            push_at( stack, stack_pos, t_clone( self, is_required ), '$id', $id );
        }
        token.T = type; token.id = block; token.type = modifier || ret;
        token.str = stream.sel(pos, stream.pos); token.match = null;
        token.pos = [line, pos, block_end_pos[0], block_end_pos[1]];
        
        if ( !state.block )
        {
            // block is now completed
            token.block = {
            str: b_start + b_inside + b_end,
            match: [
                b_start + b_inside + b_end,
                b_inside, b_start, b_end
            ],
            part: [ b_start, b_inside, b_end ],
            pos: [
                [block_start_pos[0], block_start_pos[1], block_inside_pos[0][0], block_inside_pos[0][1]],
                [block_inside_pos[0][0], block_inside_pos[0][1], block_inside_pos[1][0], block_inside_pos[1][1]],
                [block_inside_pos[1][0], block_inside_pos[1][1], block_end_pos[0], block_end_pos[1]]
            ]
            };
        }
        return modifier || ret;
    }
    if ( self.status && self.$msg ) self.$msg = group_replace( self.$msg, block, true );
    return false;
}

function t_composite( t, stream, state, token )
{
    var self = t, type = self.type, name = self.name, tokens = self.token, n = tokens.length,
        tokenizer, style, modifier = self.modifier, found, min, max,
        tokens_required, tokens_err, stream_pos, stack_pos,
        i, tt, stack, err, $id, match_all;

    self.status &= CLEAR_ERROR;
    self.$msg = self.msg || null;

    stack = state.stack;
    stream_pos = stream.pos; stack_pos = stack.length;

    tokens_required = 0; tokens_err = 0;

    if ( T_ALTERNATION === type )
    {
        self.status |= REQUIRED;
        err = [];
        
        for (i=0; i<n; i++)
        {
            tokenizer = t_clone( tokens[ i ], 1, modifier );
            style = tokenize( tokenizer, stream, state, token );
            
            if ( tokenizer.status & REQUIRED )
            {
                tokens_required++;
                err.push( t_err( tokenizer ) );
            }
            
            if ( false !== style )
            {
                return style;
            }
            else if ( tokenizer.status & ERROR )
            {
                tokens_err++;
                stream.bck( stream_pos );
            }
        }
        
        if ( tokens_required > 0 ) self.status |= REQUIRED;
        else self.status &= CLEAR_REQUIRED;
        if ( (n === tokens_err) && (tokens_required > 0) ) self.status |= ERROR;
        else self.status &= CLEAR_ERROR;
        if ( self.status && !self.$msg && err.length ) self.$msg = err.join(' | ');
        return false;
    }

    else if ( T_SEQUENCE_OR_NGRAM & type )
    {
        match_all = !!(type & T_SEQUENCE);
        if ( match_all ) self.status |= REQUIRED;
        else self.status &= CLEAR_REQUIRED;
        $id = /*self.$id ||*/ name+'_'+get_id();
        tokenizer = t_clone( tokens[ 0 ], match_all, modifier );
        style = tokenize( tokenizer, stream, state, token );
        
        if ( false !== style )
        {
            // not empty token
            if ( true !== style || T_EMPTY !== tokenizer.type )
            {
                for (i=n-1; i>0; i--)
                {
                    tt = t_clone( tokens[ i ], 1, modifier );
                    push_at( stack, stack_pos+n-i-1, tt, '$id', $id );
                }
            }
                
            return style;
        }
        else if ( tokenizer.status & ERROR /*&& tokenizer.REQ*/ )
        {
            if ( match_all ) self.status |= ERROR;
            else self.status &= CLEAR_ERROR;
            stream.bck( stream_pos );
        }
        else if ( match_all && (tokenizer.status & REQUIRED) )
        {
            self.status |= ERROR;
        }
        
        if ( self.status && !self.$msg ) self.$msg = t_err( tokenizer );
        return false;
    }

    else //if ( T_REPEATED & type )
    {
        found = self.found; min = self.min; max = self.max;
        self.status &= CLEAR_REQUIRED;
        $id = /*self.$id ||*/ name+'_'+get_id();
        err = [];
        
        for (i=0; i<n; i++)
        {
            tokenizer = t_clone( tokens[ i ], 1, modifier );
            style = tokenize( tokenizer, stream, state, token );
            
            if ( false !== style )
            {
                ++found;
                if ( found <= max )
                {
                    // push it to the stack for more
                    self.found = found;
                    push_at( stack, stack_pos, t_clone( self ), '$id', $id );
                    self.found = 0;
                    return style;
                }
                break;
            }
            else if ( tokenizer.status & REQUIRED )
            {
                tokens_required++;
                err.push( t_err( tokenizer ) );
            }
            if ( tokenizer.status & ERROR ) stream.bck( stream_pos );
        }
        
        if ( found < min ) self.status |= REQUIRED;
        else self.status &= CLEAR_REQUIRED;
        if ( (found > max) || (found < min && 0 < tokens_required) ) self.status |= ERROR;
        else self.status &= CLEAR_ERROR;
        if ( self.status && !self.$msg && err.length ) self.$msg = err.join(' | ');
        return false;
    }
}

