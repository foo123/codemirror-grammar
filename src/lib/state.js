    
    //
    // ParserState Class
    var
        ParserState = Class({
            
            constructor: function( line, unique ) {
                var ayto = this;
                // this enables unique state "names"
                // thus forces highlight to update
                // however updates also occur when no update necessary ??
                ayto.id = unique ? new Date().getTime() : 0;
                ayto.l = line || 0;
                ayto.stack = [];
                ayto.t = T_DEFAULT;
                ayto.r = '0';
                ayto.inBlock = null;
                ayto.endBlock = null;
            },
            
            // state id
            id: 0,
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
            
            clone: function( unique ) {
                var ayto = this, c = new ayto.$class( ayto.l, unique );
                c.t = ayto.t;
                c.r = ayto.r;
                c.stack = ayto.stack.slice();
                c.inBlock = ayto.inBlock;
                c.endBlock = ayto.endBlock;
                return c;
            },
            
            // used mostly for ACE which treats states as strings, 
            // make sure to generate a string which will cover most cases where state needs to be updated by the editor
            toString: function() {
                var ayto = this;
                //return ['', ayto.id, ayto.inBlock||'0'].join('_');
                //return ['', ayto.id, ayto.t, ayto.r||'0', ayto.stack.length, ayto.inBlock||'0'].join('_');
                //return ['', ayto.id, ayto.t, ayto.stack.length, ayto.inBlock||'0'].join('_');
                //return ['', ayto.id, ayto.t, ayto.r||'0', ayto.inBlock||'0'].join('_');
                //return ['', ayto.l, ayto.t, ayto.r, ayto.inBlock||'0', ayto.stack.length].join('_');
                return ['', ayto.id, ayto.l, ayto.t, ayto.inBlock||'0'].join('_');
            }
        })
    ;
    