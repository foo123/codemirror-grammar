
//
// parser factory

var Parser = Class({
    constructor: function Parser( grammar, LOC ) {
        var self = this;
        self.$grammar = grammar;
        self.DEF = LOC.DEFAULT;
        self.ERR = grammar.Style.error || LOC.ERROR;
        self.TOK = LOC.TOKEN || 'token';
        self.TYP = LOC.TYPE || 'type';
    }
    
    ,$grammar: null
    ,DEF: null
    ,ERR: null
    ,TOK: null
    ,TYP: null
    
    ,dispose: function( ) {
        var self = this;
        self.$grammar = null;
        self.DEF = null;
        self.ERR = null;
        self.TOK = null;
        self.TYP = null;
        return self;
    }
    
    ,state: function( unique, s ) { 
        var state;
        if ( arguments.length > 1 && s instanceof State )
        {
            // copy state
            state = new State( unique, s );
            state.$eol$ = s.$eol$;
        }
        else
        {
            // start state
            state = new State( unique, s );
            state.$eol$ = true;
        }
        return state;
    }
    
    ,token: function( stream, state ) {
        var self = this, grammar = self.$grammar, Style = grammar.Style, DEFAULT = self.DEF, ERR = self.ERR,
            T = { }, $token$ = self.TOK, $type$ = self.TYP, $name$ = 'name',
            interleaved_tokens = grammar.$interleaved, tokens = grammar.$parser, nTokens = tokens.length, 
            tokenizer, action, type, stack, line, pos, i, ci, ret
        ;
        
        T[$name$] = null; T[$type$] = null; T[$token$] = null; ret = false;
        
        if ( state.$eol$ && stream.sol() )
        {
            // state marks a new line
            state.$eol$ = false;
            state.line++;
        }
        state.$actionerr$ = false;
        stack = state.stack;
        line = state.line;
        
        // if EOL tokenizer is left on stack, pop it now
        if ( stack.length && stream.sol() && T_EOL === peek(stack).type ) stack.pop();
        
        // check for non-space tokenizer before parsing space
        if ( (!stack.length || (T_NONSPACE !== peek(stack).type)) && stream.spc() )
        {
            T[$type$] = DEFAULT;
            ret = true;
        }
        
        i = 0;
        while ( !ret && (stack.length || i<nTokens) && !stream.eol() )
        {
            if ( interleaved_tokens )
            {
                for (ci=0; ci<interleaved_tokens.length; ci++)
                {
                    tokenizer = interleaved_tokens[ci];
                    type = tokenizer.get( stream, state );
                    if ( false !== type )
                    {
                        T[$name$] = tokenizer.name;
                        T[$type$] = Style[type] || DEFAULT;
                        ret = true; break;
                    }
                }
                
                if ( ret ) break;
            }
            
            pos = stream.pos;
            tokenizer = stack.length ? stack.pop() : tokens[i++];
            type = tokenizer.get(stream, state);
            
            // match failed
            if ( false === type )
            {
                // error
                if ( tokenizer.status & REQUIRED_OR_ERROR )
                {
                    // empty the stack
                    empty(stack, '$id', tokenizer.$id);
                    // skip this character/token
                    stream.nxt( true );
                    // generate error
                    //type = ERR;
                    tokenizer.err( state, line, pos, line, stream.pos );
                    //T[$name$] = tokenizer.name;
                    T[$type$] = ERR;
                    ret = true; break;
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
                //state.$replace$ = type;
                // action token follows, execute action on current token
                while ( stack.length && T_ACTION === peek(stack).type )
                {
                    action = stack.pop();
                    action.get(stream, state);
                    // action error
                    if ( action.status & ERROR )
                    {
                        // empty the stack
                        //empty(stack, '$id', tokenizer.$id);
                        // generate error
                        //action.err( state, line, pos, line, stream.pos );
                        state.$actionerr$ = true;
                    }
                }
                // not empty
                if ( true !== type )
                {
                    T[$name$] = tokenizer.name;
                    T[$type$] = Style[type/*state.$replace$*/] || DEFAULT;
                    ret = true; break;
                }
            }
        }
        
        
        if ( !ret )
        {
            // unknown, bypass, next default token
            stream.nxt(true);
            T[$type$] = DEFAULT;
        }
        /*else if ( stack.length > 1 && stream.eol() &&  
            (T_BLOCK & stack[stack.length-1].type) && 
            state.block.name === stack[stack.length-1].name 
        )
        {
            // apply any needed action(s) on partial block
            ci = stack.length-2;
            while ( ci >= 0 && T_ACTION === stack[ci].type )
            {
                action = stack[ci--]; action.get(stream, state);
                if ( action.status & ERROR ) state.$actionerr$ = true;
            }
            T[$type$] = Style[state.$replace$] || DEFAULT;
        }*/
        
        T[$token$] = stream.cur(1); state.$eol$ = stream.eol();
        return T;
    }
    
    ,tokenize: function( line, state, row ) {
        var self = this, tokens = [], stream = new Stream( line );
        //state.line = row || 0;
        if ( stream.eol() ) state.line++;
        while ( !stream.eol() ) tokens.push( self.token( stream, state ) );
        stream.dispose();
        return tokens;
    }
    
    ,parse: function( code, parse_type ) {
        var self = this, lines = (code||"").split(newline_re), l = lines.length,
            linetokens = null, state, parse_errors, parse_tokens, ret;
        
        parse_type = parse_type || TOKENS;
        parse_errors = !!(parse_type & ERRORS);
        parse_tokens = !!(parse_type & TOKENS);
        state = self.state( 0, parse_type );
        state.$full_parse$ = true;
        
        if ( parse_tokens )
        {
            linetokens = [];
            iterate(parse_type & FLAT
            ? function( i ) {
                linetokens = linetokens.concat( self.tokenize( lines[i], state, i ) );
                if ( i+1<l ) linetokens.push("\r\n");
            }
            : function( i ) {
                linetokens.push( self.tokenize( lines[i], state, i ) );
            }, 0, l-1);
        }
        
        else iterate(function( i ) {
            var stream = new Stream(lines[i]);
            //state.line = i;
            if ( stream.eol() ) state.line++;
            while ( !stream.eol() ) self.token( stream, state );
            stream.dispose( );
        }, 0, l-1);
        
        ret = parse_tokens && parse_errors
            ? {tokens:linetokens, errors:state.err}
            : (parse_tokens ? linetokens : state.err);
        
        state.dispose();
        return ret;
    }
    
    ,indent: function( ) { }
});

