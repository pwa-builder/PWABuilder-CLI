// ID or URL of the Hosted Web App plugin - THIS SETTING WILL NEED TO BE UPDATED IF THE PLUGIN IS RELOCATED
var pluginIdOrUrl = 'https://github.com/manifoldjs/ManifoldCordova#v0.1.0';

var manifestTools = require('./manifestTools'),
    path = require('path'),
    url = require('url'),
    execute = require('child_process').exec,
    fs = require('fs'),
    log = require('loglevel'),
    downloader = require('./projectBuilder/downloader'),
    Q = require('q'),
    mkdirp = require('mkdirp'),
    ncp = require('ncp'),
    fileUtils = require('./common/fileUtils'),
    windows10Utils = require('./platformUtils/windows10Utils'),
    validationConstants = require('./manifestTools/validationConstants');

var originalPath = process.cwd();

var exec = function (cmdLine, callback) {
  execute(cmdLine, function (err, stdout, stderr) {
    if (stdout.length) {
      log.debug(stdout);
    }
    
    if (stderr.length) {
      // replaced log.error with log.debug because Cordova writes some informational messages to stderr
      log.debug(stderr);
    }
    
    return callback && callback(err);
  });
};

var wrapError = function (msg, innerErrors) {
  var err = new Error(msg);
  
  if (innerErrors) {
    err.innerErrors = (innerErrors instanceof Array) ? innerErrors : [innerErrors];
  }
  
  return err;
};

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
    return callback && callback(err);
  });
};

var copyDocFile = function (docFilename, targetPath, callback) {
  var source = path.join(__dirname, '..', 'docs', docFilename);
  var target = path.join(targetPath, docFilename);

  log.info('Copying documentation file "' + docFilename + '" to target: ' + target + '...');

  fileUtils.copyFile(source, target, callback);
};

var copyDefaultHostedWebAppIcon = function(webAppManifest, platform, iconFilename, iconSize, targetPath, callback) {
  if (webAppManifest.icons) {
    callback(undefined);
  } else {
    log.info('Copying default icon for ' + platform + '...');
    var source = path.join(__dirname, 'projectBuilder', 'assets', platform, 'images', iconFilename);
    var target = path.join(targetPath, iconFilename);
  
    fileUtils.copyFile(source, target, function (err) {
      if (err) {
        callback(err);
      } else {
        webAppManifest.icons = {};
        webAppManifest.icons[iconSize] = iconFilename;
        callback(undefined);
      }
    });
  }
};

var copyDefaultFirefoxIcon = function (firefoxManifest, targetPath, callback) {
  copyDefaultHostedWebAppIcon(firefoxManifest, 'firefox', 'icon128.png', '128', targetPath, callback);
};

var copyDefaultChromeIcon = function (chromeManifest, targetPath, callback) {
  copyDefaultHostedWebAppIcon(chromeManifest, 'chrome', 'icon128.png', '128', targetPath, callback);
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
  log.info('Generating the Web application...');

  var task = Q.defer();

  // if the platform dir doesn't exist, create it
  var platformDir = path.join(generatedAppDir, 'web');
  mkdirp(platformDir, function (err) {
    function createDownloaderImageCallback(downloadTask, iconUrl) {
      return function (err) {
        if (err) {
          log.warn('WARNING: Failed to download icon file: ' + iconUrl);
          log.debug(err.message);
        }

        downloadTask.resolve();
      };
    }
    function createMkdirpCallback(iconUrl, iconFilePath, downloadTask) {
      return function (err) {
        if (err) {
          return task.reject(wrapError('WARNING: Failed to create the icon folder.', err));
        }

        downloader.downloadImage(iconUrl, iconFilePath, createDownloaderImageCallback(downloadTask, iconUrl));
      };
    }

    if (err && err.code !== 'EEXIST') {
      return task.reject(wrapError('ERROR: The Web project could not be created successfully.', err));
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
          return task.reject(wrapError('ERROR: Failed to copy the manifest to the Web platform folder. The Web project could not be created successfully.', err));
        }

        copyDocFile('Web-next-steps.md', platformDir, function (err) {
          if (err) {
            log.warn('WARNING: Failed to copy documentation file to the Web platform folder.');
            log.debug(err.message);
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
      return task.reject(wrapError('Failed to convert the Chrome manifest. The Chrome project could not be created successfully.', err));
    }

    // if the platform dir doesn't exist, create it
    var platformDir = path.join(generatedAppDir, 'chrome');
    mkdirp(platformDir, function (err) {
      function createDownloaderImageCallback(downloadTask, icons, size) {
        return function (err, data) {
          if (err) {
            log.warn('WARNING: Failed to download icon file: ' + icons[size]);
            log.debug(err.message);
          } else {
            var localPath = path.basename(data.path);
            icons[size] = localPath;
          }

          downloadTask.resolve();
        };
      }

      if (err && err.code !== 'EEXIST') {
        return task.reject(wrapError('ERROR: Failed to create the platform directory. The Chrome project could not be created successfully.', err));
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

      // copy the manifest assets to the app folder
      Q.allSettled(pendingDownloads)
        .done(function () {
        copyDefaultChromeIcon(chromeManifestInfo.content, platformDir, function (err) {
          if (err) {
            log.warn('WARNING: Failed to copy the default icon for Chrome.');
            log.debug(err.message);
          }          
          
          log.info('Copying the Chrome manifest to the app folder...');
          var manifestFilePath = path.join(platformDir, 'manifest.json');
          manifestTools.writeToFile(chromeManifestInfo, manifestFilePath, function (err) {
            if (err) {
              return task.reject(wrapError('ERROR: Failed to copy the manifest to the Chrome platform folder. The Chrome project could not be created successfully.', err));
            }
  
            copyDocFile('Chrome-next-steps.md', platformDir, function (err) {
              if (err) {
                log.warn('WARNING: Failed to copy documentation file to the Chrome platform folder.');
                log.debug(err.message);
              }
  
              return task.resolve();
            });
          });
        });
      });
    });
  });

  return task.promise;
};

var createFirefoxOSApp = function (w3cManifestInfo, generatedAppDir) {
  log.info('Generating the Firefox OS application...');

  var task = Q.defer();

  manifestTools.convertTo(w3cManifestInfo, 'firefox', function (err, firefoxManifestInfo) {
    if (err) {
      return task.reject(wrapError('ERROR: Failed to convert the Firefox OS manifest. The Firefox OS project could not be created successfully.', err));
    }

    // if the platform dir doesn't exist, create it
    var platformDir = path.join(generatedAppDir, 'firefox');
    mkdirp(platformDir, function (err) {
      function createDownloaderImageCallback(downloadTask, icons, size) {
        return function (err, data) {
          if (err) {
            log.warn('WARNING: Failed to download icon file: ' + icons[size]);
            log.debug(err.message);
          } else {
            var localPath = path.basename(data.path);
            icons[size] = localPath;
          }

          downloadTask.resolve();
        };
      }
      
      if (err && err.code !== 'EEXIST') {
        return task.reject(wrapError('ERROR: Failed to create the platform directory. The Firefox OS project could not be created successfully.', err));
      }
      
      // download icons to the app's folder
      var pendingDownloads = [];
      log.info('Downloading Firefox OS icons...');
      var icons = firefoxManifestInfo.content.icons;
      for (var size in icons) {
        var downloadTask = new Q.defer();
        pendingDownloads.push(downloadTask.promise);
        var iconUrl = url.resolve(w3cManifestInfo.content.start_url, icons[size]);
        var iconFileName = url.parse(icons[size]).pathname.split('/').pop();
        var iconFilePath = path.join(platformDir, iconFileName);
        downloader.downloadImage(iconUrl, iconFilePath, createDownloaderImageCallback(downloadTask, icons, size));
      }

      // copy the manifest assets to the app folder    
      Q.allSettled(pendingDownloads)
        .done(function () {
        copyDefaultFirefoxIcon(firefoxManifestInfo.content, platformDir, function (err) {
          if (err) {
            log.warn('WARNING: Failed to copy the default icon for Firefox OS.');
            log.debug(err.message);
          } 
          
          log.info('Copying the Firefox OS manifest to the app folder...');
          var manifestFilePath = path.join(platformDir, 'manifest.webapp');
          manifestTools.writeToFile(firefoxManifestInfo, manifestFilePath, function (err) {
            if (err) {
              return task.reject(wrapError('ERROR: Failed to copy the manifest to the Firefox OS platform folder. The Firefox OS project could not be created successfully.', err));
            }
    
            copyDocFile('Firefox-next-steps.md', platformDir, function (err) {
              if (err) {
                log.warn('WARNING: Failed to copy documentation file to the Firefox OS platform folder.');
                log.debug(err.message);
              }
    
              return task.resolve();
            });
          });
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
    callback);
};

var createWindows10App = function (w3cManifestInfo, generatedAppDir) {
  log.info('Generating the Windows 10 application...');

  var task = Q.defer();

  manifestTools.convertTo(w3cManifestInfo, 'windows10', function (err, windowsManifestInfo) {
    if (err) {
      return task.reject(wrapError('ERROR: Failed to convert the Windows 10 manifest. The Windows 10 project could not be created successfully.', err));
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
        return task.reject(wrapError('ERROR: Failed to create the platform directory. The Windows 10 project could not be created successfully.', err));
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
            log.warn('WARNING: Failed to download icon file: ' + icons[size].url);
            log.debug(err.message);
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
            return task.reject(wrapError('ERROR: Failed to copy the manifest to the platform folder. The Windows 10 project could not be created successfully.', err));
          }

          // If there are missing images in the manifest folder, copy the default images from the project assets
          ncp(projectAssetsImagesDir, manifestImagesDir, { clobber: false }, function (err) {
            if (err) {
              return task.reject(wrapError('ERROR: Failed to copy the default icons to the project folder. The Windows 10 project could not be created successfully.', err));
            }

            // copy project assets to the source folder
            ncp(projectAssetsDir, sourceDir, function (err) {
              if (err) {
                return task.reject(wrapError('ERROR: Failed to copy the project assets to the source folder. The Windows 10 project could not be created successfully.', err));
              }

              // Overwrite images in source folder with the manifest images
              ncp(manifestImagesDir, sourceImagesDir, { clobber: true }, function (err) {
                if (err) {
                  return task.reject(wrapError('ERROR: Failed to copy the manifest icons to the project folder. The Windows 10 project could not be created successfully.', err));
                }

                // Update project files in source dir
                updateProjectFiles(sourceDir, w3cManifestInfo.content, function (err) {
                  if (err) {
                    return task.reject(wrapError('ERROR: Failed to update Windows 10 package.appxmanifest. The Windows 10 project files could not be created successfully.', err));
                  }

                  copyDocFile('Windows10-next-steps.md', platformDir, function (err) {
                    if (err) {
                      log.warn('WARNING: Failed to copy documentation file to the Windows 10 platform folder.');
                      log.debug(err.message);
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
  log.debug('** ' + cmdLine);
  exec(cmdLine, function (err) {

    if (err) {
      return task.reject(wrapError('ERROR: Failed to create the base application. The Cordova project could not be created successfully.', err));
    }

    // copy the manifest file to the app folder
    log.info('Copying the W3C manifest to the app folder...');
    var platformDir = path.join(generatedAppDir, 'cordova');
    var manifestFilePath = path.join(platformDir, 'manifest.json');
    manifestTools.writeToFile(w3cManifestInfo, manifestFilePath, function (err) {

      if (err) {
        return task.reject(wrapError('ERROR: Failed to copy the manifest to the app folder. The Cordova project could not be created successfully.', err));
      }

      // set generated app's directory as current
      process.chdir(platformDir);

      // add the Hosted Web App plugin
      log.info('Adding the Hosted Web Application plugin to the Cordova project...');
      cmdLine = cordovaPath + ' plugin add ' + pluginIdOrUrl;
      log.debug('** ' + cmdLine);
      exec(cmdLine, function (err) {

        if (err) {
          return task.reject(wrapError('ERROR: Failed to add the Hosted Web Application plugin. The Cordova project could not be created successfully.', err));
        }
        
        var allPlatforms = platforms.map(mapToCordovaPlatform).join(' ');
        
        log.info('Adding the following Cordova platforms: ' + allPlatforms + '...');
        cmdLine = cordovaPath + ' platform add ' + allPlatforms;
        log.debug('** ' + cmdLine);
        exec(cmdLine, function (err) {
          
          if (err) {
            return task.reject(wrapError('WARNING: Failed to add the Cordova platforms: ' + allPlatforms + '.', err));
          }
          
          // customize each platform
          var pendingTasks = [];
          platforms.forEach(function (platform) {
            var platformTask = Q.defer();
            pendingTasks.push(platformTask.promise);

            var currentPlatform = mapToCordovaPlatform(platform);
            log.info('Processing Cordova platform: ' + currentPlatform + '...');

            var docTargetPath = path.join(platformDir, 'platforms', currentPlatform);
            copyDocFile(getCordovaDocFilename(platform), docTargetPath, function (err) {
              if (err) {
                log.warn('WARNING: Failed to copy documentation file to the Cordova platform folder.');
                log.debug(err.message);
              }
              
              log.info('Creating Cordova shortcut for platform: ' + currentPlatform + '...');
              createPlatformShortcut(generatedAppDir, platform, function (err) {
                if (err) {
                  log.warn('WARNING: Failed to create shortcut for Cordova platform: ' + currentPlatform + '.');
                  log.debug(err.message);
                }
                
                platformTask.resolve();
              });
            });
          });
          
          // build the projects
          if (build) {
            var buildTask = Q.defer();
            pendingTasks.push(buildTask.promise);
            log.info('Building the following Cordova platforms: ' + allPlatforms + '...');
            cmdLine = cordovaPath + ' build ' + allPlatforms;
            log.debug('** ' + cmdLine);
            exec(cmdLine, function (err) {
              if (err) {
                return buildTask.reject(wrapError('WARNING: Failed to build one or more of the Cordova platforms.', err));
              }
              
              buildTask.resolve();
            });
          }

          Q.allSettled(pendingTasks)
          .done(function (results) {
            // restore the original working directory (so that the generated folder can be deleted)
            process.chdir(originalPath);
            
            var innerErrors = results.filter(function (platformTask) {
              return platformTask.state !== 'fulfilled';
            }).map(function (platformTask) {
              return platformTask.reason;
            });
            
            if (innerErrors && innerErrors.length) {
              return task.reject(wrapError('One or more tasks failed while generating the Cordova application.', innerErrors));
            }
            
            return task.resolve();
          });
        });        
      });
    });
  });

  return task.promise;
};

var createApps = function (w3cManifestInfo, rootDir, platforms, build, callback) {
  
  var errmsg = 'One or more errors occurred when generating the application.';
  manifestTools.validateManifest(w3cManifestInfo, platforms, function (err, validationResults) {
    if (err) {
      log.error('ERROR: ' + err.message);
      return callback && callback(wrapError(errmsg, err));
    }
    
    var invalidManifest = false;
    validationResults.forEach(function (validationResult) {
      var validationMessage = validationResult.level.toUpperCase() +  ': Manifest validation ' +  ' (' + validationResult.platform + ') - ' + validationResult.description;
      if (validationResult.level === validationConstants.levels.warning) {
        log.warn(validationMessage);
      } else if (validationResult.level === validationConstants.levels.suggestion) {
        log.warn(validationMessage);
      } else if (validationResult.level === validationConstants.levels.error) {
        log.error(validationMessage);
        invalidManifest = true;
      }
    });
    
    // report manifest validation errors
    if (invalidManifest) {
      var validationError = new Error(errmsg);
      validationError.name = 'ValidationError';
      validationError.validationResults = validationResults;
      return callback && callback(validationError);
    }

    // determine the path where the Cordova app will be created
    var appName = w3cManifestInfo.content.short_name
                            .replace(/\//g,'')
                            .replace(/\s/g, '');
    var generatedAppDir = path.join(rootDir, appName);

    // create app directory
    mkdirp(generatedAppDir, function (err) {
      if (err && err.code !== 'EEXIST') {
        return callback && callback(wrapError(errmsg, err));
      }

      // process all requested platforms
      var pendingTasks = [];
      var cordovaPlatforms = [];
      platforms.forEach(function (el) {
        var platform = el.toUpperCase();
        if (platform === 'CHROME') {
          pendingTasks.push(createChromeApp(w3cManifestInfo, generatedAppDir));
        } else if (platform === 'FIREFOX') {
          pendingTasks.push(createFirefoxOSApp(w3cManifestInfo, generatedAppDir));
        } else if (platform === 'WINDOWS10') {
          pendingTasks.push(createWindows10App(w3cManifestInfo, generatedAppDir));
        } else if (platform === 'WEB') {
          pendingTasks.push(createWebApp(w3cManifestInfo, generatedAppDir));
        } else if (platform === 'WINDOWS81' || platform === 'IOS' || platform === 'ANDROID') {
          // all these platforms are handled by Cordova
          cordovaPlatforms.push(el);
        } else {
          log.warn('WARNING: Ignoring unknown platform: \'' + el + '\'.');
        }
      });

      // generate Cordova project
      if (cordovaPlatforms.length) {
        pendingTasks.push(createCordovaApp(w3cManifestInfo, generatedAppDir, cordovaPlatforms, build));
      }

      Q.allSettled(pendingTasks)
      .done(function (results) {
        // report any errors
        var innerErrors = [];
        results.forEach(function (task) {
          if (task.state !== 'fulfilled') {
            log.error(task.reason.message);
            if (task.reason.innerErrors) {
              task.reason.innerErrors.forEach(function (innerError) {
                log.debug(innerError.message);
              });
            }

            innerErrors.push(task.reason);
          }
        });
        
        return callback && callback(innerErrors.length ? wrapError(errmsg, innerErrors) : undefined);
      });
    });
  });
};

module.exports = {
  createApps: createApps
};
