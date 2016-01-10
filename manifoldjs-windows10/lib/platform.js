'use strict';

var fs = require('fs'),
    path = require('path'),
    url = require('url');
    
var Q = require('q');

var manifoldjsLib = require('manifoldjs-lib');

var PlatformBase = manifoldjsLib.PlatformBase,
    CustomError = manifoldjsLib.CustomError,
    fileTools = manifoldjsLib.fileTools,
    iconTools = manifoldjsLib.iconTools;

var constants = require('./constants'),
    manifest = require('./manifest'),
    appPackage = require('./appPackage');
   
function Platform (packageName, platforms) {

  var self = this;
  Object.assign(this, PlatformBase.prototype);
  PlatformBase.apply(this, [constants.platform.id, constants.platform.name, packageName, __dirname]);

  // save platform list
  self.platforms = platforms;

  // override create function
  self.create = function (w3cManifestInfo, rootDir, options, callback) {

    self.info('Generating the ' + constants.platform.name + ' app...');
    
    var assetsDir = path.join(self.baseDir, 'assets');
    var platformDir = path.join(rootDir, constants.platform.id);
    var manifestDir = path.join(platformDir, 'manifest');
    var imagesDir = path.join(manifestDir, 'images');
    var sourceDir = path.join(platformDir, 'source');   

    // convert the W3C manifest to a platform-specific manifest
    var platformManifestInfo;
    return manifest.convertFromBase(w3cManifestInfo)
      // if the platform dir doesn't exist, create it
      .then(function (manifestInfo) {
        platformManifestInfo = manifestInfo;         
        self.debug('Creating the ' + constants.platform.name + ' app folder...');
        return fileTools.mkdirp(platformDir);
      })
      // persist the platform-specific manifest
      .then(function () {
        return fileTools.mkdirp(manifestDir).then(function () {
          self.debug('Copying the ' + constants.platform.name + ' manifest to the app folder...');
          var manifestFilePath = path.join(manifestDir, 'appxmanifest.xml');
          return Q.nfcall(fs.writeFile, manifestFilePath, platformManifestInfo.content.rawData)
                  .catch(function (err) {
                    return Q.reject(new CustomError('Failed to copy the manifest to the platform folder.', err));
                  });
        })
      })     
      // download icons to the app's folder
      .then(function () {
        self.debug('Downloading the ' + constants.platform.name + ' icons...');
     
        // create images folder  
        return fileTools.mkdirp(imagesDir).then(function () {
          // download all icons in the manifest
          var icons = platformManifestInfo.content.icons;
          if (icons) {
            var downloadTasks = Object.keys(icons).map(function (size) {            
              var iconUrl = url.resolve(w3cManifestInfo.content.start_url, icons[size].url);
              var iconFilePath = path.join(imagesDir, icons[size].fileName);
              return iconTools.getIcon(iconUrl, iconFilePath);
            });
            
            return Q.allSettled(downloadTasks).then(function (results) {
              results.forEach(function (result) {
                if (result.state === 'rejected') {
                  self.warn('Error downloading an icon file. ' + result.reason.message);
                }
              })
            })
            // replace any missing icons with default images from the project's assets 
            .then(function (icons) {
              var defaultImagesDir = path.join(self.baseDir, 'assets', 'images');
              return fileTools.copyFolder(defaultImagesDir, imagesDir, { clobber: false })
                .catch (function (err) {
                    return Q.reject(new CustomError('Failed to copy the default icons to the project folder.', err));    
                });
            });
          }
        });
      })
      // copy the offline page
      .then(function () {
        var fileName = 'msapp-error.html';
        var source = path.join(assetsDir, fileName);
        var target = path.join(manifestDir, fileName);
      
        self.info('Copying offline file "' + fileName + '" to target: ' + target + '...');
      
        return fileTools.copyFile(source, target);        
      })
      // copy project assets to the source folder 
      .then(function () {
        var projectAssetsDir = path.join(assetsDir, 'project');
        return fileTools.copyFolder(projectAssetsDir, sourceDir)
          .catch(function (err) {
            return Q.reject(new CustomError('Failed to copy the project assets to the source folder.', err));
          });
      })
      // copy the manifest and icon files to the source project
      .then(function () {
        self.info('Copying files to the ' + constants.platform.name + ' source project...');
        return fileTools.copyFolder(manifestDir, sourceDir, {
          clobber: true,
          filter: function (file) { return path.basename(file) !== 'appxmanifest.xml'; } });
      })      
      // update the source project's application manifest (package.appxmanifest) 
      .then(function () {
        var packageManifestPath = path.join(sourceDir, 'package.appxmanifest');
        return fileTools.replaceFileContent(packageManifestPath,
          function (data) {
            return manifest.replaceManifestValues(w3cManifestInfo, data);
          })
          .catch(function (err) {
            return Q.reject(new CustomError('Failed to update the application manifest \'package.appxmanifest\'.', err));
          });
      })     
      // copy the documentation
      .then(function () {
        return self.copyDocumentation(platformDir);
      })      
      // create generation info
      .then(function () {
        return self.createGenerationInfo(platformDir);
      })
      .then(function () {
        self.info('Created the ' + constants.platform.name + ' app!');
      })
      .catch(function (err) {
        return Q.reject(new CustomError('The ' + constants.platform.name + ' app could not be created successfully.', err));
      })
      .nodeify(callback);
  };

  // override package function
  self.package = function (platformDir, outputPath, options, callback) {
 
    self.info('Packaging the ' + constants.platform.name + ' app...');
    
    var directory = path.join(platformDir, 'manifest');

    // creates App Store package for publishing
    return appPackage.makeAppx(directory, outputPath).then(function () {
      self.info('The app store package was created successfully!');
    });
  }
}

module.exports = Platform;
