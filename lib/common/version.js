'use strict';

var http = require('http'),
    semver = require('semver'),
    pkg = require('../../package.json');

var getCurrentPackageVersion = function () {
  return pkg.version;
};

var getCurrentPackageName = function () {
  return pkg.name;
};

var getNpmPackageLatestVersion = function (packageName, callback) {
  http.get('http://registry.npmjs.org/' + packageName + '/latest', function (res) {
    var data = '';
    
    res.on('data', function (chunk) {
      data += chunk;
    });
    
    res.on('end', function () {
      try {
        var packageJson = JSON.parse(data);
        callback(undefined, packageJson.version);
      } catch (err) {
        callback(err);
      }
    });
  }).on('error', function (err) {
    callback(err);
  });
};

var checkForUpdate = function (callback) {
  var name = getCurrentPackageName();
  getNpmPackageLatestVersion(name, function (err, latestVersion) {
    if (err) {
      return callback && callback(err);
    }

    var currentVersion = getCurrentPackageVersion();
    return callback && callback(undefined, semver.lt(currentVersion, latestVersion) ? latestVersion : undefined);
  });
};

module.exports = {
  getCurrentPackageName : getCurrentPackageName,
  getCurrentPackageVersion: getCurrentPackageVersion,
  getNpmPackageLatestVersion: getNpmPackageLatestVersion,
  checkForUpdate : checkForUpdate
};
