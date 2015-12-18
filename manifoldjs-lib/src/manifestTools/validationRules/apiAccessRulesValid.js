'use strict';

var validationConstants = require('../../constants').validation,
    validations = require('../validation');

var validAccessTypes = {
  'ios': [ 'cordova' ],
  'windows': [ 'cordova' ],
  'android': [ 'cordova' ],
  'windows10': [ 'all', 'allowForWebOnly' ]
};

// Add 'none' as a valid API access type for all platforms
for (var platform in validAccessTypes) {
  if (validAccessTypes[platform].indexOf('none') < 0) {
    validAccessTypes[platform].push('none');
  }
}

module.exports = function (manifestContent, callback) {
  var validationResults = [];
  var apiAccessRules = manifestContent.mjs_api_access;

  if (apiAccessRules && apiAccessRules instanceof Array) {
  	apiAccessRules.forEach(function (rule, index) {    
      if (rule.platform) {
        rule.platform.split(',')
            .map(function (item) { return item.trim(); })
            .forEach(function (platform) {
              if (!validations.platformsValid([platform])) {
                validationResults.push({
                  'description': 'Platform \'' + platform + '\' is not supported in rule ' + index + 1,
                  'platform': validationConstants.platforms.all,
                  'level': validationConstants.levels.error,
                  'member': validationConstants.manifestMembers.mjs_api_access,
                  'code': validationConstants.codes.invalidValue
                });
                
                return;
              }
              
              if (rule.access && (!validAccessTypes[platform] || validAccessTypes[platform].indexOf(rule.access)) < 0) {
                validationResults.push({
                  'description': 'Access type \'' + rule.access + '\' is not supported for platform \'' + platform + '\' in rule ' + index + 1,
                  'platform': validationConstants.platforms.all,
                  'level': validationConstants.levels.error,
                  'member': validationConstants.manifestMembers.mjs_api_access,
                  'code': validationConstants.codes.invalidValue
                });
              }
            });
      }
    });
	}
  
  return callback(undefined, validationResults);
};
