'use strict';

module.exports = function (manifestContent, callback) {
  var shortName = manifestContent.short_name;
  if (!shortName || shortName.length === 0 || !shortName.trim()) {
    return callback(undefined, {
      'description': 'A short name for the application is required',
      'platform': 'general',
      'level': 'error',
      'member': 'short_name',
      'code': 'required-value'
    });
  }

  callback();
};
