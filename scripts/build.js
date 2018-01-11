var fs = require('fs');
var exec = require('shelljs').exec;
var chalk = require('chalk');
var UglifyJS = require('uglify-js');

var pkg = require('../package.json');

var fileSize = function(src) {
  var stats = fs.statSync(src);
  return (stats['size'] / 1000.0).toFixed(2);
};

var browserify = '"node_modules/.bin/browserify"';
var derequire = '"node_modules/.bin/derequire"';

var es5 = './builds/ru-compromise.js';
var es5min = './builds/ru-compromise.min.js';

console.log(chalk.yellow(' 🕑 creating es5 build..'));

var banner = '/* ru-compromise v' + pkg.version + '\n   github.com/nlp-compromise/ru-compromise\n   MIT\n*/\n';

//es5 main (browserify + derequire)
cmd = browserify + ' "./src/index.js" --standalone nlp';
// cmd += ' -p bundle-collapser/plugin';
cmd += ' -t [ babelify --presets [ es2015 ] ]';
cmd += ' | ' + derequire;
cmd += ' >> ' + es5;
exec(cmd);

var result = UglifyJS.minify(es5, {
  output: {
    preamble: banner
  },
  mangle: {
    toplevel: true
  },
  compress: {
    passes: 2,
    unsafe: true, // some unsafe optimizations
    unsafe_comps: true,
    sequences: true, // join consecutive statemets with the “comma operator”
    properties: true, // optimize property access: a["foo"] → a.foo
    dead_code: true, // discard unreachable code
    drop_debugger: true, // discard “debugger” statements
    conditionals: true, // optimize if-s and conditional expressions
    comparisons: true, // optimize comparisons
    evaluate: true, // evaluate constant expressions
    booleans: true, // optimize boolean expressions
    loops: true, // optimize loops
    unused: true, // drop unused variables/functions
    hoist_funs: true, // hoist function declarations
    hoist_vars: true, // hoist variable declarations
    if_return: true, // optimize if-s followed by return/continue
    join_vars: true, // join var declarations
    cascade: true, // try to cascade `right` into `left` in sequences
    side_effects: true, // drop side-effect-free statements
    warnings: true // warn about potentially dangerous optimizations/code
  }
});
fs.writeFileSync(es5min, result.code);

console.log(chalk.green(' done!    es5min ' + fileSize(es5min) + 'k\n'));
