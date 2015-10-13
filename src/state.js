
//
// State Class
var State = Class({
    constructor: function State( s, unique, status ) {
        var self = this;
        // this enables unique state "names"
        // thus forces highlight to update
        // however updates also occur when no update necessary ??
        self.id = unique ? uuid("state") : "state";
        if ( s instanceof State )
        {
            // clone
            self.line = s.line;
            //self.indent = s.indent;
            self.status = s.status;
            self.token = s.token;
            self.block = s.block;
            self.stack = s.stack.clone();
            self.queu = s.queu.slice();
            self.symb = clone( s.symb, 1 );
            self.ctx = s.ctx.slice();
            self.err = s.err;
        }
        else
        {
            self.line = s || 0;
            //self.indent = null;
            self.status = status || 0;
            self.token = null;
            self.block = null;
            self.stack = new Stack();
            self.queu = [];
            self.symb = {};
            self.ctx = [];
            self.err = self.status&ERRORS ? {} : null;
        }
    }
    
    ,id: null
    ,line: 0
    //,indent: 0
    ,status: 0
    ,token: null
    ,block: null
    ,stack: null
    ,queu: null
    ,symb: null
    ,ctx: null
    ,err: null
    
    ,dispose: function( ) {
        var self = this;
        self.id = null;
        self.line = null;
        //self.indent = null;
        self.status = null;
        self.token = null;
        self.block = null;
        if ( self.stack ) self.stack.dispose( );
        self.stack = null;
        self.queu = null;
        self.symb = null;
        self.ctx = null;
        self.err = null;
        return self;
    }
    
    ,clone: function( unique ) {
        return new State( this, unique );
    }
    
    // used mostly for ACE which treats states as strings, 
    // make sure to generate a string which will cover most cases where state needs to be updated by the editor
    ,toString: function() {
        var self = this;
        return [self.id, self.line, self.token ? self.token.name : '0', self.block ? self.block.name : '0'].join('_');
    }
});
