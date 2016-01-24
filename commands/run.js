'use strict';

var Q = require('q');

var lib = require('manifoldjs-lib');
  
var log = lib.log,
    projectBuilder = lib.projectBuilder;
    
function runApp (program) {

  if (program.args.length < 2) {
    return Q.reject(new Error('You must specify a platform.'));
  } 
  
  var platform = program.args[1];
  var projectDir = program.args.length < 3 ? process.cwd() : program.args[2];
  return projectBuilder.runApp(platform, projectDir, program);
}

module.exports = runApp;
