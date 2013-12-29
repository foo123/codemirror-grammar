/**
*
*   @@MODULE_NAME@@
*   @version: @@VERSION@@
*
*   @@MODULE_DESC@@
*   @@REPO_URL@@
*
**/
!function ( root, name, deps, factory ) {

    //
    // export the module in a umd-style generic way
    deps = ( deps ) ? [].concat(deps) : [];
    var i, dl = deps.length, ids = new Array( dl ), paths = new Array( dl ), mods = new Array( dl );
    for (i=0; i<dl; i++) { ids[i] = deps[i][0]; paths[i] = deps[i][1]; }
    
    // node, commonjs, etc..
    if ( 'object' == typeof( module ) && module.exports ) 
    {
        if ( 'undefined' == typeof(module.exports[name]) )
        {
            for (i=0; i<dl; i++)
                mods[i] = module.exports[ ids[i] ] || require( paths[i] )[ ids[i] ];
            module.exports[ name ] = factory.apply(root, mods );
        }
    }
    
    // amd, etc..
    else if ( 'function' == typeof( define ) && define.amd ) 
    {
        define( ['exports'].concat( paths ), function( exports ) {
            if ( 'undefined' == typeof(exports[name]) )
            {
                var args = Array.prototype.slice.call( arguments, 1 );
                for (var i=0, dl=args.length; i<dl; i++)
                    mods[i] = exports[ ids[i] ];
                exports[name] = factory.apply(root, mods );
            }
        });
    }
    
    // browsers, other loaders, etc..
    else 
    {
        if ( 'undefined' == typeof(root[name]) )
        {
            for (i=0; i<dl; i++)
                mods[i] = root[ ids[i] ];
            root[name] = factory.apply(root, mods );
        }
    }


}( this, /* module name */ "@@MODULE_NAME@@",
    /* module dependencies */ @@MODULE_DEPENDENCIES@@, 
    /* module factory */  function( @@MODULE_ARGUMENTS@@ ) {
