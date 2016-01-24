'use strict';

var Q = require('q');

var lib = require('manifoldjs-lib');
  
var log = lib.log,
    projectBuilder = lib.projectBuilder;
    
function runApp (program) {
  var platform = program.args[1];

  if (program.args.length < 2) {
    return Q.reject(new Error('You must specify a platform.'));
  } 
  
  return projectBuilder.runApp(platform);
}

module.exports = runApp;
