'use strict';

var validationConstants = require('../../constants').validation;

module.exports = function (manifestContent, callback) {
  var shortName = manifestContent.short_name;
  if (!shortName || (typeof shortName === 'string' && (shortName.length === 0 || !shortName.trim()))) {
    return callback(undefined, {
      'description': 'A short name for the application is required',
      'platform': validationConstants.platforms.all,
      'level': validationConstants.levels.error,
      'member': validationConstants.manifestMembers.short_name,
      'code': validationConstants.codes.requiredValue
    });
  }

  callback();
};
