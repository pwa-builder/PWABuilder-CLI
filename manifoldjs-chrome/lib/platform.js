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
   
function Platform(platformId, packageName) {

  Object.assign(this, PlatformBase.prototype);
  PlatformBase.apply(this, [platformId, constants.platform.name, constants.platform.displayName, packageName, __dirname]);
  var self = this;

  // override create function
  self.create = function(w3cManifestInfo, rootDir, options, callback) {

    self.info('Generating the Chrome application...');
    
    var platformDir = path.join(rootDir, 'chrome');
    
    // convert the W3C manifest to a Chrome manifest
    var chromeManifestInfo;
    return manifest.convertFromBase(w3cManifestInfo)
      // if the platform dir doesn't exist, create it
      .then(function (manifestInfo) {
        chromeManifestInfo = manifestInfo;         
        self.info('Creating the Chrome app folder...');
        return fileTools.mkdirp(platformDir);
      })
      // download icons to the app's folder
      .then(function () {
        self.info('Downloading Chrome icons...');
        var icons = chromeManifestInfo.content.icons;
        
        // TODO: verify if using all instead of allSettled  is correct
        return Q.all(Object.keys(icons).map(function (size) {
          return iconTools.getIcon(w3cManifestInfo.content.start_url, icons, size, platformDir);          
        }));
      })
      // copy default platform icon
      .then(function () {
        return self.copyDefaultPlatformIcon(chromeManifestInfo, '128', platformDir)
      })
      // copy the documentation file
      .then(function () {
        return self.copyDocumentationFile('Chrome-next-steps.md', platformDir);
      })      
      // create generation info
      .then(function () {
        return self.createGenerationInfo(platformDir);
      })
      // persist the Chrome manifest
      .then(function () {
        self.info('Copying the Chrome manifest to the app folder...');
        var manifestFilePath = path.join(platformDir, 'manifest.json');
        return manifestTools.writeToFile(chromeManifestInfo, manifestFilePath);
      })
      .then(function () {
        self.info('Created Chrome OS platform app!')
      })
      .catch(function (err) {
        return Q.reject(new CustomError('The Chrome app could not be created successfully.', err));        
      })
      .nodeify(callback);
  };
}

module.exports = Platform;
