'use strict';

var validationConstants = require('../../validationConstants');
var validations = require('../../../common/validations')
var validAccessTypes = {
  'ios': [ 'none', 'cordova' ],
  'windows': [ 'none', 'cordova' ],
  'android': [ 'none', 'cordova' ],
  'windows10': [ 'none', 'all', 'allowForWebOnly' ]
} 

module.exports = function (manifestContent, callback) {
  var apiAccessRules = manifestContent.mjs_api_access;

  if (apiAccessRules) {
  	var validationResults = [];
  	apiAccessRules.forEach(function (rule, index) {    
      if (rule.platform) {
        rule.platform.split(';')
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
