'use strict';

var fs = require('fs');
var path = require('path');

var validationRulesDir = path.join(__dirname, 'validationRules');

var modules = {};

function getDirectories(srcPath) {
  return fs.readdirSync(srcPath).filter(function(file) {
    return fs.statSync(path.join(srcPath, file)).isDirectory();
  });
}

getDirectories(validationRulesDir).forEach(function (validationGroupName) {
  var validationGroupPath = path.join(validationRulesDir, validationGroupName);

  var rules = [];

  console.log(validationGroupName);
  console.log(validationGroupPath);
  console.log('-------------begin---------------');
  fs.readdirSync(validationGroupPath).forEach(function(file) {
    console.log(file);
    rules.push(require(path.join(validationGroupPath, file)));
  });

  console.log('-------------end---------------');

  modules[validationGroupName] = function (manifest) {
    var result = [];

    for (var i = 0; i < rules.length; i++) {
      result.push.apply(result, rules[i](manifest));
    }

    return result;
  };
});

module.exports = modules;
