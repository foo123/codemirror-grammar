    
    //
    // Stack Class
    var
        Stack = Class({
            
            constructor: function( array ) {
                this._ = array || [];
            },
            
            // abbreviations used for optimal minification
            _: null,
            
            toString: function( ) { 
                var a = this._.slice(); 
                return a.reverse().join("\n"); 
            },
            
            clone: function( ) {
                return new this.$class( this._.slice() );
            },
            
            isEmpty: function( ) {
                return 0 >= this._.length;
            },
            
            pos: function( ) {
                return this._.length;
            },
            
            peek: function( index ) {
                var stack = this._;
                index = ('undefined' == typeof(index)) ? -1 : index;
                if ( stack.length )
                {
                    if ( (0 > index) && (0 <= stack.length+index) )
                        return stack[ stack.length + index ];
                    else if ( 0 <= index && index < stack.length )
                        return stack[ index ];
                }
                return null;
            },
            
            pop: function( ) {
                return this._.pop();
            },
            
            shift: function( ) {
                return this._.shift();
            },
            
            push: function( i ) {
                this._.push(i);
                return this;
            },
            
            unshift: function( i ) {
                this._.unshift(i);
                return this;
            },
            
            pushAt: function( pos, token, idProp, id ) {
                var stack = this._;
                if ( idProp && id ) token[idProp] = id;
                if ( pos < stack.length ) stack.splice( pos, 0, token );
                else stack.push( token );
                return this;
            },
            
            empty: function(idProp, id) {
                var stack = this._, l = stack.length;
                if ( idProp && id )
                {
                    //while (l && stack[l-1] && stack[l-1][idProp] == id) 
                    while (stack.length && stack[stack.length-1] && stack[stack.length-1][idProp] == id) 
                    {
                        //console.log([id, stack[l-1][idProp]]);
                        //--l;
                        stack.pop();
                    }
                    //stack.length = l;
                }
                else stack.length = 0;
                return this;
            }
        })
    ;
    