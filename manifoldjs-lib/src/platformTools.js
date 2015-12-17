'use strict';

var path = require('path'),
    Q = require('q');

var npm = require('./npm'),
    CustomError = require('./customError'),
    log = require('./log');

var registeredPlatforms = {};

function loadPlatform(platformId, packageName, source, callback) {
  
  if (!packageName) {
      return Q.reject(new Error('Platform name is missing or invalid.')).nodeify(callback);
  }

  if (!source) {
      return Q.reject(new Error('Platform package path is missing or invalid.')).nodeify(callback);
  }

  return npm.installPackage(packageName, source)
    .then(function (platformModule) {
      // create new instance of platform
      var platform = new platformModule.Platform(platformId, packageName);
      if (!platform) {
        return Q.reject(new Error('Failed to create instance of platform: \'' + platformId + '\''));
      }
      
      // cache platform instance
      registeredPlatforms[platformId].instance = platform;
      return Q.resolve(platform);
    })
    .catch (function (err) {
      return Q.reject(new CustomError('Failed to install platform: \'' + platformId + '\'.', err));      
    })
    .nodeify(callback);
}

function loadPlatforms(platforms, callback) {
  var tasks = platforms.map(function (platformId) {
    var platformInfo = registeredPlatforms[platformId];
    if (!platformInfo) {
      return Q.reject(new Error('The requested platform \'' + platformId + '\' is not registered.'));
    }

    log.debug('Loading platform \'' + platformId + '\'...');
    return loadPlatform(platformId, platformInfo.packageName, platformInfo.source);
  });

  return Q.all(tasks).then(function (platforms) {
    log.debug('Loaded all registered platforms.');
    return platforms;
  });
}

function enablePlatforms(platformConfig) {
  if (!platformConfig) {
    var configPath = path.resolve(path.dirname(require.main.filename), 'platforms.json');
    try {
      platformConfig = require(configPath);
    }
    catch (err) {
      throw new Error('Platform configuration file is missing or invalid - path: \'' + configPath + '\'.');
    }    
  }
  
  registeredPlatforms = platformConfig;      
}

function getAllPlatforms () {
  return Object.keys(registeredPlatforms)
          .map(function (key) {
            return registeredPlatforms[key].instance;
          }); 
}

function getPlatform (platformId) {
  var platformInfo = registeredPlatforms[platformId];
  if (!platformInfo) {
    throw new Error('The requested platform \'' + platformId + '\' was not found.')
  }
  
  if (!platformInfo.instance) {
    throw new Error('The requested platform \'' + platformId + '\' was not loaded.')
  }
  
  return platformInfo.instance;
}

module.exports = {
  enablePlatforms: enablePlatforms,
  loadPlatform: loadPlatform,
  loadPlatforms: loadPlatforms,
  getAllPlatforms: getAllPlatforms,
  getPlatform: getPlatform
};
