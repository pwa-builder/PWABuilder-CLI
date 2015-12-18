'use strict';

var validationConstants = require('../../constants').validation;

module.exports = function (manifestContent, callback) {
  var mjs_access_whitelist = manifestContent.mjs_access_whitelist;
  var mjs_extended_scope = manifestContent.mjs_extended_scope;
  if ((!mjs_access_whitelist || !(mjs_access_whitelist instanceof Array) || mjs_access_whitelist.length === 0) &&
      (!mjs_extended_scope || !(mjs_extended_scope instanceof Array) || mjs_extended_scope.length === 0)) {
    return callback(undefined, {
      'description': 'It is recommended to specify a set of rules that represent the navigation scope of the application',
      'platform': validationConstants.platforms.all,
      'level': validationConstants.levels.suggestion,
      'member': validationConstants.manifestMembers.mjs_extended_scope,
      'code': validationConstants.codes.requiredValue
    });
  }

  callback();
};