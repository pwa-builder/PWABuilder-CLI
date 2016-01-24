'use strict';

var lib = require('manifoldjs-lib');

var log = lib.log,
    projectBuilder = lib.projectBuilder;
    
function packageApps(program) {
  
  // create app store packages for publishing  
  var projectDir = program.args.length < 2 ? process.cwd() : program.args[1];
  
  var platforms = program.platforms.split(/[\s,]+/);
  return projectBuilder.packageApps(platforms, projectDir, program);
}

module.exports = packageApps;