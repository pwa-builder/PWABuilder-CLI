'use strict';

var path = require('path'),
    Q = require('q');

var exec = require('./exec'),
    log = require('./log'),
    CustomError = require('./customError');

function installPackage(packageName, source, callback) {

  var deferred = Q.defer();

  try {
    var module = require(packageName);
    deferred.resolve(module);
  }
  catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      return Q.reject(new CustomError('Failed to resolve module: \'' + packageName + '\'.', err)).nodeify(callback);
    }

    log.info('Installing new module: ' + packageName);

    var appRoot = path.dirname(require.main.filename);

    // npm command in Windows is a batch file and needs to include extension to be resolved by spawn call
    var npm = (process.platform === 'win32' ? 'npm.cmd' : 'npm');
    exec(npm, ['install', source], { cwd: appRoot })
      .then(function () {
        var module = require(packageName);
        deferred.resolve(module);
      })
      .catch(function (err) {
        deferred.reject(new CustomError('Failed to install module: \'' + packageName + '\'.', err));
      });
  }

  return deferred.promise.nodeify(callback);
}

module.exports = {
  installPackage: installPackage
};