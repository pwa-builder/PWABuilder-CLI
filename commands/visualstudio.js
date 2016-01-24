'use strict';

var Q = require('q');

var lib = require('manifoldjs-lib');

var CustomError = lib.CustomError,
    exec = lib.processTools.exec,
    fileTools = lib.fileTools,
    log = lib.log;

var open = require('./open');

function isWindows10Version (version) {
  return /^10/.test(version);
}

function getWindowsVersion (callback) {
  log.debug('Obtaining Windows version...');
  exec('powershell', ['(Get-WmiObject win32_operatingsystem).version']).then(function (result) {
    return result.stdout.trim();
  })
  .catch (function (err) {
    return Q.reject(new CustomError('Failed to run the app for Windows platform.', err));    
  })
  .nodeify(callback); 
}

// implements the original behavior of the visualstudio command
//  open windows10 project, if available, otherwise, open the windows project
function runApp(program) {
  
  log.warn('The \'visualstudio\' command is deprecated. Use \'manifoldjs open <windows|windows10>\' instead.');
  
  var deferred = Q.defer();
  
  var dir = process.cwd();
  fileTools.searchFile(dir, 'App.jsproj', function (err, results) {
    Q.ninvoke(getWindowsVersion).then(function (version) {
      if (results && results.length > 0 && isWindows10Version(version)) {
        program.args.push('windows10'); 
        return open(program).then(function () {
          deferred.resolve();
        });
      }
      
      fileTools.searchFile(dir, 'CordovaApp.sln', function (err, results) {
        if (results && results.length > 0) {
          program.args.push('windows');
          return open(program).then(function () {
            deferred.resolve();
          });
        }
      });
    });
  });
  
  return deferred.promise;
}

module.exports = runApp;
