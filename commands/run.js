'use strict';

var lib = require('manifoldjs-lib');
  
var log = lib.log,
    projectBuilder = lib.projectBuilder;
    
function runApp (program) {
  var platform = program.args[1];

  if (program.args.length < 2) {
    return 'You must specify a platform.';
  } 
  
  projectBuilder.runApp(platform).catch(function (err) {
    log.error(err.getMessage());
  });  
}

module.exports = runApp;
