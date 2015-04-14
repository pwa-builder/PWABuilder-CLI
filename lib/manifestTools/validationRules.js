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

  fs.readdirSync(validationGroupPath).forEach(function(file) {
    rules.push(require(path.join(validationGroupPath, file)));
  });

  modules[validationGroupName] = function (manifest) {
    var result = [];
    var ruleResult;
    var toStringFunction = Object.prototype.toString;

    for (var i = 0; i < rules.length; i++) {
      ruleResult = rules[i](manifest);

      if (toStringFunction.call(ruleResult) === '[object Array]' ) {
        result.push.apply(result, ruleResult);
      } else if (ruleResult) {
        result.push(ruleResult);
      }
    }

    return result;
  };
});

module.exports = modules;
