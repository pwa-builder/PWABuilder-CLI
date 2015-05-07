'use strict';

var validationConstants = require('../../validationConstants');

module.exports = function (manifestContent, callback) {
  var mjs_access_whitelist = manifestContent.mjs_access_whitelist;
  if (!mjs_access_whitelist || !(mjs_access_whitelist instanceof Array) || mjs_access_whitelist.length === 0) {
    return callback(undefined, {
      'description': 'It is recommended to specify a set of access rules that represent the navigation scope of the application',
      'platform': validationConstants.platforms.all,
      'level': validationConstants.levels.suggestion,
      'member': validationConstants.manifestMembers.mjs_access_whitelist,
      'code': validationConstants.codes.requiredValue
    });
  }

  callback();
};
