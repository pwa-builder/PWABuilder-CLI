// ID or URL of the Hosted Web App plugin - THIS SETTING WILL NEED TO BE UPDATED IF THE PLUGIN IS RELOCATED
var pluginIdOrUrl = 'cordova-plugin-hostedwebapp@">=0.2.0 <0.3.0"';

var manifestTools = require('./manifestTools'),
    path = require('path'),
    url = require('url'),
    execute = require('child_process').exec,
    fs = require('fs'),
    log = require('./log'),
    downloader = require('./download'),
    Q = require('q'),
    _mkdirp = require('mkdirp'),
    ncp = require('ncp'),
    fileTools = require('./fileTools'),
    utils = require('./utils'),
// TODO: temporarily remove to avoid cyclic reference
    // windows10Utils = require('manifoldjs-windows10').windows10Utils,
    validationConstants = require('./constants').validation,
    packageTools = require('./packageTools'),
    platformTools = require('./platformTools');

var originalPath = process.cwd();

var mkdirp = function (filePath, callback) {
  var fullPath = path.resolve(filePath);
  var rootPath = path.parse(fullPath).root;
  fs.stat(rootPath, function (err) {
    if (err) {
      return callback(err);
    }

    _mkdirp(filePath, callback);
  });
};

var exec = function (cmdLine, callback) {
  execute(cmdLine, { maxBuffer: 1024*1024 }, function (err, stdout, stderr) {
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

var createCordovaPlatformShortcut = function (projectPath, platform, callback) {
  if (platform.toUpperCase() !== 'WINDOWS') {
    log.info('Creating Cordova shortcut for platform: ' + platform + '...');
    var srcpath = path.resolve(projectPath, 'cordova', 'platforms', platform);
    var dstpath = path.resolve(projectPath, platform);
    fs.symlink(srcpath, dstpath, 'junction', function (err) {
      return callback && callback(err);
    });
  } else {
      return callback && callback(undefined);
  }
};

var copyDocFile = function (docFilename, targetPath, callback) {
  var source = path.join(__dirname, '..', 'docs', docFilename);
  var target = path.join(targetPath, docFilename);

  log.info('Copying documentation file "' + docFilename + '" to target: ' + target + '...');

  fileTools.copyFile(source, target, callback);
};

var copyOfflineFile = function (docFilename, targetPath, callback) {
  var source = path.join(__dirname, 'manifestTools', 'assets', 'windows10', docFilename);
  var target = path.join(targetPath, docFilename);

  log.info('Copying offline file "' + docFilename + '" to target: ' + target + '...');

  fileTools.copyFile(source, target, callback);
};


var createGenerationInfoFile = function (targetPath, callback) {
  var generationInfoFilePath = path.join(targetPath, 'generationInfo.json');
  var generationInfo = {
    'manifoldJSVersion': packageTools.getCurrentPackageVersion()
  };

  log.info('Creating generation info file: ' + generationInfoFilePath + '...');
  fs.writeFile(generationInfoFilePath, JSON.stringify(generationInfo, null, 4), function (err) {
    if (err) {
      callback(err);
    } else {
      callback(undefined);
    }
  });
};

var copyDefaultHostedWebAppIcon = function(webAppManifest, platform, iconFilename, iconSize, targetPath, callback) {
  if (webAppManifest.icons) {
    callback(undefined);
  } else {
    log.info('Copying default icon for ' + platform + '...');
    var source = path.join(__dirname, 'projectBuilder', 'assets', platform, 'images', iconFilename);
    var target = path.join(targetPath, iconFilename);

    fileTools.copyFile(source, target, function (err) {
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
  if (platform.toUpperCase() === 'WINDOWS') {
    return 'WindowsCordova-next-steps.md';
  } else if (platform.toUpperCase() === 'ANDROID') {
    return 'Android-next-steps.md';
  } else if (platform.toUpperCase() === 'IOS') {
    return 'Apple-next-steps.md';
  } else {
    return platform + '-next-steps.md';
  }
};

// var createWebApp = function (w3cManifestInfo, generatedAppDir /*, options*/) {
//   log.info('Generating the Web application...');
// 
//   var task = Q.defer();
// 
//   // if the platform dir doesn't exist, create it
//   var platformDir = path.join(generatedAppDir, 'web');
//   mkdirp(platformDir, function (err) {
//     function createDownloaderImageCallback(downloadTask, iconUrl) {
//       return function (err) {
//         if (err) {
//           log.warn('WARNING: Failed to download icon file: ' + iconUrl);
//           log.debug(err.message);
//         }
// 
//         downloadTask.resolve();
//       };
//     }
//     function createMkdirpCallback(iconUrl, iconFilePath, downloadTask) {
//       return function (err) {
//         if (err) {
//           return task.reject(wrapError('WARNING: Failed to create the icon folder.', err));
//         }
// 
//         downloader.downloadImage(iconUrl, iconFilePath, createDownloaderImageCallback(downloadTask, iconUrl));
//       };
//     }
// 
//     if (err && err.code !== 'EEXIST') {
//       return task.reject(wrapError('ERROR: The Web project could not be created successfully.', err));
//     }
// 
//     // download icons to the app's folder
//     var pendingDownloads = [];
//     log.info('Downloading icons...');
//     var icons = w3cManifestInfo.content.icons;
//     if (icons) {
//       for (var i = 0; i < icons.length; i++) {
//         var downloadTask = new Q.defer();
//         var iconPath = url.parse(icons[i].src).pathname;
//         pendingDownloads.push(downloadTask.promise);
//         var iconUrl = url.resolve(w3cManifestInfo.content.start_url, icons[i].src);
//         var iconFolder = path.join(platformDir, iconPath.replace(/[^\/]*$/, ''));
//         var iconFileName = iconPath.split('/').pop();
//         var iconFilePath = path.join(iconFolder, iconFileName);
// 
//         mkdirp(iconFolder, createMkdirpCallback(iconUrl, iconFilePath, downloadTask));
//         icons[i].src = iconPath;
//       }
//     }
// 
//     // copy the manifest file to the app folder
//     Q.allSettled(pendingDownloads)
//     .done(function () {
//       log.info('Copying the W3C manifest to the app folder...');
//       var manifestFilePath = path.join(platformDir, 'manifest.json');
// 
//       manifestTools.writeToFile(w3cManifestInfo, manifestFilePath, function (err) {
//         if (err) {
//           return task.reject(wrapError('ERROR: Failed to copy the manifest to the Web platform folder. The Web project could not be created successfully.', err));
//         }
// 
//         copyDocFile('Web-next-steps.md', platformDir, function (err) {
//           if (err) {
//             log.warn('WARNING: Failed to copy documentation file to the Web platform folder.');
//             log.debug(err.message);
//           }
// 
//           createGenerationInfoFile(platformDir, function (err) {
//             if (err) {
//               log.warn('WARNING: Failed to create generation info file for Web platform.');
//               log.debug(err.message);
//             }
// 
//             return task.resolve();
//           });
//         });
//       });
//     });
//   });
// 
//   return task.promise;
// };

// var createChromeApp = function (w3cManifestInfo, generatedAppDir /*, options*/) {
//   log.info('Generating the Chrome application...');
// 
//   var task = Q.defer();
// 
//   manifestTools.convertTo(w3cManifestInfo, 'chromeOS', function (err, chromeManifestInfo) {
// 
//     if (err) {
//       return task.reject(wrapError('Failed to convert the Chrome manifest. The Chrome project could not be created successfully.', err));
//     }
// 
//     // if the platform dir doesn't exist, create it
//     var platformDir = path.join(generatedAppDir, 'chrome');
//     mkdirp(platformDir, function (err) {
//       function createIconDownloadTask(icons, size) {
//         var downloadTask = new Q.defer();
//         var iconUrl = url.resolve(w3cManifestInfo.content.start_url, icons[size]);
//         var iconPath = url.parse(icons[size]).pathname;
//         var iconFilePath = path.join(platformDir, icons[size]);
//         var iconFolder = path.join(platformDir, iconPath.replace(/[^\/]*$/, ''));
//         mkdirp(iconFolder, function (err) {
//           if (err) {
//             log.warn('WARNING: Failed to create folder for icon files: ' + iconFolder);
//             log.debug(err.message);
//             return downloadTask.resolve();
//           }
// 
//           downloader.downloadImage(iconUrl, iconFilePath, function (err) {
//             if (err) {
//               log.warn('WARNING: Failed to download icon file: ' + icons[size]);
//               log.debug(err.message);
//             } else {
//               icons[size] = iconPath;
//             }
//             
//             downloadTask.resolve();
//           });
//         });
// 
//         return downloadTask.promise;
//       }
// 
//       if (err && err.code !== 'EEXIST') {
//         return task.reject(wrapError('ERROR: Failed to create the platform directory. The Chrome project could not be created successfully.', err));
//       }
// 
//       // download icons to the app's folder
//       var pendingDownloads = [];
//       log.info('Downloading Chrome icons...');
//       var icons = chromeManifestInfo.content.icons;
//       for (var size in icons) {
//         pendingDownloads.push(createIconDownloadTask(icons, size));
//       }
// 
//       // copy the manifest assets to the app folder
//       Q.allSettled(pendingDownloads)
//       .done(function () {
//         copyDefaultChromeIcon(chromeManifestInfo.content, platformDir, function (err) {
//           if (err) {
//             log.warn('WARNING: Failed to copy the default icon for Chrome.');
//             log.debug(err.message);
//           }
// 
//           log.info('Copying the Chrome manifest to the app folder...');
//           var manifestFilePath = path.join(platformDir, 'manifest.json');
//           manifestTools.writeToFile(chromeManifestInfo, manifestFilePath, function (err) {
//             if (err) {
//               return task.reject(wrapError('ERROR: Failed to copy the manifest to the Chrome platform folder. The Chrome project could not be created successfully.', err));
//             }
// 
//             copyDocFile('Chrome-next-steps.md', platformDir, function (err) {
//               if (err) {
//                 log.warn('WARNING: Failed to copy documentation file to the Chrome platform folder.');
//                 log.debug(err.message);
//               }
// 
//               createGenerationInfoFile(platformDir, function (err) {
//                 if (err) {
//                   log.warn('WARNING: Failed to create generation info file for Chrome platform.');
//                   log.debug(err.message);
//                 }
// 
//                 return task.resolve();
//               });
//             });
//           });
//         });
//       });
//     });
//   });
// 
//   return task.promise;
// };

// var createFirefoxOSApp = function (w3cManifestInfo, generatedAppDir /*, options*/) {
//   log.info('Generating the Firefox OS application...');
// 
//   var task = Q.defer();
// 
//   manifestTools.convertTo(w3cManifestInfo, 'firefox', function (err, firefoxManifestInfo) {
//     if (err) {
//       return task.reject(wrapError('ERROR: Failed to convert the Firefox OS manifest. The Firefox OS project could not be created successfully.', err));
//     }
// 
//     // if the platform dir doesn't exist, create it
//     var platformDir = path.join(generatedAppDir, 'firefox');
//     mkdirp(platformDir, function (err) {
//       function createDownloaderImageCallback(downloadTask, icons, size) {
//         return function (err, data) {
//           if (err) {
//             log.warn('WARNING: Failed to download icon file: ' + icons[size]);
//             log.debug(err.message);
//           } else {
//             var localPath = path.basename(data.path);
//             icons[size] = localPath;
//           }
// 
//           downloadTask.resolve();
//         };
//       }
// 
//       if (err && err.code !== 'EEXIST') {
//         return task.reject(wrapError('ERROR: Failed to create the platform directory. The Firefox OS project could not be created successfully.', err));
//       }
// 
//       // download icons to the app's folder
//       var pendingDownloads = [];
//       log.info('Downloading Firefox OS icons...');
//       var icons = firefoxManifestInfo.content.icons;
//       for (var size in icons) {
//         var downloadTask = new Q.defer();
//         pendingDownloads.push(downloadTask.promise);
//         var iconUrl = url.resolve(w3cManifestInfo.content.start_url, icons[size]);
//         var iconFileName = url.parse(icons[size]).pathname.split('/').pop();
//         var iconFilePath = path.join(platformDir, iconFileName);
//         downloader.downloadImage(iconUrl, iconFilePath, createDownloaderImageCallback(downloadTask, icons, size));
//       }
// 
//       // copy the manifest assets to the app folder
//       Q.allSettled(pendingDownloads)
//         .done(function () {
//         copyDefaultFirefoxIcon(firefoxManifestInfo.content, platformDir, function (err) {
//           if (err) {
//             log.warn('WARNING: Failed to copy the default icon for Firefox OS.');
//             log.debug(err.message);
//           }
// 
//           log.info('Copying the Firefox OS manifest to the app folder...');
//           var manifestFilePath = path.join(platformDir, 'manifest.webapp');
//           manifestTools.writeToFile(firefoxManifestInfo, manifestFilePath, function (err) {
//             if (err) {
//               return task.reject(wrapError('ERROR: Failed to copy the manifest to the Firefox OS platform folder. The Firefox OS project could not be created successfully.', err));
//             }
// 
//             copyDocFile('Firefox-next-steps.md', platformDir, function (err) {
//               if (err) {
//                 log.warn('WARNING: Failed to copy documentation file to the Firefox OS platform folder.');
//                 log.debug(err.message);
//               }
// 
//               createGenerationInfoFile(platformDir, function (err) {
//                 if (err) {
//                   log.warn('WARNING: Failed to create generation info file for Firefox OS platform.');
//                   log.debug(err.message);
//                 }
// 
//                 return task.resolve();
//               });
//             });
//           });
//         });
//       });
//     });
//   });
// 
//   return task.promise;
// };

var updateProjectFiles = function (sourceDir, w3cManifestInfo, callback) {
  var packageManifestPath = path.join(sourceDir, 'package.appxmanifest');
  fileTools.replaceFileContent(packageManifestPath,
    function (data) {
      // TODO: temporarily disable to avoid cyclic reference
      throw new Error('THIS NEEDS TO BE REVIEWED!!!');
      // return windows10Utils.replaceManifestValues(w3cManifestInfo, data);
    },
    callback);
};

var createWindows10App = function (w3cManifestInfo, generatedAppDir /*, options*/) {
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
                updateProjectFiles(sourceDir, w3cManifestInfo, function (err) {
                  if (err) {
                    return task.reject(wrapError('ERROR: Failed to update Windows 10 package.appxmanifest. The Windows 10 project files could not be created successfully.', err));
                  }


 
                // move offline file into win10 dir
                copyOfflineFile('msapp-error.html', manifestDir, function (err) {
                  if (err) {
                    return task.reject(wrapError('ERROR: Failed to update Windows 10 package with offline file. The Windows 10 project files could not be created successfully.', err));
                  }
                // move offline file into win10 source dir
                copyOfflineFile('msapp-error.html', sourceDir, function (err) {
                  if (err) {
                    return task.reject(wrapError('ERROR: Failed to update Windows 10 package with offline file. The Windows 10 project files could not be created successfully.', err));
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
    });
  });

  return task.promise;
};

// var createCordovaApp = function (w3cManifestInfo, generatedAppDir, platforms, options) {
//   log.info('Generating the Cordova application...');
// 
//   var task = Q.defer();
// 
//   // path to cordova shell command
//   var appDir = path.dirname(require.main.filename);
//   var cordovaPath = path.resolve(appDir, 'node_modules', 'cordova', 'bin', 'cordova');
// 
//   // go to the directory where the app will be created
//   process.chdir(generatedAppDir);
// 
//   // generate a reverse-domain-style package name from the manifest's start_url
//   var packageName = '';
//   url.parse(w3cManifestInfo.content.start_url)
//             .hostname
//             .replace(/-/g, '')
//             .split('.')
//             .map(function (segment) {
//     // BUG:  Issue 149 aparently "in" is a reserved word for andorid package names
//     if(segment === 'in'){ 
//       segment = segment.replace('in', 'ind');
//       }
//     packageName = segment + (packageName ? '.' : '') + packageName;
//   });
// 
//   var cordovaAppName = utils.sanitizeName(w3cManifestInfo.content.short_name);
//   packageName = utils.sanitizeName(packageName);
// 
//   // create the Cordova project
//   log.info('Creating the Cordova project...');
//   var cmdLine = '"' + cordovaPath + '" create cordova ' + packageName + ' ' + cordovaAppName;
//   log.debug('** ' + cmdLine);
//   exec(cmdLine, function (err) {
// 
//     if (err) {
//       return task.reject(wrapError('ERROR: Failed to create the base application. The Cordova project could not be created successfully.', err));
//     }
// 
//     // copy the manifest file to the app folder
//     log.info('Copying the W3C manifest to the app folder...');
//     var platformDir = path.join(generatedAppDir, 'cordova');
//     var manifestFilePath = path.join(platformDir, 'manifest.json');
//     manifestTools.writeToFile(w3cManifestInfo, manifestFilePath, function (err) {
// 
//       if (err) {
//         return task.reject(wrapError('ERROR: Failed to copy the manifest to the app folder. The Cordova project could not be created successfully.', err));
//       }
// 
//       createGenerationInfoFile(platformDir, function (err) {
//         if (err) {
//           log.warn('WARNING: Failed to create generation info file in the Cordova\'s root folder.');
//           log.debug(err.message);
//         }
// 
//         // set generated app's directory as current
//         process.chdir(platformDir);
// 
//         // add the Hosted Web App plugin
//         log.info('Adding the Hosted Web Application plugin to the Cordova project...');
//         cmdLine = '"' + cordovaPath + '" plugin add ' + pluginIdOrUrl;
//         if (options.crosswalk) {
//           cmdLine += ' cordova-plugin-crosswalk-webview';
//         }
// 
//         if (options.webAppToolkit) {
//           cmdLine += ' cordova-plugin-webapptoolkit';
//           log.warn('\n*******************************************************************************');
//           log.warn('The WAT plugin requires you to perform manual steps before running the app');
//           log.warn('Follow the steps described here: https://github.com/manifoldjs/Web-App-ToolKit');
//           log.warn('*******************************************************************************\n');
//         }
// 
//         // Fixes an issue in Cordova that requires a version of cordova-ios that is not released yet
//         // and stops automated plugin installations - see https://issues.apache.org/jira/browse/CB-9232
//         // and https://issues.apache.org/jira/browse/CB-916) - Needs to be removed once a fix is released!!!!
//         cmdLine += ' cordova-plugin-whitelist@1.0.0';
// 
//         log.debug('** ' + cmdLine);
//         exec(cmdLine, function (err) {
// 
//           if (err) {
//             return task.reject(wrapError('ERROR: Failed to add the Hosted Web Application plugin. The Cordova project could not be created successfully.', err));
//           }
// 
//           var allPlatforms = platforms.join(' ');
// 
//           log.info('Adding the following Cordova platforms: ' + allPlatforms + '...');
//           cmdLine = '"' + cordovaPath + '" platform add ' + allPlatforms;
//           log.debug('** ' + cmdLine);
//           exec(cmdLine, function (err) {
// 
//             if (err) {
//               return task.reject(wrapError('WARNING: Failed to add the Cordova platforms: ' + allPlatforms + '.', err));
//             }
// 
//             // customize each platform
//             var pendingTasks = [];
//             platforms.forEach(function (platform) {
//               var platformTask = Q.defer();
//               pendingTasks.push(platformTask.promise);
// 
//               log.info('Processing Cordova platform: ' + platform + '...');
// 
//               var cordovaPlatformPath = path.join(platformDir, 'platforms', platform);
// 
//               copyDocFile(getCordovaDocFilename(platform), cordovaPlatformPath, function (err) {
//                 if (err) {
//                   log.warn('WARNING: Failed to copy documentation file to the Cordova platform folder.');
//                   log.debug(err.message);
//                 }
// 
//                 createCordovaPlatformShortcut(generatedAppDir, platform, function (err) {
//                   if (err) {
//                     log.warn('WARNING: Failed to create shortcut for Cordova platform: ' + platform + '.');
//                     log.debug(err.message);
//                   }
// 
//                   createGenerationInfoFile(cordovaPlatformPath, function (err) {
//                     if (err) {
//                       log.warn('WARNING: Failed to create generation info file for Cordova platform: ' + platform + '.');
//                       log.debug(err.message);
//                     }
// 
//                     platformTask.resolve();
//                   });
//                 });
//               });
//             });
// 
//             // build the projects
//             if (options.build) {
//               var buildTask = Q.defer();
//               pendingTasks.push(buildTask.promise);
//               log.info('Building the following Cordova platforms: ' + allPlatforms + '...');
//               cmdLine = '"' + cordovaPath + '" build ' + allPlatforms;
//               log.debug('** ' + cmdLine);
//               exec(cmdLine, function (err) {
//                 if (err) {
//                   return buildTask.reject(wrapError('WARNING: Failed to build one or more of the Cordova platforms.', err));
//                 }
// 
//                 buildTask.resolve();
//               });
//             }
// 
//             Q.allSettled(pendingTasks)
//             .done(function (results) {
//               // restore the original working directory (so that the generated folder can be deleted)
//               process.chdir(originalPath);
// 
//               var innerErrors = results.filter(function (platformTask) {
//                 return platformTask.state !== 'fulfilled';
//               }).map(function (platformTask) {
//                 return platformTask.reason;
//               });
// 
//               if (innerErrors && innerErrors.length) {
//                 return task.reject(wrapError('One or more tasks failed while generating the Cordova application.', innerErrors));
//               }
// 
//               return task.resolve();
//             });
//           });
//         });
//       });
//     });
//   });
// 
//   return task.promise;
// };

var platformModules;

var createApps = function (w3cManifestInfo, rootDir, platforms, options, callback) {

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
		// create apps for each platform
		var tasks = platformModules.map(function (platform) {
			if (!platform) {
				return Q.resolve();
			};
						
			log.debug('Creating app for platform \'' + platform.name + '\'...');
			return Q.nfcall(platform.create, w3cManifestInfo, rootDir, options)
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

module.exports = {
  createApps: createApps
};
