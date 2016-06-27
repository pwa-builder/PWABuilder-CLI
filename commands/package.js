'use strict';

var lib = require('manifoldjs-lib');

var log = lib.log,
    platformTools= lib.platformTools,
    projectBuilder = lib.projectBuilder;

function packageApps(program, platforms) {
  if (!platforms) {
    platforms = program.platforms ? 
                program.platforms.split(/[\s,]+/) :
                platformTools.listPlatforms();
  }

  var projectDir = program.args.length < 2 ? process.cwd() : program.args[1];
  return lib.projectTools.getProjectPlatforms(projectDir).then(function (projectPlatforms) {
    // exclude any platforms not present in the project
    platforms = platforms.filter(function (platform) {
      return projectPlatforms.indexOf(platform) >= 0;
    });
    
    return projectBuilder.packageApps(platforms, projectDir, program); 
  });
}

module.exports = packageApps;