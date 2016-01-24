'use strict';

var lib = require('manifoldjs-lib');

var log = lib.log,
    projectBuilder = lib.projectBuilder;
    
function packageApps(program) {
  
  // create app store packages for publishing
  var platforms = program.platforms.split(/[\s,]+/);
  return projectBuilder.packageApps(platforms, process.cwd(), program);
}

module.exports = packageApps;