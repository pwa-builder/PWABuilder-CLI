'use strict';

var validationConstants = require('../../constants').validation;

module.exports = function (manifestContent, callback) {
  if (manifestContent.mjs_access_whitelist) {
    return callback(undefined, {
      'description': 'The mjs_access_whitelist member is deprecated and won\'t be supported in future versions. Use mjs_extended_scope instead',
      'platform': validationConstants.platforms.all,
      'level': validationConstants.levels.warning,
      'member': validationConstants.manifestMembers.mjs_access_whitelist,
      'code': validationConstants.codes.deprecatedMember
    });
  }

  callback();
};
