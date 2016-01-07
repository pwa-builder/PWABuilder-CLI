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

var updateProjectFiles = function (sourceDir, w3cManifestInfo, callback) {
  var packageManifestPath = path.join(sourceDir, 'package.appxmanifest');
  fileTools.replaceFileContent(packageManifestPath,
    function (data) {
      return manifest.replaceManifestValues(w3cManifestInfo, data);
    },
    callback);
};

module.exports = Platform;
