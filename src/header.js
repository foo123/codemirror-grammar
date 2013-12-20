/**
*
*   CodeMirrorGrammar
*   @version: @@VERSION@@
*   Transform a grammar specification in JSON format,
*   into a CodeMirror syntax-highlight parser mode
*
*   https://github.com/foo123/codemirror-grammar
*
**/
!function (dependencies, root, moduleName, moduleDefinition) {

    //
    // export the module
    
    // node, CommonJS, etc..
    if ( 'object' == typeof(module) && module.exports ) module.exports = moduleDefinition;
    
    // AMD, etc..
    else if ( 'function' == typeof(define) && define.amd ) define( moduleDefinition );
    
    // browser, etc..
    else 
    {
        if (dependencies && dependencies.length)
        {
            for (var i=0, l=dependencies.length; i<l; i++)
                dependencies[i] = root[ dependencies[i] ];
            root[ moduleName ] = moduleDefinition.apply({}, dependencies);
        }
        else
        {
            root[ moduleName ] = moduleDefinition();
        }
    }


}( ["Classy", "RegExAnalyzer"], this, 'CodeMirrorGrammar', function( Classy, RegexAnalyzer, undef ) {
    
    var VERSION = "@@VERSION@@";
    var Class = Classy.Class;
