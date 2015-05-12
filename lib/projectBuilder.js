// ID or URL of the Hosted Web App plugin - THIS SETTING WILL NEED TO BE UPDATED IF THE PLUGIN IS RELOCATED
var pluginIdOrUrl = 'com.manifoldjs.hostedwebapp@0.0.4';

var manifestTools = require('./manifestTools'),
    path = require('path'),
    url = require('url'),
    exec = require('child_process').exec,
    fs = require('fs'),
    log = require('loglevel'),
    downloader = require('./projectBuilder/downloader'),
    Q = require('q'),
    mkdirp = require('mkdirp'),
    ncp = require('ncp'),
    fileUtils = require('./common/fileUtils'),
    windows10Utils = require('./platformUtils/windows10Utils');

var originalPath = process.cwd();

var mapToCordovaPlatform = function (platform) {
  if (platform.toUpperCase() === 'WINDOWS81') {
    return 'windows';
  } else {
    return platform;
  }
};

var createPlatformShortcut = function (projectPath, platform, callback) {
  var srcpath = path.resolve(projectPath, 'cordova', 'platforms', mapToCordovaPlatform(platform));
  var dstpath = path.resolve(projectPath, platform);
  fs.symlink(srcpath, dstpath, 'junction', function (err) {
    if (callback) {
      callback(err);
    }
  });
};

var copyDocFile = function (docFilename, targetPath, callback) {
  var source = path.join(__dirname, '..', 'docs', docFilename);
  var target = path.join(targetPath, docFilename);

  log.info('Copying documentation file "' + docFilename + '" to target: ' + target + '...');

  fileUtils.copyFile(source, target, callback);
};

var getCordovaDocFilename = function (platform) {
  if (platform.toUpperCase() === 'WINDOWS81') {
    return 'Windows81-next-steps.md';
  } else if (platform.toUpperCase() === 'ANDROID') {
    return 'Android-next-steps.md';
  } else if (platform.toUpperCase() === 'IOS') {
    return 'Apple-next-steps.md';
  } else {
    return platform + '-next-steps.md';
  }
};

var createWebApp = function (w3cManifestInfo, generatedAppDir) {
  log.info('Generating Web application...');

  var task = Q.defer();

  // if the platform dir doesn't exist, create it
  var platformDir = path.join(generatedAppDir, 'web');
  mkdirp(platformDir, function (err) {
    function createDownloaderImageCallback(downloadTask, iconUrl) {
      return function (err) {
        if (err) {
          log.warn('WARNING: Failed to download icon file: ' + iconUrl + ' (' + err.message + ')');
          log.debug(err);
        }

        downloadTask.resolve();
      };
    }
    function createMkdirpCallback(iconUrl, iconFilePath, downloadTask) {
      return function (err) {
        if (err) {
          log.warn('WARNING: Failed to create icon folder (' + err.message + ')');
          log.debug(err);
          return task.reject(new Error('Failed to create icon folder'));
        }

        downloader.downloadImage(iconUrl, iconFilePath, createDownloaderImageCallback(downloadTask, iconUrl));
      };
    }

    if (err && err.code !== 'EEXIST') {
      log.error(err.message);
      return task.reject(new Error('The Web project could not be created successfully.'));
    }

    // download icons to the app's folder
    var pendingDownloads = [];
    log.info('Downloading icons...');
    var icons = w3cManifestInfo.content.icons;
    if (icons) {
      for (var i = 0; i < icons.length; i++) {
        var downloadTask = new Q.defer();
        var iconPath = url.parse(icons[i].src).pathname;
        pendingDownloads.push(downloadTask.promise);
        var iconUrl = url.resolve(w3cManifestInfo.content.start_url, icons[i].src);
        var iconFolder = path.join(platformDir, iconPath.replace(/[^\/]*$/, ''));
        var iconFileName = iconPath.split('/').pop();
        var iconFilePath = path.join(iconFolder, iconFileName);

        mkdirp(iconFolder, createMkdirpCallback(iconUrl, iconFilePath, downloadTask));
        icons[i].src = iconPath;
      }
    }

    // copy the manifest file to the app folder
    Q.allSettled(pendingDownloads)
    .done(function () {
      log.info('Copying the W3C manifest to the app folder...');
      var manifestFilePath = path.join(platformDir, 'manifest.json');

      manifestTools.writeToFile(w3cManifestInfo, manifestFilePath, function (err) {
        if (err) {
          log.error('ERROR: Failed to copy the manifest to the Web platform folder.');
          log.debug(err);
          return task.reject(new Error('The Web project could not be created successfully.'));
        }

        copyDocFile('Web-next-steps.md', platformDir, function (err) {
          if (err) {
            log.error('WARNING: Failed to copy documentation file to the Web platform folder.');
            log.debug(err);
          }

          return task.resolve();
        });
      });
    });
  });

  return task.promise;
};

var createChromeApp = function (w3cManifestInfo, generatedAppDir) {
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
      function createDownloaderImageCallback(downloadTask, icons, size) {
        return function (err, data) {
          if (err) {
            log.warn('WARNING: Failed to download icon file: ' + icons[size] + ' (' + err.message + ')');
            log.debug(err);
          } else {
            var localPath = path.basename(data.path);
            icons[size] = localPath;
          }

          downloadTask.resolve();
        };
      }

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
        var iconFileName = url.parse(icons[size]).pathname.split('/').pop();
        var iconFilePath = path.join(platformDir, iconFileName);
        downloader.downloadImage(iconUrl, iconFilePath, createDownloaderImageCallback(downloadTask, icons, size));
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

          copyDocFile('Chrome-next-steps.md', platformDir, function (err) {
            if (err) {
              log.error('WARNING: Failed to copy documentation file to the Chrome platform folder.');
              log.debug(err);
            }

            return task.resolve();
          });
        });
      });
    });
  });

  return task.promise;
};

var createFirefoxApp = function (w3cManifestInfo, generatedAppDir) {
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

        copyDocFile('Firefox-next-steps.md', platformDir, function (err) {
          if (err) {
            log.error('WARNING: Failed to copy documentation file to the Firefox platform folder.');
            log.debug(err);
          }

          return task.resolve();
        });
      });
    });
  });

  return task.promise;
};

var updateProjectFiles = function (sourceDir, w3cManifest, callback) {
  var packageManifestPath = path.join(sourceDir, 'package.appxmanifest');
  fileUtils.replaceFileContent(packageManifestPath,
    function (data) {
      return windows10Utils.replaceManifestValues(w3cManifest, data);
  },
    function (err) {
    if (err) {
      log.warn('WARNING: Failed replace values of package.appxmanifest');
      log.debug(err);
      return callback(err);
    }

    callback();
  });
};

var createWindows10App = function (w3cManifestInfo, generatedAppDir) {
  log.info('Generating the Windows 10 application...');

  var task = Q.defer();

  manifestTools.convertTo(w3cManifestInfo, 'windows10', function (err, windowsManifestInfo) {
    if (err) {
      log.error(err.message);
      return task.reject(new Error('The Windows 10 project could not be created successfully.'));
    }

    var platformDir = path.join(generatedAppDir, 'windows10');
    var manifestDir = path.join(platformDir, 'manifest');
    var manifestImagesDir = path.join(manifestDir, 'images');
    var sourceDir = path.join(platformDir, 'source');
    var sourceImagesDir = path.join(sourceDir, 'images');
    var projectAssetsDir = path.join(__dirname, 'projectBuilder', 'assets', 'windows10');
    var projectAssetsImagesDir = path.join(projectAssetsDir, 'images');

    // if the manifest images folder doesn't exist, create it
    mkdirp(manifestImagesDir, function (err) {
      if (err && err.code !== 'EEXIST') {
        log.error(err.message);
        return task.reject(new Error('The Windows 10 project could not be created successfully.'));
      }

      // download icons to the app's folder
      var pendingDownloads = [];
      log.info('Downloading Windows 10 icons...');
      var icons = windowsManifestInfo.content.icons;

      function downloadIcon(size) {
        var downloadTask = new Q.defer();
        pendingDownloads.push(downloadTask.promise);
        var iconUrl = url.resolve(w3cManifestInfo.content.start_url, icons[size].url);
        var iconFilePath = path.join(manifestImagesDir, icons[size].fileName);
        downloader.downloadImage(iconUrl, iconFilePath, createDownloaderImageCallback(downloadTask, icons, size));
      }

      function createDownloaderImageCallback(downloadTask, icons, size) {
        return function (err) {
          if (err) {
            log.warn('WARNING: Failed to download icon file: ' + icons[size].url + ' (' + err.message + ')');
            log.debug(err);
          }

          downloadTask.resolve();
        };
      }

      for (var size in icons) {
        downloadIcon(size);
      }

      Q.allSettled(pendingDownloads)
      .done(function () {
        // copy the manifest file to the app folder
        log.info('Copying the Windows 10 manifest to the app folder...');
        var manifestFilePath = path.join(manifestDir, 'appxmanifest.xml');
        fs.writeFile(manifestFilePath, windowsManifestInfo.content.rawData, function (err) {
          if (err) {
            log.error('ERROR: Failed to copy the manifest to the Windows 10 platform folder.');
            log.debug(err);
            return task.reject(new Error('The Windows 10 project could not be created successfully.'));
          }

          // If there are missing images in the manifest folder, copy the default images from the project assets
          ncp(projectAssetsImagesDir, manifestImagesDir, { clobber: false }, function (err) {
            if (err) {
              log.error(err.message);
              return task.reject(new Error('The Windows 10 project could not be created successfully.'));
            }

            // copy project assets to the source folder
            ncp(projectAssetsDir, sourceDir, function (err) {
              if (err) {
                log.error(err.message);
                return task.reject(new Error('The Windows 10 project could not be created successfully.'));
              }

              // Overwrite images in source folder with the manifest images
              ncp(manifestImagesDir, sourceImagesDir, { clobber: true }, function (err) {
                if (err) {
                  log.error(err.message);
                  return task.reject(new Error('The Windows 10 project could not be created successfully.'));
                }

                // Update project files in source dir
                updateProjectFiles(sourceDir, w3cManifestInfo.content, function () {
                  if (err) {
                    log.error(err.message);
                    return task.reject(new Error('The project files could not be updated.'));
                  }

                  copyDocFile('Windows10-next-steps.md', platformDir, function (err) {
                    if (err) {
                      log.error('WARNING: Failed to copy documentation file to the Web platform folder.');
                      log.debug(err);
                    }

                    return task.resolve();
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  return task.promise;
};

var applyPlatformsFix = function (platform, platformDir, callback) {
  if (platform === 'android') {
    log.info('Applying fix for Android...');

    var assetsBasePath = path.join(__dirname, 'projectBuilder', 'assets', 'android');
    var targetBasePath = path.join(platformDir, 'platforms', 'android');

    var fixedBuildGradleFilePath = path.join(assetsBasePath, 'build.gradle');
    var buildGradleFilePath = path.join(targetBasePath, 'build.gradle');

    fileUtils.copyFile(fixedBuildGradleFilePath, buildGradleFilePath, function (err) {
      if (err) {
        return callback(err);
      }

      var settingsGradleFilePath = path.join(assetsBasePath, 'settings.gradle');
      var targetSettingsGradleFilePath = path.join(targetBasePath, 'settings.gradle');

      fileUtils.copyFile(settingsGradleFilePath, targetSettingsGradleFilePath, callback);
    });
  } else {
    callback();
  }
};

var createCordovaApp = function (w3cManifestInfo, generatedAppDir, platforms, build) {
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

  var cordovaAppName = w3cManifestInfo.content.short_name
                          .replace(/\//g,'')
                          .replace(/\s/g, '');

  // create the Cordova project
  log.info('Creating the Cordova project...');
  var cmdLine = cordovaPath + ' create cordova ' + packageName + ' ' + cordovaAppName;
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
        platforms.forEach(function (platform) {
          log.info('Adding Cordova platform: ' + mapToCordovaPlatform(platform) + '...');

          var platformTask = new Q.defer();
          pendingTasks.push(platformTask.promise);
          cmdLine = cordovaPath + ' platform add ' + mapToCordovaPlatform(platform);
          log.debug('    ' + cmdLine);
          exec(cmdLine, function (err, stdout, stderr) {

            log.debug(stdout);
            if (err) {
              log.warn('WARNING: Failed to add ' + mapToCordovaPlatform(platform) + ' platform.');
              log.debug(err);
              return platformTask.reject(err);
            } else if (stderr.length) {
              log.error(stderr.trim());
            }

            applyPlatformsFix(platform, platformDir, function (err) {
              if (err) {
                log.warn('WARNING: Failed to apply platform fix: ' + mapToCordovaPlatform(platform) + '.');
                log.debug(err);
                return platformTask.reject(err);
              } else if (stderr.length) {
                log.error(stderr.trim());
              }

              var docTargetPath = path.join(platformDir, 'platforms', mapToCordovaPlatform(platform));

              copyDocFile(getCordovaDocFilename(platform), docTargetPath, function (err) {
                if (err) {
                  log.error('WARNING: Failed to copy documentation file to the Web platform folder.');
                  log.debug(err);
                }

                log.info('Creating Cordova shortcut for platform: ' + mapToCordovaPlatform(platform) + '...');
                createPlatformShortcut(generatedAppDir, platform, function (err) {

                  log.debug(stdout);
                  if (err) {
                  log.warn('WARNING: Failed to create shortcut for  Cordova platform: ' + mapToCordovaPlatform(platform) + '.');
                    log.debug(err);
                  }

                  // build the platform-specific projects
                  if (build) {
                  log.info('Building Cordova platform: ' + mapToCordovaPlatform(platform) + '...');
                    cmdLine = cordovaPath + ' build ' + mapToCordovaPlatform(platform);
                    log.debug('    ' + cmdLine);
                    exec(cmdLine, function (err, stdout, stderr) {
                      // set original working directory as current (so that the generated folder can be deleted)
                      process.chdir(originalPath);

                      log.debug(stdout);
                      if (err) {
                      log.warn('WARNING: Failed to build Cordova platform: ' + mapToCordovaPlatform(platform) + '.');
                        log.debug(err);
                        return platformTask.reject(err);
                      } else if (stderr.length) {
                        log.error(stderr.trim());
                      }

                      platformTask.resolve();
                    });
                  } else {
                    // set original working directory as current (so that the generated folder can be deleted)
                    process.chdir(originalPath);

                    platformTask.resolve();
                  }
                });
              });
            });
          });
        });

        Q.allSettled(pendingTasks)
          .done(function (results) {
          if (results.some(function (platformTask) { return platformTask.state !== 'fulfilled'; })) {
            return task.reject(new Error('One or more tasks failed while generating the Cordova application.'));
          } else {
            return task.resolve();
          }
        });
      });
    });
  });

  return task.promise;
};

var createApps = function (w3cManifestInfo, rootDir, platforms, build, callback) {

  // determine the path where the Cordova app will be created
  var appName = w3cManifestInfo.content.short_name
                          .replace(/\//g,'')
                          .replace(/\s/g, '');
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
        pendingTasks.push(createChromeApp(w3cManifestInfo, generatedAppDir));
      } else if (platform === 'FIREFOX') {
        pendingTasks.push(createFirefoxApp(w3cManifestInfo, generatedAppDir));
      } else if (platform === 'WINDOWS10') {
        pendingTasks.push(createWindows10App(w3cManifestInfo, generatedAppDir));
      } else if (platform === 'WEB') {
        pendingTasks.push(createWebApp(w3cManifestInfo, generatedAppDir));
      } else if (platform === 'WINDOWS81' || platform === 'IOS' || platform === 'ANDROID') {
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

module.exports = {
  createApps: createApps,
  createChromeApp: createChromeApp,
  createFirefoxApp: createFirefoxApp,
  createWindows10App: createWindows10App,
  createWebApp: createWebApp,
  createCordovaApp: createCordovaApp,
};
