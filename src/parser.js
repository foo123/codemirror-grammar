
//
// parser factory
function State( unique, s )
{
    var self = this;
    // this enables unique state "names"
    // thus forces highlight to update
    // however updates also occur when no update necessary ??
    self.id = unique ? uuid("state") : "state";
    if ( s instanceof State )
    {
        // clone
        self.line = s.line;
        self.status = s.status;
        self.stack = s.stack.slice();
        self.block = s.block;
        // keep extra state only if error handling is enabled
        if ( self.status & ERRORS )
        {
            self.queu = s.queu;
            self.symb = s.symb;
            self.scop = s.scop;
            self.ctx = s.ctx;
            self.err = s.err;
        }
        // else dont use-up more space and clutter
        else
        {
            self.queu = null;
            self.symb = null;
            self.scop = null;
            self.ctx = null;
            self.err = null;
        }
        self.$eol$ = s.$eol$;
    }
    else
    {
        self.line = -1;
        self.status = s || 0;
        self.stack = [];
        self.block = null;
        // keep extra state only if error handling is enabled
        if ( self.status & ERRORS )
        {
            self.queu = [];
            self.symb = {};
            self.scop = {};
            self.ctx = [];
            self.err = {};
        }
        // else dont use-up more space and clutter
        else
        {
            self.queu = null;
            self.symb = null;
            self.scop = null;
            self.ctx = null;
            self.err = null;
        }
        self.$eol$ = true;
    }
    // make sure to generate a string which will cover most cases where state needs to be updated by the editor
    self.toString = function() {
        return self.id+'_'+self.line+'_'+(self.block?self.block.name:'0');
    };
}

function state_dispose( state )
{
    state.id = null;
    state.line = null;
    state.status = null;
    state.stack = null;
    state.block = null;
    state.queu = null;
    state.symb = null;
    state.scop = null;
    state.ctx = null;
    state.err = null;
}

// a wrapper to manipulate a string as a stream, based on Codemirror's StringStream
function Stream( line, start, pos )
{
    var self = new String( line );
    self.start = start || 0;
    self.pos = pos || 0;
    
    // string start-of-line?
    self.sol = function( ) { 
        return 0 === self.pos; 
    };
    
    // string end-of-line?
    self.eol = function( ) { 
        return self.pos >= self.length; 
    };
    
    // skip to end
    self.end = function( ) {
        self.pos = self.length;
        return self;
    };

    // move pointer forward/backward n steps
    self.mov = function( n ) {
        self.pos = 0 > n ? MAX(0, self.pos+n) : MIN(self.length, self.pos+n);
        return self;
    };
    
    // move pointer back to pos
    self.bck = function( pos ) {
        self.pos = MAX(0, pos);
        return self;
    };
    
    // move/shift stream
    self.sft = function( ) {
        self.start = self.pos;
        return self;
    };
    
    // next char(s) or whole token
    self.nxt = function( num, re_token ) {
        var c, token = '', n;
        if ( true === num )
        {
            re_token = re_token || Stream.$RE_NONSPC$;
            while ( self.pos<self.length && re_token.test(c=self[CHAR](self.pos++)) ) token += c;
            return token.length ? token : null;
        }
        else
        {
            num = num||1; n = 0;
            while ( n++ < num && self.pos<self.length ) token += self[CHAR](self.pos++);
            return token;
        }
    };
    
    // current stream selection
    self.cur = function( shift ) {
        var ret = self.slice(self.start, self.pos);
        if ( shift ) self.start = self.pos;
        return ret;
    };
    
    // stream selection
    self.sel = function( p0, p1 ) {
        return self.slice(p0, p1);
    };
    
    // eat "space"
    self.spc = function( eat, re_space ) {
        var m;
        if ( m = self.slice(self.pos).match( re_space||Stream.$RE_SPC$ ) ) 
        {
            if ( false !== eat ) self.mov( m[0].length );
            return m[0];
        }
    };
    return self;
}
Stream.$RE_SPC$ = /^[\s\u00a0]+/;
Stream.$RE_NONSPC$ = /[^\s\u00a0]/;


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
        self.$n$ = self.$t$ = self.$v$ = null;
        self.$DEF = self.$ERR = self.DEF = self.ERR = null;
        return self;
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
        
        
        // unknown, bypass, next default token/char
        if ( notfound )  stream.nxt( 1/*true*/ );
        
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
        if ( stream.eol() ) { state.line++; /*state.$eol$ = true;*/ }
        else while ( !stream.eol() ) tokens.push( self.token( stream, state ) );
        return tokens;
    }
    
    ,parse: function( code, parse_type ) {
        var self = this, lines = (code||"").split(newline_re), l = lines.length,
            linetokens = null, state, parse_errors, parse_tokens, ret;
        
        parse_type = parse_type || TOKENS;
        parse_errors = !!(parse_type & ERRORS);
        parse_tokens = !!(parse_type & TOKENS);
        state = new State( 0, parse_type );
        state.$full_parse$ = true;
        
        // add back the newlines removed from split-ting
        iterate(function( i ){ lines[i] += "\n"; }, 0, l-2);
        
        if ( parse_tokens ) 
            linetokens = iterate(parse_type & FLAT
            ? function( i, linetokens ) {
                linetokens._ = linetokens._.concat( self.tokenize( Stream( lines[i] ), state, i ) );
            }
            : function( i, linetokens ) {
                linetokens._.push( self.tokenize( Stream( lines[i] ), state, i ) );
            }, 0, l-1, {_:[]} )._;
        
        else 
            iterate(function( i ) {
                var stream = Stream( lines[i] );
                //state.line = i;
                if ( stream.eol() ) { state.line++; state.$eol$ = true; }
                else while ( !stream.eol() ) self.token( stream, state );
            }, 0, l-1);
        
        ret = parse_tokens && parse_errors
            ? {tokens:linetokens, errors:state.err}
            : (parse_tokens ? linetokens : state.err);
        
        state_dispose( state );
        return ret;
    }
    
    ,indent: function( ) { }
});

