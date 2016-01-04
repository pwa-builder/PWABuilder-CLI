'use strict';

var path = require('path'),
    Q = require('q');

var manifoldjsLib = require('manifoldjs-lib');

var PlatformBase = manifoldjsLib.PlatformBase,
    manifestTools = manifoldjsLib.manifestTools,
    CustomError = manifoldjsLib.CustomError,
    log = manifoldjsLib.log,
    fileTools = manifoldjsLib.fileTools,
    iconTools = manifoldjsLib.iconTools;

var constants = require('./constants'),
    manifest = require('./manifest');

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
    
function Platform(packageName, platforms) {

  var self = this;
  Object.assign(this, PlatformBase.prototype);
  PlatformBase.apply(this, [constants.platform.id, constants.platform.name, packageName, __dirname]);

  // save platform list
  self.platforms = platforms;

  // override create function
  self.create = function (w3cManifestInfo, rootDir, options, callback) {

    self.info('Generating the ' + constants.platform.name + ' app...')
    
    var platformDir = path.join(rootDir, constants.platform.id);
    
    // convert the W3C manifest to a platform-specific manifest
    var platformManifestInfo;
    return manifest.convertFromBase(w3cManifestInfo)
      // if the platform dir doesn't exist, create it
      .then(function (manifestInfo) {
        platformManifestInfo = manifestInfo;         
        self.debug('Creating the ' + constants.platform.name + ' app folder...');
        return fileTools.mkdirp(platformDir);
      })
      // download icons to the app's folder
      .then(function () {
        self.debug('Downloading the ' + constants.platform.name + ' icons...');
        var icons = platformManifestInfo.content.icons;
        
        // TODO: verify if using all instead of allSettled is correct
        return Q.all(Object.keys(icons).map(function (size) {
          var iconPath = icons[size];
          return iconTools.getIcon(iconPath, w3cManifestInfo.content.start_url, platformDir);          
        }));
      })
      // copy default platform icon
      .then(function () {
        return self.copyDefaultPlatformIcon(platformManifestInfo, '128', platformDir)
      })
      // copy the documentation file
      .then(function () {
        return self.copyDocumentationFile('Firefox-next-steps.md', platformDir);
      })      
      // create generation info
      .then(function () {
        return self.createGenerationInfo(platformDir);
      })
      // persist the platform-specific manifest
      .then(function () {
        self.debug('Copying the ' + constants.platform.name + ' manifest to the app folder...');        
        var manifestFilePath = path.join(platformDir, 'manifest.json');
        return manifestTools.writeToFile(platformManifestInfo, manifestFilePath);
      })
      .then(function () {
        self.info('Created the ' + constants.platform.name + ' app!');        
      })
      .catch(function (err) {
        return Q.reject(new CustomError('The ' + constants.platform.name + ' app could not be created successfully.', err));        
      })
      .nodeify(callback);
  };
}

module.exports = Platform;
