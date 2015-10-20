
//
// parser factory
var Parser = Class({
    constructor: function Parser( grammar, DEFAULT, ERROR ) {
        var self = this;
        self.$grammar = grammar;
        self.$DEF = DEFAULT || null; self.$ERR = ERROR || null;
        self.DEF = self.$DEF; self.ERR = self.$ERR;
    }
    
    ,$grammar: null
    ,$n$: 'name', $t$: 'type', $v$: 'token'
    ,$DEF: null, $ERR: null
    ,DEF: null, ERR: null
    
    ,dispose: function( ) {
        var self = this;
        self.$grammar = null;
        self.$tok$ = self.$typ$ = self.$nam$ = null;
        self.$DEF = self.$ERR = self.DEF = self.ERR = null;
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
            T = { }, $name$ = self.$n$, $type$ = self.$t$, $value$ = self.$v$, //$pos$ = 'pos',
            interleaved_tokens = grammar.$interleaved, tokens = grammar.$parser, 
            nTokens = tokens.length, niTokens = interleaved_tokens ? interleaved_tokens.length : 0,
            tokenizer, action, token, type, err, stack, line, pos, i, ii, notfound
        ;
        
        // state marks a new line
        if ( state.$eol$ && stream.sol() ) { state.$eol$ = false; state.line++; }
        state.$actionerr$ = false;
        stack = state.stack; line = state.line; pos = stream.pos;
        notfound = true; err = false; type = false;
        
        // if EOL tokenizer is left on stack, pop it now
        if ( stack.length && T_EOL === stack[stack.length-1].type && stream.sol() ) stack.pop();
        
        // check for non-space tokenizer before parsing space
        if ( (!stack.length || (T_NONSPACE !== stack[stack.length-1].type)) && stream.spc() ) notfound = false;
        
        T[$name$] = null; T[$type$] = DEFAULT; T[$value$] = null;
        if ( notfound )
        {
            token = {
                T:0, id:null, type:null,
                match:null, str:'', pos:null
            };
            
            i = 0;
            while ( notfound && (stack.length || i<nTokens) && !stream.eol() )
            {
                if ( niTokens )
                {
                    for (ii=0; ii<niTokens; ii++)
                    {
                        tokenizer = interleaved_tokens[ii];
                        type = tokenize( tokenizer, stream, state, token );
                        if ( false !== type ) { notfound = false; break; }
                    }
                    if ( !notfound ) break;
                }
                
                tokenizer = stack.length ? stack.pop() : tokens[i++];
                type = tokenize( tokenizer, stream, state, token );
                
                // match failed
                if ( false === type )
                {
                    // error
                    if ( tokenizer.status & REQUIRED_OR_ERROR )
                    {
                        // empty the stack of the syntax rule group of this tokenizer
                        empty( stack, '$id', tokenizer.$id );
                        // skip this
                        stream.nxt( true ) || stream.spc( );
                        // generate error
                        err = true; notfound = false; break;
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
                    // action token(s) follow, execute action(s) on current token
                    if ( stack.length && T_ACTION === stack[stack.length-1].type )
                    {
                        while ( stack.length && T_ACTION === stack[stack.length-1].type )
                        {
                            action = stack.pop(); t_action( action, stream, state, token );
                            // action error
                            if ( action.status & ERROR ) state.$actionerr$ = true;
                        }
                    }
                    // partial block, apply any action(s) following it
                    else if ( stack.length > 1 && stream.eol() &&  
                        (T_BLOCK & stack[stack.length-1].type) && state.block &&
                        state.block.name === stack[stack.length-1].name 
                    )
                    {
                        ii = stack.length-2;
                        while ( ii >= 0 && T_ACTION === stack[ii].type )
                        {
                            action = stack[ii--]; t_action( action, stream, state, token );
                            // action error
                            if ( action.status & ERROR ) state.$actionerr$ = true;
                        }
                    }
                    // not empty
                    if ( true !== type ) { notfound = false; break; }
                }
            }
        }
        
        
        // unknown, bypass, next default token
        if ( notfound )  stream.nxt( true );
        
        T[$value$] = stream.cur( 1 );
        if ( false !== type )
        {
            type = Style[type] || DEFAULT;
            T[$name$] = tokenizer.name;
        }
        else if ( err )
        {
            type = ERR;
            if ( state.status & ERRORS )
                error_( state, line, pos, line, stream.pos, tokenizer );
        }
        else
        {
            type = DEFAULT;
        }
        T[$type$] = type;
        state.$eol$ = stream.eol();
        
        return T;
    }
    
    ,tokenize: function( stream, state, row ) {
        var self = this, tokens = [];
        //state.line = row || 0;
        if ( stream.eol() ) state.line++;
        else while ( !stream.eol() ) tokens.push( self.token( stream, state ) );
        return tokens;
    }
    
    ,parse: function( code, parse_type ) {
        var self = this, lines = (code||"").split(newline_re), l = lines.length,
            linetokens = null, state, stream, parse_errors, parse_tokens, ret;
        
        parse_type = parse_type || TOKENS;
        parse_errors = !!(parse_type & ERRORS);
        parse_tokens = !!(parse_type & TOKENS);
        state = self.state( 0, parse_type );
        state.$full_parse$ = true;
        stream = new Stream( );
        
        // add back the newlines removed from split-ting
        iterate(function( i ){ lines[i] += "\n"; }, 0, l-2);
        
        if ( parse_tokens ) 
            linetokens = iterate(parse_type & FLAT
            ? function( i, linetokens ) {
                linetokens._ = linetokens._.concat( self.tokenize( stream.new_( lines[i] ), state, i ) );
            }
            : function( i, linetokens ) {
                linetokens._.push( self.tokenize( stream.new_( lines[i] ), state, i ) );
            }, 0, l-1, {_:[]} )._;
        
        else 
            iterate(function( i ) {
                stream.new_( lines[i] );
                //state.line = i;
                if ( stream.eol() ) state.line++;
                else while ( !stream.eol() ) self.token( stream, state );
            }, 0, l-1);
        
        ret = parse_tokens && parse_errors
            ? {tokens:linetokens, errors:state.err}
            : (parse_tokens ? linetokens : state.err);
        
        stream.dispose(); state.dispose();
        return ret;
    }
    
    ,indent: function( ) { }
});

