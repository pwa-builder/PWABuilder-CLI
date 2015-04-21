// ID or URL of the Hosted Web App plugin - THIS SETTING WILL NEED TO BE UPDATED IF THE PLUGIN IS RELOCATED
var pluginIdOrUrl = 'https://github.com/manifoldjs/ManifoldCordova.git';

var manifestTools = require('./manifestTools'),
    path = require('path'),
    url = require('url'),
    exec = require('child_process').exec,
    fs = require('fs'),
    log = require('loglevel'),
    downloader = require('./projectBuilder/downloader'),
    Q = require('q'),
    c = require('./manifestTools/constants'),
    mkdirp = require('mkdirp');

function validateManifest(manifestInfo) {
  if (manifestInfo.format !== c.BASE_MANIFEST_FORMAT) {
    return new Error("The manifest passed as parameter is not a W3C manifest.");
  }

  var parsedManifestStartUrl = url.parse(manifestInfo.content.start_url);
  if (!parsedManifestStartUrl.hostname) {
    return new Error("The manifest's start_url parameter (" + parsedManifestStartUrl.hostname + ") is not a full url.");
  }
}

var createApps = function (w3cManifestInfo, rootDir, platforms, build, callback) {
  var err = validateManifest(w3cManifestInfo);
  if (err) {
    return callback(err);
  }

  // determine the path where the Cordova app will be created
  var appName = w3cManifestInfo.content.short_name;
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
      var platform = el.toUpperCase();
      if (platform === 'CHROME') {
        pendingTasks.push(createChromeApp(w3cManifestInfo, generatedAppDir, build));
      } else if (platform === 'FIREFOX') {
        pendingTasks.push(createFirefoxApp(w3cManifestInfo, generatedAppDir, build));
      } else if (platform === 'WINDOWS' || platform === 'IOS' || platform === 'ANDROID') {
        // all these platforms are handled by Cordova
        cordovaPlatforms.push(el);
      } else {
        return callback(new Error('Unknown platform \'' + el + '\' specified.'));
      }
    });

    // generate Cordova project
    if (cordovaPlatforms.length) {
      pendingTasks.push(createCordovaApp(w3cManifestInfo, generatedAppDir, cordovaPlatforms, build));
    }

    Q.allSettled(pendingTasks)
      .done(function (results) {
        var err;
        results.forEach(function (task) {
          if (task.state !== 'fulfilled') {
            log.error('WARNING: ' + task.reason.message);
            if (!err) {
              err = new Error('One or more errors occurred when generating the application.');
            }
          }
        });

        if (callback) {
          callback(err);
        }
      });
  });
};

var createChromeApp = function (w3cManifestInfo, generatedAppDir, build) {
  log.info('Generating the Chrome application...');

  var task = Q.defer();

  manifestTools.convertTo(w3cManifestInfo, 'chromeOS', function (err, chromeManifestInfo) {

    if (err) {
      log.error(err.message);
      return task.reject(new Error('The Chrome project could not be created successfully.'));
    }

    // if the platform dir doesn't exist, create it
    var platformDir = path.join(generatedAppDir, 'chrome');
    mkdirp(platformDir, function (err) {
      if (err && err.code !== 'EEXIST') {
        log.error(err.message);
        return task.reject(new Error('The Chrome project could not be created successfully.'));
      }

      // download icons to the app's folder
      var pendingDownloads = [];
      log.info('Downloading Chrome icons...');
      var icons = chromeManifestInfo.content.icons;
      for (var size in icons) {
        var downloadTask = new Q.defer();
        pendingDownloads.push(downloadTask.promise);
        var iconUrl = url.resolve(w3cManifestInfo.content.start_url, icons[size]);
        downloader.downloadImage(iconUrl, platformDir, function (err, data) {
          if (err) {
            log.warn('WARNING: Failed to download icon file: ' + icons[size] + ' (' + err.message + ')');
            log.debug(err);
          } else {
            var localPath = path.basename(data.path);
            icons[size] = localPath;
          }

          downloadTask.resolve();
        });
      }

      // copy the manifest file to the app folder
      Q.allSettled(pendingDownloads)
        .done(function () {
          log.info('Copying the Chrome manifest to the app folder...');
          var manifestFilePath = path.join(platformDir, 'manifest.json');
          manifestTools.writeToFile(chromeManifestInfo, manifestFilePath, function (err) {
            if (err) {
              log.error('ERROR: Failed to copy the manifest to the Chrome platform folder.');
              log.debug(err);
              return task.reject(new Error('The Chrome project could not be created successfully.'));
            }

            return task.resolve();
          });
        });
    });
  });

  return task.promise;
};

var createFirefoxApp = function (w3cManifestInfo, generatedAppDir, build) {
  log.info('Generating the Firefox application...');

  var task = Q.defer();

  manifestTools.convertTo(w3cManifestInfo, 'firefox', function (err, firefoxManifestInfo) {
    if (err) {
      log.error(err.message);
      return task.reject(new Error('The Firefox project could not be created successfully.'));
    }

    // if the platform dir doesn't exist, create it
    var platformDir = path.join(generatedAppDir, 'firefox');
    mkdirp(platformDir, function (err) {
      if (err && err.code !== 'EEXIST') {
        log.error(err.message);
        return task.reject(new Error('The Firefox project could not be created successfully.'));
      }

      // copy the manifest file to the app folder
      log.info('Copying the Firefox manifest to the app folder...');
      var manifestFilePath = path.join(platformDir, 'manifest.webapp');
      manifestTools.writeToFile(firefoxManifestInfo, manifestFilePath, function (err) {
        if (err) {
          log.error('ERROR: Failed to copy the manifest to the Firefox platform folder.');
          log.debug(err);
          return task.reject(new Error('The Firefox project could not be created successfully.'));
        }

        return task.resolve();
      });
    });
  });

  return task.promise;
};

var createCordovaApp = function (w3cManifestInfo, generatedAppDir, platforms, build) {
  var err = validateManifest(w3cManifestInfo);
  if (err) {
    return callback(err);
  }

  log.info('Generating the Cordova application...');

  var task = Q.defer();

  // path to cordova shell command
  var cordovaPath = path.resolve(__dirname, '..', 'node_modules', 'cordova', 'bin', 'cordova');

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

  // create the Cordova project
  log.info('Creating the Cordova project...');
  var cmdLine = cordovaPath + ' create cordova ' + packageName + ' ' + w3cManifestInfo.content.short_name;
  log.debug('    ' + cmdLine);
  exec(cmdLine, function (err, stdout, stderr) {

    log.debug(stdout);
    if (err) {
      log.error('ERROR: Failed to create the Cordova application.');
      log.debug(err);
      return task.reject(new Error('The Cordova project could not be created successfully.\n' + err.message));
    } else if (stderr.length) {
      log.error(stderr.trim());
    }

    // copy the manifest file to the app folder
    log.info('Copying the W3C manifest to the app folder...');
    var platformDir = path.join(generatedAppDir, 'cordova');
    var manifestFilePath = path.join(platformDir, 'manifest.json');
    manifestTools.writeToFile(w3cManifestInfo, manifestFilePath, function (err) {

      log.debug(stdout);
      if (err) {
        log.error('ERROR: Failed to copy the manifest to the app folder.');
        log.debug(err);
        return task.reject(new Error('The Cordova project could not be created successfully.'));
      }

      // set generated app's directory as current
      process.chdir(platformDir);

      // add the Hosted Web App plugin
      log.info('Adding the Hosted Web App plugin to the Cordova project...');
      cmdLine = cordovaPath + ' plugin add ' + pluginIdOrUrl;
      log.debug('    ' + cmdLine);
      exec(cmdLine, function (err, stdout, stderr) {

        log.debug(stdout);
        if (err) {
          log.error('ERROR: Failed to add the Hosted Web App plugin to the Cordova project.');
          log.debug(err);
          return task.reject(new Error('The Cordova project could not be created successfully.'));
        } else if (stderr.length) {
          log.error(stderr.trim());
        }

        // process all the specified platforms
        var pendingTasks = [];
        platforms.forEach(function (platform, index) {
          log.info('Adding Cordova platform: ' + platform + '...');

          var platformTask = new Q.defer();
          pendingTasks.push(platformTask.promise);
          cmdLine = cordovaPath + ' platform add ' + platform;
          log.debug('    ' + cmdLine);
          exec(cmdLine, function (err, stdout, stderr) {

            log.debug(stdout);
            if (err) {
              log.warn('WARNING: Failed to add ' + platform + ' platform.');
              log.debug(err);
              return platformTask.reject(err);
            } else if (stderr.length) {
              log.error(stderr.trim());
            }

            log.info('Creating shortcut for platform: ' + platform + '...');
            createPlatformShortcut(generatedAppDir, platform, function (err) {

              log.debug(stdout);
              if (err) {
                log.warn('WARNING: Failed to create shortcut for platform: ' + platform + '.');
                log.debug(err);
              }

              // build the platform-specific projects
              if (build) {
                log.info('Building Cordova platform: ' + platform + '...');
                cmdLine = cordovaPath + ' build ' + platform;
                log.debug('    ' + cmdLine);
                exec(cmdLine, function (err, stdout, stderr) {

                  log.debug(stdout);
                  if (err) {
                    log.warn('WARNING: Failed to build platform: ' + platform + '.');
                    log.debug(err);
                    return platformTask.reject(err);
                  } else if (stderr.length) {
                    log.error(stderr.trim());
                  }

                  platformTask.resolve();
                });
              } else {
                platformTask.resolve();
              }
            });
          });
        });

        Q.allSettled(pendingTasks)
          .done(function (results) {
            var err;
            if (results.some(function (platformTask) { return platformTask.state !== 'fulfilled'; })) {
              return task.reject(new Error('One or more tasks failed while generating the Cordova application.'))
            } else {
              return task.resolve();
            }
          });
      });
    });
  });

  return task.promise;
};


var createPlatformShortcut = function (projectPath, platform, callback) {
  var srcpath = path.resolve(projectPath, 'cordova', 'platforms', platform);
  var dstpath = path.resolve(projectPath, platform);
  fs.symlink(srcpath, dstpath, 'junction', function (err) {
    if (callback) {
      callback(err);
    }
  });
};


module.exports = {
  createApps: createApps,
  createChromeApp: createChromeApp,
  createFirefoxApp: createFirefoxApp,
  createCordovaApp: createCordovaApp
};
