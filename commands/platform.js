'use strict';

var fs = require('fs'),
    path = require('path');

var lib = require('manifoldjs-lib');

var log = lib.log,
    platformTools = lib.platformTools,
    utils = lib.utils;

// registers a new platform module    
function addPlatform (program) {
  if (program.args.length < 3) {
    return log.error('You must specify a platform ID.');    
  }

  if (program.args.length < 4) {
    return log.error('You must specify the module name of the platform. This is the \'name\' property in its package.json file.');    
  }
  
  if (program.args.length < 5) {
    return log.error('You must specify a package source for the platform. This can be an npm package, a GitHub URL, or a local path.');    
  }
  
  var platformId = program.args[2].toLowerCase();
  var packageName = program.args[3];
  var source = program.args[4];
  
  platformTools.addPlatform(platformId, packageName, source).then(function () {
    log.info('The \'' + platformId + '\' platform was registered successfully.');      
  })
  .catch(function (err) {
    log.error(err.getMessage());
  })
}

// removes a registered platform module
function removePlatform (program) {
  if (program.args.length < 3) {
    return log.error('You must specify a platform ID.');    
  }
 
  var platformId = program.args[2].toLowerCase();
  
  platformTools.removePlatform(platformId).then(function () {
    log.info('The \'' + platformId + '\' platform was unregistered successfully.');      
  })
  .catch(function (err) {
    log.error(err.getMessage());
  })
}

function listPlatforms (program) {
  try {
    var platforms = platformTools.listPlatforms();  
    log.write('Available platforms are: ' + platforms.join(', '));
  }
  catch (err) {
    log.error(err.getMessage());
  }
}

function platformCommands (program) {
  if (program.args.length < 2) {
    return log.error('You must specify a platform operation: add, remove, or list.');    
  }

  var command = program.args[1].toLowerCase();
  switch (command) {
    case 'add':
      addPlatform(program);
      break;
    
    case 'remove':
      removePlatform(program);
      break;
      
    case 'list':
      listPlatforms(program);
      break;
      
    default:
      log.error('Unknown option \'' + command + '\' specified.');
      break;      
  } 
}

module.exports = platformCommands; 
    

