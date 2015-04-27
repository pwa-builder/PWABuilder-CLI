'use strict';

var validationConstants = require('../../validationConstants');

module.exports = function (manifestContent, callback) {
  var mjs_urlAccess = manifestContent.mjs_urlAccess;
  if (!mjs_urlAccess || !(mjs_urlAccess instanceof Array) || mjs_urlAccess.length === 0) {
    return callback(undefined, {
      'description': 'It is recommended to specify a set of access rules that represent the navigation scope of the application',
      'platform': validationConstants.platforms.all,
      'level': validationConstants.levels.suggestion,
      'member': validationConstants.manifestMembers.mjs_urlAccess,
      'code': validationConstants.codes.requiredValue
    });
  }

  callback();
};
