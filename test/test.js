var CodeMirrorGrammar = require("../build/codemirror_grammar.js");
var vm = require("vm"), fs = require("fs"), echo = console.log;

function require_js( path, context )
{
  context = context || {};
  var data = fs.readFileSync( path );
  vm.runInNewContext(data, context, path);
  return context;
}

var grammar = require_js('./grammars/json.js');

//echo( CodeMirrorGrammar.VERSION );
//echo( grammar.xml_grammar );
echo( JSON.stringify(CodeMirrorGrammar.pre_process( grammar.json_grammar ), null, 4) );


