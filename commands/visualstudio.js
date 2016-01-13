'use strict';

var lib = require('manifoldjs-lib');

var log = lib.log,
    projectTools = lib.projectTools;

function launchVisualStudio() {
  projectTools.openVisualStudio(function (err) {
    if (err) {
      log.error('ERROR: ' + err.message);
    } else {
      log.info('The Visual Studio project was opened successfully!');
    }
  });  
}

module.exports = launchVisualStudio;