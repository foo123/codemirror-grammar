
//
// State Class
var State = Class({
    constructor: function State( unique, s ) {
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
        }
    }
    
    ,id: null
    ,line: 0
    ,status: 0
    ,block: null
    ,stack: null
    ,queu: null
    ,symb: null
    ,scop: null
    ,ctx: null
    ,err: null
    
    ,dispose: function( ) {
        var self = this;
        self.id = null;
        self.line = null;
        self.status = null;
        self.stack = null;
        self.block = null;
        self.queu = null;
        self.symb = null;
        self.scop = null;
        self.ctx = null;
        self.err = null;
        return self;
    }
    
    // make sure to generate a string which will cover most cases where state needs to be updated by the editor
    ,toString: function() {
        var self = this;
        return self.id+'_'+self.line+'_'+(self.block?self.block.name:'0');
    }
});
