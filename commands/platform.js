'use strict';

var fs = require('fs'),
    path = require('path');

var Q = require('q');

var lib = require('manifoldjs-lib');

var log = lib.log,
    platformTools = lib.platformTools,
    utils = lib.utils;

// registers a new platform module    
function addPlatform (program) {
  if (program.args.length < 3) {
    return Q.reject(new Error('You must specify a platform ID.'));    
  }
  
  if (program.args.length < 4) {
    return Q.reject(new Error('You must specify a package source for the platform. This can be an npm package, a GitHub URL, or a local path.'));    
  }
  
  var platformId = program.args[2].toLowerCase();
  var source = program.args[3];
  
  return platformTools.addPlatform(platformId, source).then(function () {
    log.info('The \'' + platformId + '\' platform was registered successfully.');      
  });
}

// removes a registered platform module
function removePlatform (program) {
  if (program.args.length < 3) {
    return Q.reject(new Error('You must specify a platform ID.'));    
  }
 
  var platformId = program.args[2].toLowerCase();
  
  return platformTools.removePlatform(platformId).then(function () {
    log.info('The \'' + platformId + '\' platform was unregistered successfully.');      
  });
}

function listPlatforms (program) {
  try {
    var platforms = platformTools.listPlatforms();  
    log.write('Available platforms are: ' + platforms.join(', '));
    return Q.resolve();
  }
  catch (err) {
    return Q.reject(err);
  }
}

function platformCommands (program) {
  if (program.args.length < 2) {
    return Q.reject(new Error('You must specify a platform operation: add, remove, or list.'));    
  }

  var command = program.args[1].toLowerCase();
  switch (command) {
    case 'add':
      return addPlatform(program);
    
    case 'remove':
      return removePlatform(program);
      
    case 'list':
      return listPlatforms(program);
      
    default:
      return Q.reject(new Error('Unknown option \'' + command + '\' specified.'));
  }  
}

module.exports = platformCommands; 
    

