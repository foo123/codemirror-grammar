    
    //
    // ParserState Class
    var
        ParserState = Class({
            
            constructor: function( id ) {
                this.id = id || 0;
                this.stack = [];
                this.inBlock = null;
                this.endBlock = null;
                this.currentToken = T_DEFAULT;
            },
            
            id: 0,
            stack: null,
            inBlock: null,
            endBlock: null,
            currentToken: null,
            
            clone: function() {
                var copy = new this.$class();
                copy.id = this.id;
                copy.stack = this.stack.slice();
                copy.inBlock = this.inBlock;
                copy.endBlock = this.endBlock;
                copy.currentToken = this.currentToken;
                return copy;
            },
            
            toString: function() {
                return "_" + this.id + "_" + (this.inBlock);
            }
        })
    ;
    