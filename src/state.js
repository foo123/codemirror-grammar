
//
// State Class
var State = Class({
    constructor: function State( line, unique ) {
        var self = this;
        // this enables unique state "names"
        // thus forces highlight to update
        // however updates also occur when no update necessary ??
        self.id = unique ? uuid("state") : "state";
        self.l = line || 0;
        self.stack = new Stack( );
        self.data = new Stack( );
        self.col = 0;
        self.indent = 0;
        self.t = null;
        self.inBlock = null;
        self.endBlock = null;
    }
    
    // state id
    ,id: null
    // state current line
    ,l: 0
    ,col: 0
    ,indent: 0
    // state token stack
    ,stack: null
    // state token push/pop match data
    ,data: null
    // state current token
    ,t: null
    // state current block name
    ,inBlock: null
    // state endBlock for current block
    ,endBlock: null
    
    ,dispose: function( ) {
        var self = this;
        if ( self.stack ) self.stack.dispose( );
        if ( self.data ) self.data.dispose( );
        self.stack = null;
        self.data = null;
        self.id = null;
        self.t = null;
        self.l = null;
        self.col = null;
        self.indent = null;
        self.inBlock = null;
        self.endBlock = null;
        return self;
    }
    
    ,clone: function( unique ) {
        var self = this, c = new State( self.l, unique );
        c.t = self.t;
        c.col = self.col;
        c.indent = self.indent;
        c.stack = self.stack.clone( );
        c.data = self.data.clone( );
        c.inBlock = self.inBlock;
        c.endBlock = self.endBlock;
        return c;
    }
    
    // used mostly for ACE which treats states as strings, 
    // make sure to generate a string which will cover most cases where state needs to be updated by the editor
    ,toString: function() {
        var self = this;
        //return ['', self.id, self.inBlock||'0'].join('_');
        //return ['', self.id, self.t, self.r||'0', self.stack.length, self.inBlock||'0'].join('_');
        //return ['', self.id, self.t, self.stack.length, self.inBlock||'0'].join('_');
        //return ['', self.id, self.t, self.r||'0', self.inBlock||'0'].join('_');
        //return ['', self.l, self.t, self.r, self.inBlock||'0', self.stack.length].join('_');
        return ['', self.id, self.l, self.t, self.inBlock||'0'].join('_');
    }
});
