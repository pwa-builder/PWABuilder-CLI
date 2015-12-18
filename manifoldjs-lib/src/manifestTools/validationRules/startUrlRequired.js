'use strict';

var validationConstants = require('../../constants').validation;

module.exports = function (manifestContent, callback) {
  var startUrl = manifestContent.start_url;
  if (!startUrl || (typeof startUrl === 'string' && (startUrl.length === 0 || !startUrl.trim()))) {
    return callback(undefined, {
      'description': 'The start URL for the target web site is required',
      'platform': validationConstants.platforms.all,
      'level': validationConstants.levels.error,
      'member': validationConstants.manifestMembers.start_url,
      'code': validationConstants.codes.requiredValue
    });
  }

  callback();
};
