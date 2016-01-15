'use strict';

var lib = require('manifoldjs-lib');

var log = lib.log,
    projectBuilder = lib.projectBuilder;
    
function packageApps(program) {
  
  // create app store packages for publishing
  var platforms = program.platforms.split(/[\s,]+/);
  projectBuilder.packageApps(platforms, process.cwd(), program).then(function () {
    log.write('The app store package(s) are ready.');
  })
  .catch(function (err) {
    var errmsg = err.getMessage();
    if (log.getLevel() !== log.levels.DEBUG) {
      errmsg += '\nFor more information, run manifoldjs with the diagnostics level set to debug (e.g. manifoldjs [...] -l debug)';
    }

    log.error(errmsg);
  })
  .done(function () {
    log.write('All done!');        
  });
}

module.exports = packageApps;