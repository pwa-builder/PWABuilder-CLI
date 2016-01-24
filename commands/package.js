'use strict';

var lib = require('manifoldjs-lib');

var log = lib.log,
    projectBuilder = lib.projectBuilder;
    
function packageApps(program) {
  
  var platforms = program.platforms.split(/[\s,]+/);  
  var projectDir = program.args.length < 2 ? process.cwd() : program.args[1];  
  return projectBuilder.packageApps(platforms, projectDir, program);
}

module.exports = packageApps;