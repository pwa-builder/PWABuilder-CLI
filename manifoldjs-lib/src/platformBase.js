'use strict';

var fs = require('fs'),
    path = require('path'),
    Q = require('q');
    
var	manifestTools = require('./manifestTools'),
    iconTools = require('./iconTools'),
    fileTools = require('./fileTools'),
    packageTools = require('./packageTools'),
    logger = require('./log');

function PlatformBase (id, name, packageName, baseDir) {
  var self = this;
  
  self.id = id;
  self.name = name;
  self.packageName = packageName;
  self.baseDir = baseDir;
  self.log = logger.getLogger(id);
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
PlatformBase.prototype.package = function (callback) {
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
PlatformBase.prototype.getValidationRules = function (callback) {
  
  if (this.baseDir) {
    var validationRulesDir = path.join(this.baseDir, 'validationRules');
    var stats = fs.statSync(validationRulesDir);
    if (stats.isDirectory()) {
      return manifestTools.loadValidationRules(validationRulesDir).nodeify(callback);
    }
  }
  
  this.warn('Failed to retrieve the validation rules for platform: ' + this.id + '. The validation rules folder is missing or invalid.');
  
  return Q.resolve([]).nodeify(callback);
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
 * Copies a documentation file to the generated app's folder.
 * 
 * The file must be placed in the 'docs' folder of the platform. 
 */
PlatformBase.prototype.copyDocumentationFile = function (filename, targetPath, callback) {
  var source = path.join(this.baseDir, 'docs', filename);
  var target = path.join(targetPath, filename);

  this.info('Copying documentation file \'' + filename + '\' to \'' + target + '\'...');

  return fileTools.copyFile(source, target)
                  .catch (function (err) {
                    // failure to copy the documentation file is not considered fatal
                    // so catch the error and log as warning
                    this.warn('Failed to copy the documentation file to the platform folder - ' + err.getMessage);
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
  this.log.info(message, source);
};

/**
 * Outputs an informational message to the log.
 */
PlatformBase.prototype.info = function (message, source) {
  this.log.info(message, source);
};

/**
 * Outputs a warning message to the log.
 */
PlatformBase.prototype.warn = function (message, source) {
  this.log.warn(message, source);
};

/**
 * Outputs an informational message to the log.
 */
PlatformBase.prototype.error = function (message, source) {
  this.log.info(message, source);
};

/**
 * Outputs a stack trace to the log.
 */
PlatformBase.prototype.trace = function (message, source) {
  this.log.trace(message, source);
};

module.exports = PlatformBase;