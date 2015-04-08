var manifestTools = require('./tools'),
    path = require('path'),
    url = require('url'),
    exec = require('child_process').exec,
    fs = require('fs'),
    log = require('loglevel'),
    validations = require('./validations'),
    downloader = require('./downloader'),
    Q = require('q'),
    mkdirp = require('mkdirp');

function createApps(manifestInfo, rootDir, platforms, build, callback) {
  
  // determine the path where the Cordova app will be created
  var appName = manifestInfo.content.short_name;
  var generatedAppDir = path.join(rootDir, appName);
  
  // create app directory
  mkdirp(generatedAppDir, function (err) {
    if (err && err.code !== 'EEXIST') {
      return callback(err);
    }
    
    // process all requested platforms    
    var pendingTasks = [];
    var cordovaPlatforms = [];
    platforms.forEach(function (el) {
      var deferral = new Q.defer();
      var platform = el.toUpperCase();
      if (platform === 'CHROME') {
        pendingTasks.push(deferral.promise);
        createChromeApp(manifestInfo, generatedAppDir, build, function (err) {
          if (err) deferral.reject(); else deferral.resolve();
        });
      } 
      if (platform === 'FIREFOX') {
        pendingTasks.push(deferral.promise);
        createFirefoxApp(manifestInfo, generatedAppDir, build, function (err) {
          if (err) deferral.reject(); else deferral.resolve();
        });
      } else if (platform === 'WINDOWS' || platform === 'IOS' || platform === 'ANDROID') {
        cordovaPlatforms.push(el);
      }
    });
    
    if (cordovaPlatforms.length) {
      var deferral = new Q.defer();
      pendingTasks.push(deferral.promise);
      createCordovaApp(manifestInfo, generatedAppDir, cordovaPlatforms, build, function (err) {
        if (err) deferral.reject(); else deferral.resolve();
        deferral.resolve();
      });
    }

    Q.all(pendingTasks).done(
      function () {
        if (callback) {
          callback();
        }
      }, 
      function (err) {
        callback(new Error('One or more errors occurred when generating the application.'));
      });
    });
}

function createChromeApp(w3cManifestInfo, generatedAppDir, build, callback) {
  log.info('Generating the Chrome application...');
  
  manifestTools.convertTo(w3cManifestInfo, 'chromeOS', function (err, chromeManifestInfo) {
    if (err) {
      log.error(err.message);
      return;
    }
    
    // if the platform dir doesn't exist, create it
    var platformDir = path.join(generatedAppDir, 'chrome');
    mkdirp(platformDir, function (err) {
      if (err && err.code !== 'EEXIST') {
        return callback(err);
      }
      
      // download icons to the app's folder
      var pendingTasks = [];
      log.info('Downloading Chrome icons...');
      var icons = chromeManifestInfo.content.icons;
      for (var size in icons) {
        var deferral = new Q.defer();
        pendingTasks.push(deferral.promise);
        var iconUrl = url.resolve(w3cManifestInfo.content.start_url, icons[size]);
        downloader.downloadImage(iconUrl, platformDir, function (err, data) {
          if (err) {
            log.warn('WARNING: Failed to download icon file: ' + icons[size] + ' (' + err.message + ')');
            log.debug(err);
          } else {
            var localPath = path.basename(data.path);
            icons[size] = localPath;
          }

          deferral.resolve();
        });
      }

      // copy the manifest file to the app folder
      Q.all(pendingTasks).done(function () {
        log.info('Copying the Chrome manifest to the app folder...');
        var manifestFilePath = path.join(platformDir, 'manifest.json');
        manifestTools.writeToFile(chromeManifestInfo, manifestFilePath, function (err) {
          if (err) {
            log.error('ERROR: Failed to copy the manifest to the Chrome platform folder.');
            log.debug(err);
            return callback(new Error('The Chrome project could not be created successfully.'));
          }

          callback();
        });
      });
    });
  });
}

function createFirefoxApp(w3cManifestInfo, generatedAppDir, build, callback) {
  log.info('Generating the Firefox application...');
  
  manifestTools.convertTo(w3cManifestInfo, 'firefox', function (err, firefoxManifestInfo) {
    if (err) {
      log.error(err.message);
      return;
    }
    
    // if the platform dir doesn't exist, create it
    var platformDir = path.join(generatedAppDir, 'firefox');
    mkdirp(platformDir, function (err) {
      if (err && err.code !== 'EEXIST') {
        return callback(err);
      }
            
      // copy the manifest file to the app folder
      log.info('Copying the Firefox manifest to the app folder...');
      var manifestFilePath = path.join(platformDir, 'manifest.webapp');
      manifestTools.writeToFile(firefoxManifestInfo, manifestFilePath, function (err) {
        if (err) {
          log.error('ERROR: Failed to copy the manifest to the Firefox platform folder.');
          log.debug(err);
          return callback(new Error('The Firefox project could not be created successfully.'));
        }

        callback();
      });
    });
  });
}

function createCordovaApp(w3cManifestInfo, generatedAppDir, platforms, build, callback) {
  log.info('Generating the Cordova application...');
  
  if (!validations.platformsValid(platforms)) {
    return callback(new Error('Invalid platform(s) specified.'));
  }
  
  // path to cordova shell command
  var cordovaPath = path.resolve(__dirname, '..', 'node_modules', 'cordova', 'bin', 'cordova');
  
  // path where the plugin is located (TEMPORARY - THIS WILL BE REPLACED WITH REFERENCE TO PLUGIN'S REPOSITORY)
  var pluginDir = path.resolve(__dirname, '..', '..', '..', 'cordovaApps', 'plugins', 'com.microsoft.hostedwebapp');
  
  // go to the directory where the app will be created
  process.chdir(generatedAppDir);
  
  // generate a reverse-domain-style package name from the manifest's start_url
  var packageName = '';
  url.parse(w3cManifestInfo.content.start_url)
            .hostname
            .replace(/-/g, '')
            .split('.')
            .map(function (segment) {
    packageName = segment + (packageName ? '.' : '') + packageName;
  });
  
  // create the Cordova app
  log.info('Creating the Cordova application...');
  var cmdLine = cordovaPath + ' create cordova ' + packageName + ' ' + w3cManifestInfo.content.short_name;
  log.debug('    ' + cmdLine);
  exec(cmdLine, function (err, stdout, stderr) {
    if (err) {
      log.error('ERROR: Failed to create the Cordova application - ' + err.message);
      log.debug(err);
      return callback(new Error('The Cordova project could not be created successfully.'));
    } else {
      log.error(stderr);
    }
    
    // copy the manifest file to the 'www' folder of the app
    log.info('Copying the W3C manifest to the Cordova app folder...');
    var platformDir = path.join(generatedAppDir, 'cordova');
    var manifestFilePath = path.join(platformDir, 'www', 'manifest.json');
    manifestTools.writeToFile(w3cManifestInfo, manifestFilePath, function (err) {
      if (err) {
        log.error('ERROR: Failed to copy the manifest to the app folder.');
        log.debug(err);
        return callback(new Error('The Cordova project could not be created successfully.'));
      }
      
      // set generated app's directory as current
      process.chdir(platformDir);
      
      // add the Hosted Web App plugin
      log.info('Adding the Hosted Web App plugin to the Cordova project...');
      cmdLine = cordovaPath + ' plugin add "' + pluginDir + '"';
      log.debug('    ' + cmdLine);
      exec(cmdLine, function (err, stdout, stderr) {
        if (err) {
          log.error('ERROR: Failed to add the Hosted Web App plugin to the Cordova project.');
          log.debug(err);
          return callback(new Error('The Cordova project could not be created successfully.'));
        } else {
          log.error(stderr);
        }
        
        // process all the specified platforms
        platforms.forEach(function (platform, index) {
          log.info('Adding Cordova platform: ' + platform + '...');
          cmdLine = cordovaPath + ' platform add ' + platform;
          log.debug('    ' + cmdLine);
          exec(cmdLine, function (err, stdout, stderr) {
            if (err) {
              log.warn('WARNING: Failed to add ' + platform + ' platform.');
              log.debug(err);
              if (index === platforms.length - 1) {
                return callback();
              }
            } else {
              log.error(stderr);
            }
            
            log.info('Creating shortcut for platform: ' + platform + '...');
            createPlatformShortcut(generatedAppDir, platform, function (err) {
              if (err) {
                log.warn('WARNING: Failed to create shortcut for platform \'' + platform + '\'. ' + err.message);
                log.debug(err);
              }
              
              // build the platform-specific projects
              if (build) {
                log.info('Building Cordova platform: ' + platform + '...');
                cmdLine = cordovaPath + ' build ' + platform;
                log.debug('    ' + cmdLine);
                exec(cmdLine, function (err, stdout, stderr) {
                  if (err) {
                    log.warn('WARNING: Failed to build ' + platform + ' platform.');
                    log.debug(err);
                  } else {
                    log.error(stderr);
                  }
                  
                  if (index === platforms.length - 1) {
                    return callback();
                  }
                });
              } else if (index === platforms.length - 1) {
                return callback();
              }
            });
          });
        });
      });
    });
  });
}

function createPlatformShortcut(projectPath, platform, callback) {
  var srcpath = path.resolve(projectPath, 'cordova', 'platforms', platform);
  var dstpath = path.resolve(projectPath, platform);
  fs.symlink(srcpath, dstpath, 'junction', function (err) {
    if (callback) {
      callback(err);
    }
  });
}

module.exports = {
  createApps: createApps,
  createCordovaApp: createCordovaApp,
  createChromeApp: createChromeApp
};