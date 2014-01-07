    
    //
    // ParserState Class
    var
        ParserState = Class({
            
            constructor: function( line ) {
                //this.id = 0; //new Date().getTime();
                this.l = line || 0;
                this.stack = [];
                this.t = T_DEFAULT;
                this.r = '0';
                this.inBlock = null;
                this.endBlock = null;
            },
            
            // state id
            //id: 0,
            // state current line
            l: 0,
            // state token stack
            stack: null,
            // state current token id
            t: null,
            // state current token type
            r: null,
            // state current block name
            inBlock: null,
            // state endBlock for current block
            endBlock: null,
            
            clone: function() {
                var copy = new this.$class( this.l );
                copy.t = this.t;
                copy.r = this.r;
                copy.stack = this.stack.slice();
                copy.inBlock = this.inBlock;
                copy.endBlock = this.endBlock;
                return copy;
            },
            
            // used mostly for ACE which treats states as strings, 
            // make sure to generate a string which will cover most cases where state needs to be updated by the editor
            toString: function() {
                //return ['', this.id, this.inBlock||'0'].join('_');
                //return ['', this.id, this.t, this.r||'0', this.stack.length, this.inBlock||'0'].join('_');
                //return ['', this.id, this.t, this.stack.length, this.inBlock||'0'].join('_');
                //return ['', this.id, this.t, this.r||'0', this.inBlock||'0'].join('_');
                return ['', this.l, this.t, this.r, this.inBlock||'0'].join('_');
            }
        })
    ;
    