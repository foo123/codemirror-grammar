    
    //
    // ParserState Class
    var
        ParserState = Class({
            
            constructor: function( id ) {
                this.id = id || 0;
                this.stack = [];
                this.t = T_DEFAULT;
                this.inBlock = null;
                this.endBlock = null;
            },
            
            id: 0,
            stack: null,
            t: null,
            inBlock: null,
            endBlock: null,
            
            clone: function() {
                var copy = new this.$class( this.id );
                copy.t = this.t;
                copy.stack = this.stack.slice();
                copy.inBlock = this.inBlock;
                copy.endBlock = this.endBlock;
                return copy;
            },
            
            // used mostly for ACE which treats states as strings
            toString: function() {
                //return ['', this.id, this.inBlock||'0'].join('_');
                return ['', this.id, this.t, this.inBlock||'0'].join('_');
            }
        })
    ;
    