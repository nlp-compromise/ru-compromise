'use strict';
const pkg = require('../package.json');
const core = require('nlp-core');

//the main function
const nlp = function(str, lex) {
  return core(str, lex)
};

//this is handy
nlp.version = pkg.version;

//same as main method, except with no POS-tagging.
nlp.tokenize = function(str) {
  return core.tokenize(str);
};

//and then all-the-exports...
if (typeof self !== 'undefined') {
  self.nlp = nlp; // Web Worker
} else if (typeof window !== 'undefined') {
  window.nlp = nlp; // Browser
} else if (typeof global !== 'undefined') {
  global.nlp = nlp; // NodeJS
}
//don't forget amd!
if (typeof define === 'function' && define.amd) {
  define(nlp);
}
//then for some reason, do this too!
if (typeof module !== 'undefined') {
  module.exports = nlp;
}
