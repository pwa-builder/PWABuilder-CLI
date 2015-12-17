'use strict';

var http = require('http'),
    path = require('path'),
    semver = require('semver'),
    Q = require('q');

function getPackageInformation(packageName) {
  var packagePath = path.dirname(require.main.filename);
  if (packageName) {
    packagePath = path.join(packagePath, 'node_modules', packageName);      
  }
  
  packagePath = path.join(packagePath, 'package.json');
  var module = require(packagePath);
  if (!module) {
    throw new Error('Error retrieving information for module: \'' + packageName + '\'.');
  }
  
  return module;
}

var getNpmPackageLatestVersion = function (packageName, callback) {
  var deferred = Q.defer();
  http.get('http://registry.npmjs.org/' + packageName + '/latest', function (res) {
    var data = '';
    
    res.on('data', function (chunk) {
      data += chunk;
    });
    
    res.on('end', function () {
      try {
        var packageJson = JSON.parse(data);
        deferred.resolve(packageJson.version);
      } catch (err) {
        deferred.reject(new Error('Error parsing version information for npm package: \'' + packageName + '\'. ' + err.message + '.'));
      }
    });
  }).on('error', function (err) {
    deferred.reject(new Error('Error retrieving version information for npm package: \'' + packageName + '\'. ' + err.message + '.'));
  });
  
  return deferred.promise.nodeify(callback);
};

var checkForUpdate = function (callback) {
  var currentModule = getPackageInformation();
  return getNpmPackageLatestVersion(currentModule.name)
          .then(function (latestVersion) {
            var updateVersion = semver.lt(currentModule.version, latestVersion) ? latestVersion : undefined;
            return Q.resolve(updateVersion);
          })
          .nodeify(callback);
};

module.exports = {
  getPackageInformation: getPackageInformation,
  getNpmPackageLatestVersion: getNpmPackageLatestVersion,
  checkForUpdate: checkForUpdate
};
