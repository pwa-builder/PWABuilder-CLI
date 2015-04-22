'use strict';

var fs = require('fs'),
    path = require('path'),
    Q = require('q');

var validationRulesDir = path.join(__dirname, 'validationRules');

var modules = {};

function getDirectories(srcPath) {
  return fs.readdirSync(srcPath).filter(function(file) {
    return fs.statSync(path.join(srcPath, file)).isDirectory();
  });
}

function createValidationGroupFunction(rules) {
  return function (manifest, callback) {
    var result = [];
    var toStringFunction = Object.prototype.toString;
    var pendingValidations = [];

    rules.forEach(function (rule) {
      var validationTask = new Q.defer();
      pendingValidations.push(validationTask.promise);
      rule(manifest, function (err, ruleResult) {
        if (err) {
          return validationTask.reject(err);
        }

        if (toStringFunction.call(ruleResult) === '[object Array]' ) {
          result.push.apply(result, ruleResult);
        } else if (ruleResult) {
          result.push(ruleResult);
        }

        validationTask.resolve();
      });
    });

    Q.allSettled(pendingValidations)
      .fail(function(err) {
        callback(err);
      })
      .done(function() {
        callback(undefined, result);
      });
  };
}

getDirectories(validationRulesDir).forEach(function (validationGroupName) {
  var validationGroupPath = path.join(validationRulesDir, validationGroupName);
  var rules = [];

  fs.readdirSync(validationGroupPath).forEach(function(file) {
    rules.push(require(path.join(validationGroupPath, file)));
  });

  modules[validationGroupName] = createValidationGroupFunction(rules);
});

module.exports = modules;
