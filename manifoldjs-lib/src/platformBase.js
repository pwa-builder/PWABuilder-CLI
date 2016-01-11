'use strict';

var fs = require('fs'),
    path = require('path'),
    Q = require('q');
    
var	manifestTools = require('./manifestTools'),
    iconTools = require('./iconTools'),
    fileTools = require('./fileTools'),
    packageTools = require('./packageTools'),
    log = require('./log');

function PlatformBase (id, name, packageName, baseDir) {
  var self = this;
  
  self.id = id;
  self.name = name;
  self.packageName = packageName;
  self.baseDir = baseDir;
  self.log = log;
}

/**
 * This function must be overridden by subclasses.
 * 
 * Creates a fully-functional hosted web application application for the given platform.
 */
PlatformBase.prototype.create = function (w3cManifestInfo, rootDir, options, callback) {
  // TODO: consider halting the operation if create is not overridden
  // throw new Error('create operation must be implemented in the platform implementation.');
  this.error('ERROR: create operation is not implemented for platform: ' + this.id);
};

/**
 * This function is optional. It should be overridden by subclasses. 
 * 
 * Runs the application created using the `create` operation for the given platform.
 */
PlatformBase.prototype.run = function (callback) {
  this.warn('WARNING: run operation is not implemented for platform: ' + this.id);
};

/**
 * This function is optional. It should be overridden by subclasses. 
 * 
 * Packages the application created using the `create` operation to be published in the platform's store.
 */
PlatformBase.prototype.package = function (platformDir, outputPath, options, callback) {
  this.warn('WARNING: package operation is not implemented for platform: ' + this.id);
};

/**
 * This function is optional. It should be overridden by subclasses. 
 * 
 * Opens the source code for the application created using the `create` operation for the given platform.
 */
PlatformBase.prototype.open = function (callback) {
  this.warn('WARNING: open operation is not implemented for platform: ' + this.id);
};

/**
 * This function is optional. It should return the validation rules to make sure the W3C manifest meets the
 * requirements for your platform.
 * 
 * By default, it loads validation rules from the 'validationRules' folder of the platform project. 
 */
PlatformBase.prototype.getValidationRules = function (platforms, callback) {
  
  if (!this.baseDir) {
    return this.warn('Missing base directory for platform: ' + this.id + '.');
  }
  
  var validationRulesDir = path.join(this.baseDir, 'validationRules');
  return Q.nfcall(fs.stat, validationRulesDir)
          .then(function (stats) {
            if (stats.isDirectory()) {
              return manifestTools.loadValidationRules(validationRulesDir, platforms);
            }
                      
            this.warn('Failed to retrieve the validation rules for platform: ' + this.id + '. The validation rules folder is missing or invalid.');
            return Q.resolve([]).nodeify(callback);
          })
          .nodeify(callback);
};
    
/**
 * Copies the default platform icon to the generated app's folder.
 * 
 * The icon must be placed in the 'assets' folder of the platform and named 'defaultIcon.png'.
 */
PlatformBase.prototype.copyDefaultPlatformIcon = function (manifestInfo, iconSize, targetPath, callback) {
  if (this.baseDir) {
    var iconFilepath = path.join(this.baseDir, 'assets', 'defaultIcon.png');
    var stats = fs.statSync(iconFilepath);
    if (stats.isFile()) {
      return iconTools.copyDefaultIcon(manifestInfo.content, this.id, iconSize, iconFilepath, targetPath).nodeify(callback); 
    }
  }
  
  this.warn('A default icon for platform \'' + this.id + '\' was not found. Place the icon in \'assets/defaultIcon.png\'.');
  return Q.resolve().nodeify(callback);
};

/**
 * Copies the documentation to the generated app's folder.
 * 
 * All documents must be placed in the 'docs' folder of the platform. 
 */
PlatformBase.prototype.copyDocumentation = function (targetPath, platform, callback) {

  if (arguments.length > 1) {
    if (typeof platform === "function") {
      callback = platform;
      platform = '';
    }
  }
  
  var sourcePath = path.join(this.baseDir, 'docs', platform || '');

  this.info('Copying documentation from \'' + sourcePath + '\' to \'' + targetPath + '\'...');

  return fileTools.copyFolder(sourcePath, targetPath)
    .catch (function (err) {
      // failure to copy the documentation is not considered fatal, so catch the error and log as a warning
      this.warn('Failed to copy the documentation for the \'' + platform + '\' Cordova platform. ' + err.getMessage());
    })
    .nodeify(callback);
};

PlatformBase.prototype.createGenerationInfo = function (targetPath, callback) {

  var appModule = packageTools.getPackageInformation();
  if (!appModule) {    
    this.warn('Failed to retrieve version information for the generation tool package.');
    appModule = { version: 'Unknown' };
  }

  var platformModule = packageTools.getPackageInformation(this.packageName);
  if (!platformModule) {
    this.warn('Failed to retrieve information for the \'' + this.id + '\' platform package.');
    platformModule = { version: 'Unknown' };
  }

  var generationInfo = {
    'manifoldJSVersion': appModule.version,
    'platformId' : this.id,
    'platformPackage' : this.packageName,
    'platformVersion': platformModule.version
  };

  var filePath = path.join(targetPath, 'generationInfo.json');
  this.info('Creating generation info for platform \'' + this.id + '\' - path: \'' + filePath + '\'...');
  return Q.nfcall(fs.writeFile, filePath, JSON.stringify(generationInfo, null, 4))
          .nodeify(callback);
};

/**
 * Outputs a debug message to the log.
 */
PlatformBase.prototype.debug = function (message, source) {
  this.log.debug(message, source || this.id);
};

/**
 * Outputs an informational message to the log.
 */
PlatformBase.prototype.info = function (message, source) {
  this.log.info(message, source || this.id);
};

/**
 * Outputs a warning message to the log.
 */
PlatformBase.prototype.warn = function (message, source) {
  this.log.warn(message, source || this.id);
};

/**
 * Outputs an informational message to the log.
 */
PlatformBase.prototype.error = function (message, source) {
  this.log.error(message, source || this.id);
};

/**
 * Outputs a stack trace to the log.
 */
PlatformBase.prototype.trace = function (message, source) {
  this.log.trace(message, source || this.id);
};

module.exports = PlatformBase;