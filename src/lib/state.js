    
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
                var copy = new this.$class();
                copy.id = this.id;
                copy.stack = this.stack.slice();
                copy.inBlock = this.inBlock;
                copy.endBlock = this.endBlock;
                copy.t = this.t;
                return copy;
            },
            
            // used mostly for ACE which treats states as strings
            toString: function() {
                //return "_" + this.id + "_" + (this.inBlock);
                return "_" + this.id + "_" + (this.t) + "_" + (this.inBlock);
            }
        })
    ;
    