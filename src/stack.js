
//
// Stack Class
function Stack( array ) 
{
    this._ = array || [];
}
Stack[PROTO] = {
     constructor: Stack
    
    // abbreviations used for optimal minification
    ,_: null
    
    ,dispose: function( ) {
        var self = this;
        self._ = null;
        return self;
    }
    
    ,toString: function( ) { 
        return this._.slice( ).reverse( ).join( "\n" ); 
    }
    
    ,clone: function( ) {
        return new Stack( this._.slice( ) );
    }
    
    ,isEmpty: function( ) {
        return 0 >= this._.length;
    }
    
    ,pos: function( ) {
        return this._.length;
    }
    
    ,peek: function( index ) {
        var self = this, stack = self._;
        index = !arguments.length ? -1 : index;
        if ( stack.length )
        {
            if ( (0 > index) && (0 <= stack.length+index) )
                return stack[ stack.length + index ];
            else if ( 0 <= index && index < stack.length )
                return stack[ index ];
        }
        return null;
    }
    
    ,pop: function( ) {
        return this._.pop( );
    }
    
    ,shift: function( ) {
        return this._.shift( );
    }
    
    ,push: function( i ) {
        var self = this;
        self._.push( i );
        return self;
    }
    
    ,unshift: function( i ) {
        var self = this;
        self._.unshift( i );
        return self;
    }
    
    ,pushAt: function( pos, token, idProp, id ) {
        var self = this, stack = self._;
        if ( idProp && id ) token[idProp] = id;
        if ( pos < stack.length ) stack.splice( pos, 0, token );
        else stack.push( token );
        return self;
    }
    
    ,empty: function( idProp, id ) {
        var self = this, stack = self._, l = stack.length;
        if ( idProp && id )
        {
            //while (l && stack[l-1] && stack[l-1][idProp] == id) 
            while ( stack.length && stack[stack.length-1] && stack[stack.length-1][idProp] === id ) 
            {
                //console.log([id, stack[l-1][idProp]]);
                //--l;
                stack.pop();
            }
            //stack.length = l;
        }
        else stack.length = 0;
        return self;
    }
};
