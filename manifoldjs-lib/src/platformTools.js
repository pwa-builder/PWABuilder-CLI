'use strict';

var path = require('path'),
    Q = require('q');

var packageTools = require('./packageTools'),
    CustomError = require('./customError'),
    log = require('./log');

var registeredPlatforms = {};
var loadedPackages = {};

function getPlatformModule(packageName, source) {
  
  if (!packageName) {
      return Q.reject(new Error('Platform name is missing or invalid.'));
  }

  if (!source) {
      return Q.reject(new Error('Platform package source is missing or invalid.'));
  }

  try {
    var module = require(packageName);
    return Q.resolve(module);
  }
  catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      return Q.reject(new CustomError('Failed to resolve module: \'' + packageName + '\'.', err));
    }
    
    return packageTools.installPackage(packageName, source);
  }
}

function loadPlatform(packageName, source, callback) {
  log.debug('Loading platform module: ' + packageName);
  return getPlatformModule(packageName, source)
    .then(function(module) {
      return module.Platform;
    })
    .nodeify(callback);
}

function loadPlatforms(platforms, callback) {
	var platformMap = {};
	// load all platform modules and map the corresponding platforms to each one, taking into account that
	// multiple platforms may map to a single module (e.g. manifoldjs-cordova => android, ios, windows...)
	var tasks = platforms.reduce(function (taskList, platformId) {

		// ensure that the platform is registered and is assigned a package name
    var platformInfo = registeredPlatforms[platformId];
		if (platformInfo && platformInfo.packageName) {
      var packageName = platformInfo.packageName;
      
			// check if the module has already been loaded
			var platformList = platformMap[packageName];
			if (!platformList) {

				// create a new task to load the platform module
				platformMap[packageName] = platformList = [];
				var task = loadPlatform(packageName, platformInfo.source)
                      .then(function(Platform) {
                        return { id: packageName, Platform: Platform, platforms: platformList };						
                      });

				taskList.push(task);
			}

			// assign the current platform to the module
			platformList.push(platformId);
		}
		else {
			taskList.push(Q.reject(new Error('Platform \'' + platformId + '\' is not registered!')));
		}

		return taskList;
	}, []);

	// wait for all loading tasks to complete
	return Q.all(tasks)
		.then(function (platforms) {
			// create instances of each loaded platform
			return platforms.map(function (module) {
				return new module.Platform(module.id, module.platforms);
			});
		})
		.finally(function () {
			// ensure that all loading tasks have finished even if one of them fails;
			// otherwise, you see the failure message for one platform followed by the 
			// success messages for the other platforms.
			return Q.allSettled(tasks);
		})
    .nodeify(callback);
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
