
//
// Stack Class
var Stack = Class({
    constructor: function Stack( array ) {
        this._ = array || [];
    }
    
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
    
    ,empty: function( $id, id ) {
        var self = this, stack = self._;
        if ( $id && id )
            while ( stack.length && stack[stack.length-1] && stack[stack.length-1][$id] === id ) stack.pop();
        else
            stack.length = 0;
        return self;
    }
});
