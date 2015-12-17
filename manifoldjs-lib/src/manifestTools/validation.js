'use strict';

var path = require('path'),
    fs = require('fs'),
    Q = require('q');

var constants = require('../constants'),
    log = require('../log');

var toStringFunction = Object.prototype.toString;

function loadValidationRules(validationRulesDir, callback) {

  return Q.nfbind(fs.readdir)(validationRulesDir)
    .then(function (files) {
      var validationRules = [];
      files.forEach(function (file) {
        try {
          validationRules.push(require(path.join(validationRulesDir, file)));
        }
        catch (err) {
          log.error('Failed to load validation rule from file: \'' + file + '\'. ' + err.message + '.');
        }
      });

      return Q.resolve(validationRules);
    })
    .catch(function (err) {
      return Q.reject(new Error('Failed to read validation rules from the specified folder: \'' + validationRulesDir + '\'. ' + err.message + '.'));
    })
    .nodeify(callback);
}

function runValidationRules(w3cManifestInfo, rules, callback) {

  var results = [];
  var pendingValidations = [];

  rules.forEach(function (validationRule) {
    var validationTask = Q.defer();
    pendingValidations.push(validationTask.promise);

    validationRule(w3cManifestInfo.content, function (err, ruleResult) {
      if (err) {
        return validationTask.reject(err);
      }

      if (toStringFunction.call(ruleResult) === '[object Array]') {
        results.push.apply(results, ruleResult);
      } else if (ruleResult) {
        results.push(ruleResult);
      }

      validationTask.resolve();
    });
  });

  return Q.allSettled(pendingValidations)
    .thenResolve(results)
    .nodeify(callback);
}

function validateManifest(w3cManifestInfo, targetPlatforms, callback) {

  if (!w3cManifestInfo || !w3cManifestInfo.content) {
    return Q.reject(new Error('Manifest content is empty or invalid.')).nodeify(callback);
  }

  if (w3cManifestInfo.format !== constants.BASE_MANIFEST_FORMAT) {
    return Q.reject(new Error('The manifest passed as argument is not a W3C manifest.')).nodeify(callback);
  }

  var allResults = [];
  
  // load and run validation rules for "all platforms"
  var validationRulesDir = path.join(__dirname, 'validationRules');
  var task = loadValidationRules(validationRulesDir).then(function (rules) {
    return runValidationRules(w3cManifestInfo, rules).then(function (results) {
      allResults.push.apply(allResults, results);
    });
  })
    .then(function () {
      // run platform-specific validation rules 
      var platformTasks = targetPlatforms.map(function (platform) {
        return platform.getValidationRules().then(function (rules) {
          return runValidationRules(w3cManifestInfo, rules).then(function (results) {
            allResults.push.apply(allResults, results);
          });
        })
      });

      return Q.allSettled(platformTasks);
    })
    .thenResolve(allResults);

  return task.nodeify(callback);
}

// TODO: use promises to handle callback?
function imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback) {
  var icons = manifestContent.icons;

  var result = {
    description: description,
    platform: platform,
    level: level,
    member: constants.validation.manifestMembers.icons,
    code: constants.validation.codes.missingImage,
    data: requiredIconSizes.slice()
  };

  if (!icons || icons.length === 0) {
    return callback(undefined, result);
  }

  var missingIconsSizes = [];
  var found;

  for (var i = 0; i < requiredIconSizes.length; i++) {
    var requiredIcon = requiredIconSizes[i];
    found = false;

    for (var j = 0; j < icons.length; j++) {
      if (requiredIcon === icons[j].sizes) {
        found = true;
      }
    }

    if (!found) {
      missingIconsSizes.push(requiredIcon);
    }
  }

  result.data = missingIconsSizes;

  if (!missingIconsSizes || missingIconsSizes.length === 0) {
    callback();
  } else {
    callback(undefined, result);
  }
}

// TODO: use promises to handle callback?
function imageGroupValidation(manifestContent, description, platform, validIconSizes, callback) {
  var icons = manifestContent.icons;

  var result = {
    description: description,
    platform: platform,
    level: constants.validation.levels.warning,
    member: constants.validation.manifestMembers.icons,
    code: constants.validation.codes.missingImageGroup,
    data: validIconSizes.slice()
  };

  if (!icons || icons.length === 0) {
    return callback(undefined, result);
  }

  for (var i = 0; i < icons.length; i++) {
    var iconSizes = icons[i].sizes;

    for (var j = 0; j < validIconSizes.length; j++) {
      if (iconSizes === validIconSizes[j]) {
        return callback();
      }
    }
  }

  callback(undefined, result);
}

module.exports = {
  validateManifest: validateManifest,
  loadValidationRules: loadValidationRules,
  runValidationRules: runValidationRules,
  imageValidation: imageValidation,
  imageGroupValidation: imageGroupValidation
};
