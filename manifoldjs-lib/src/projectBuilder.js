var path = require('path'),
    url = require('url'),
    fs = require('fs');

var Q = require('q');    

var fileTools = require('./fileTools'),
    log = require('./log'),
    manifestTools = require('./manifestTools'),
    platformTools = require('./platformTools'),
    utils = require('./utils'),
		validationConstants = require('./constants').validation;

// TODO: platform windows should also generate windows10
// TODO: review log levels for validation results
var createApps = function (w3cManifestInfo, rootDir, platforms, options, callback) {

	var platformModules;
	
  // enable all registered platforms
  Q.fcall(platformTools.enablePlatforms)
	// load all platforms specified in the command line
	.then(function () {
		return platformTools.loadPlatforms(platforms)		
	})
	// validate the manifest
	.then(function (modules) {
		platformModules = modules;		
		return manifestTools.validateManifest(w3cManifestInfo, platformModules, platforms);
	})
	// output validation results
	.then(function (validationResults) {
		validationResults.forEach(function (result) {			
      if (result.level === validationConstants.levels.suggestion) {
        log.info('Manifest validation - ' + result.description + ' (member: ' + result.member + ').', result.platform);        
      } else if (result.level === validationConstants.levels.warning) {
        log.warn('Manifest validation - ' + result.description + ' (member: ' + result.member + ').', result.platform);        
      } else if (result.level === validationConstants.levels.error) {
        log.error('Manifest validation - ' + result.description + ' (member: ' + result.member + ').', result.platform);        
      }
		});
	})
  .then(function () {
    // determine the path where the Cordova app will be created
    options.appName = utils.sanitizeName(w3cManifestInfo.content.short_name);
    var generatedAppDir = path.join(rootDir, options.appName);

    // Add timestamp to manifest information for telemetry purposes only
    w3cManifestInfo.timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\.[0-9]+/, ' ');
    
    // create app directory
    return fileTools.mkdirp(generatedAppDir)
			.thenResolve(generatedAppDir);
  })
	.then(function (generatedAppDir) {
		// create apps for each platform
		var tasks = platformModules.map(function (platform) {
			if (!platform) {
				return Q.resolve();
			};
						
			log.debug('Creating app for platform \'' + platform.name + '\'...');
			return Q.nfcall(platform.create, w3cManifestInfo, generatedAppDir, options)
					.then(function () {
						log.info(platform.name + ' app is created!');
					})
					.catch(function (err) {
						log.error(platform.name + ' app could not be created - '+ err.getMessage());
					});
		});

		return Q.allSettled(tasks);
	})
	.catch(function (err) {
		log.error('Completed with errors - ' + err.getMessage());	
	})
	.done(function () {
		log.info('All done!');
	});
}

// var createApps = function (w3cManifestInfo, rootDir, platforms, options, callback) {
//   var errmsg = 'One or more errors occurred when generating the application.';
//   manifestTools.validateManifest(w3cManifestInfo, platforms, function (err, validationResults) {
//     if (err) {
//       log.error('ERROR: ' + err.message);
//       return callback && callback(wrapError(errmsg, err));
//     }
// 
//     var invalidManifest = false;
//     validationResults.forEach(function (validationResult) {
//       var validationMessage = validationResult.level.toUpperCase() +  ': Manifest validation ' +  ' (' + validationConstants.platformDisplayNames[validationResult.platform] + ') - ' + validationResult.description + '[' + validationResult.member + ']';
//       if (validationResult.level === validationConstants.levels.warning) {
//         log.warn(validationMessage);
//       } else if (validationResult.level === validationConstants.levels.suggestion) {
//         log.warn(validationMessage);
//       } else if (validationResult.level === validationConstants.levels.error) {
//         log.error(validationMessage);
//         invalidManifest = true;
//       }
//     });
// 
//     // report manifest validation errors
//     if (invalidManifest) {
//       var validationError = new Error(errmsg);
//       validationError.name = 'ValidationError';
//       validationError.validationResults = validationResults;
//       return callback && callback(validationError);
//     }
// 
//     // determine the path where the Cordova app will be created
//     options.appName = utils.sanitizeName(w3cManifestInfo.content.short_name);
//     var generatedAppDir = path.join(rootDir, options.appName);
// 
//     // Add timestamp to manifest information for telemetry purposes only
//     w3cManifestInfo.timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\.[0-9]+/, ' ');
// 
//     // create app directory
//     mkdirp(generatedAppDir, function (err) {
//       if (err && err.code !== 'EEXIST') {
//         return callback && callback(wrapError(errmsg + ' Failed to create the directory for the app: \'' + generatedAppDir + '\'.', err));
//       }
// 
//       // process all requested platforms
//       var pendingTasks = [];
//       var cordovaPlatforms = [];
//       var addWindows10Task = false;
//       platforms.forEach(function (el) {
//         var platform = el.toUpperCase();
//         if (platform === 'CHROME') {
//           pendingTasks.push(createChromeApp(w3cManifestInfo, generatedAppDir, options));
//         } else if (platform === 'FIREFOX') {
//           pendingTasks.push(createFirefoxOSApp(w3cManifestInfo, generatedAppDir, options));
//         } else if (platform === 'WINDOWS10') {
//           addWindows10Task = true;
//         } else if (platform === 'WINDOWS') {
//           cordovaPlatforms.push(el);
//           addWindows10Task = true;
//         } else if (platform === 'WEB') {
//           pendingTasks.push(createWebApp(w3cManifestInfo, generatedAppDir, options));
//         } else if ( platform === 'IOS') {
//           cordovaPlatforms.push(el);
//         } else if ( platform === 'ANDROID') {
//           cordovaPlatforms.push(el);
//         } else {
//           log.warn('WARNING: Ignoring unknown platform: \'' + el + '\'.');
//         }
//       });
// 
//       // generate Cordova project
//       if (cordovaPlatforms.length) {
//         pendingTasks.push(createCordovaApp(w3cManifestInfo, generatedAppDir, cordovaPlatforms, options));
//       }
// 
//       // generate windows 10 hosted web app
//       if (addWindows10Task) {
//         pendingTasks.push(createWindows10App(w3cManifestInfo, generatedAppDir, options));
//       }
// 
//       Q.allSettled(pendingTasks)
//       .done(function (results) {
//         // report any errors
//         var innerErrors = [];
//         results.forEach(function (task) {
//           if (task.state !== 'fulfilled') {
//             log.error(task.reason.message);
//             if (task.reason.innerErrors) {
//               task.reason.innerErrors.forEach(function (innerError) {
//                 log.debug(innerError.message);
//               });
//             }
// 
//             innerErrors.push(task.reason);
//           }
//         });
// 
//         return callback && callback(innerErrors.length ? wrapError(errmsg, innerErrors) : undefined);
//       });
//     });
//   });
// };

function packageApps (platforms, rootDir, outputPath, options, callback) {

  // enable all registered platforms
  Q.fcall(platformTools.enablePlatforms)
	// load all platforms specified in the command line
	.then(function () {
		return platformTools.loadPlatforms(platforms)		
	})
	.then(function (platformModules) {
		// create apps for each platform
		var tasks = platformModules.map(function (platform) {
			if (!platform) {
				return Q.resolve();
			};
						
			log.debug('Packaging the app for the \'' + platform.name + '\' platform...');
			return Q.nfcall(platform.package, rootDir, outputPath, options)
					.then(function () {
						log.info('The ' + platform.name + ' app is packaged!');
					})
					.catch(function (err) {
						log.error('The ' + platform.name + ' app could not be packaged - '+ err.getMessage());
					});
		});

		return Q.allSettled(tasks);
	})
	.catch(function (err) {
		log.error('Completed with errors - ' + err.getMessage());	
	})
	.done(function () {
		log.info('All done!');
	});  
};

module.exports = {
  createApps: createApps,
  packageApps: packageApps
};
