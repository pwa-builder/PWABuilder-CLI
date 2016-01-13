'use strict';

var Q = require('q');
 
var lib = require('manifoldjs-lib');
  
var CustomError = lib.CustomError,
    fileTools = lib.fileTools,
    log = lib.log,
    projectBuilder = lib.projectBuilder,
    projectTools = lib.projectTools,
    utils = lib.utils,
    validations = lib.validations; 

var isWindows10Version = function (version) {
  return /^10/.test(version);
};

function runApp (program) {
  var platform = program.args[1];

  if (!validations.platformToRunValid(platform)) {
    return log.error('Invalid platform specified.');
  }

  Q().then(function () {
    if (platform.toUpperCase() !== 'WINDOWS') {
      return Q.resolve(platform);
    }
    
    if (!utils.isWindows) {
      return Q.reject(new Error('Windows projects can only be executed in Windows environments.'));
    }
    
    var windowsManifest = 'appxmanifest.xml';
    return Q.nfcall(fileTools.searchFile, process.cwd(), windowsManifest).then(function (results) {
      return Q.nfcall(projectTools.getWindowsVersion).then(function (version) {
        if (results && results.length > 0 && isWindows10Version(version)) {
          // If there is a windows app manifest and the OS is Windows 10, install the windows 10 app
          return 'windows10';
        }
        
        return 'windows';
      });
    })
    .catch (function (err) {
        return Q.reject(new CustomError('Failed to find the Windows app manifest.', err));      
    })        
  })
  .then(projectBuilder.runApp)
  .catch(function (err) {
    log(err.getMessage());
  });  
}

module.exports = runApp;
