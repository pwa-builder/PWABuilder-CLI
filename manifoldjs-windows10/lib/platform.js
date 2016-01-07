'use strict';

var fs = require('fs'),
    path = require('path'),
    url = require('url'),
    Q = require('q');

// var createWindows10App = function (w3cManifestInfo, generatedAppDir /*, options*/) {
//     var platformDir = path.join(generatedAppDir, 'windows10');
//     var manifestDir = path.join(platformDir, 'manifest');
//     var manifestImagesDir = path.join(manifestDir, 'images');
//     var sourceDir = path.join(platformDir, 'source');
//     var sourceImagesDir = path.join(sourceDir, 'images');
//     var projectAssetsDir = path.join(__dirname, 'projectBuilder', 'assets', 'windows10');
//     var projectAssetsImagesDir = path.join(projectAssetsDir, 'images');
// 
//     // if the manifest images folder doesn't exist, create it
//     mkdirp(manifestImagesDir, function (err) {
//       if (err && err.code !== 'EEXIST') {
//         return task.reject(wrapError('ERROR: Failed to create the platform directory. The Windows 10 project could not be created successfully.', err));
//       }
// 
//       // download icons to the app's folder
//       var pendingDownloads = [];
//       log.info('Downloading Windows 10 icons...');
//       var icons = windowsManifestInfo.content.icons;
// 
//       function downloadIcon(size) {
//         var downloadTask = new Q.defer();
//         pendingDownloads.push(downloadTask.promise);
//         var iconUrl = url.resolve(w3cManifestInfo.content.start_url, icons[size].url);
//         var iconFilePath = path.join(manifestImagesDir, icons[size].fileName);
//         downloader.downloadImage(iconUrl, iconFilePath, createDownloaderImageCallback(downloadTask, icons, size));
//       }
// 
//       function createDownloaderImageCallback(downloadTask, icons, size) {
//         return function (err) {
//           if (err) {
//             log.warn('WARNING: Failed to download icon file: ' + icons[size].url);
//             log.debug(err.message);
//           }
// 
//           downloadTask.resolve();
//         };
//       }
// 
//       for (var size in icons) {
//         downloadIcon(size);
//       }
// 
//       Q.allSettled(pendingDownloads)
//       .done(function () {
//         // copy the manifest file to the app folder
//         log.info('Copying the Windows 10 manifest to the app folder...');
//         var manifestFilePath = path.join(manifestDir, 'appxmanifest.xml');
//         fs.writeFile(manifestFilePath, windowsManifestInfo.content.rawData, function (err) {
//           if (err) {
//             return task.reject(wrapError('ERROR: Failed to copy the manifest to the platform folder. The Windows 10 project could not be created successfully.', err));
//           }
// 
//           // If there are missing images in the manifest folder, copy the default images from the project assets
//           ncp(projectAssetsImagesDir, manifestImagesDir, { clobber: false }, function (err) {
//             if (err) {
//               return task.reject(wrapError('ERROR: Failed to copy the default icons to the project folder. The Windows 10 project could not be created successfully.', err));
//             }
// 
//             // copy project assets to the source folder
//             ncp(projectAssetsDir, sourceDir, function (err) {
//               if (err) {
//                 return task.reject(wrapError('ERROR: Failed to copy the project assets to the source folder. The Windows 10 project could not be created successfully.', err));
//               }
// 
//               // Overwrite images in source folder with the manifest images
//               ncp(manifestImagesDir, sourceImagesDir, { clobber: true }, function (err) {
//                 if (err) {
//                   return task.reject(wrapError('ERROR: Failed to copy the manifest icons to the project folder. The Windows 10 project could not be created successfully.', err));
//                 }
// 
//                 // Update project files in source dir
//                 updateProjectFiles(sourceDir, w3cManifestInfo, function (err) {
//                   if (err) {
//                     return task.reject(wrapError('ERROR: Failed to update Windows 10 package.appxmanifest. The Windows 10 project files could not be created successfully.', err));
//                   }
// 
// 
//  
//                 // move offline file into win10 dir
//                 copyOfflineFile('msapp-error.html', manifestDir, function (err) {
//                   if (err) {
//                     return task.reject(wrapError('ERROR: Failed to update Windows 10 package with offline file. The Windows 10 project files could not be created successfully.', err));
//                   }
//                 // move offline file into win10 source dir
//                 copyOfflineFile('msapp-error.html', sourceDir, function (err) {
//                   if (err) {
//                     return task.reject(wrapError('ERROR: Failed to update Windows 10 package with offline file. The Windows 10 project files could not be created successfully.', err));
//                   }
// 
//                   copyDocFile('Windows10-next-steps.md', platformDir, function (err) {
//                     if (err) {
//                       log.warn('WARNING: Failed to copy documentation file to the Windows 10 platform folder.');
//                       log.debug(err.message);
//                     }
//                     
//                     return task.resolve();
//                       });
//                     });
//                   });
//                 });
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

var manifoldjsLib = require('manifoldjs-lib');

var PlatformBase = manifoldjsLib.PlatformBase,
    manifestTools = manifoldjsLib.manifestTools,
    CustomError = manifoldjsLib.CustomError,
    fileTools = manifoldjsLib.fileTools,
    iconTools = manifoldjsLib.iconTools;

var constants = require('./constants'),
    manifest = require('./manifest');
   
function Platform(packageName, platforms) {

  var self = this;
  Object.assign(this, PlatformBase.prototype);
  PlatformBase.apply(this, [constants.platform.id, constants.platform.name, packageName, __dirname]);

  // save platform list
  self.platforms = platforms;

  // override create function
  self.create = function (w3cManifestInfo, rootDir, options, callback) {

    self.info('Generating the ' + constants.platform.name + ' app...');
    
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
        
        // TODO: verify if using all instead of allSettled  is correct
        return Q.all(Object.keys(icons).map(function (size) {
          var iconUrl = url.resolve(w3cManifestInfo.content.start_url, icons[size].url);
          var iconFilePath = path.join(platformDir, 'images', icons[size].fileName);
          return iconTools.getIcon(iconUrl, iconFilePath);          
        }));
      })
      // // copy default platform icon
      // .then(function () {
      //   return self.copyDefaultPlatformIcon(platformManifestInfo, '128', platformDir)
      // })
      // copy the documentation file
      .then(function () {
        return self.copyDocumentationFile('Windows10-next-steps.md', platformDir);
      })      
      // create generation info
      .then(function () {
        return self.createGenerationInfo(platformDir);
      })
      // persist the platform-specific manifest
      .then(function () {
        self.debug('Copying the ' + constants.platform.name + ' manifest to the app folder...');
        var manifestFilePath = path.join(platformDir, 'appxmanifest.xml');
        return Q.nfcall(fs.writeFile, manifestFilePath, platformManifestInfo.content.rawData);
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
