'use strict';

module.exports = function (manifestContent, callback) {
  var startUrl = manifestContent.start_url;
  if (!startUrl || startUrl.length === 0 || !startUrl.trim()) {
    return callback(undefined, {
      'description': 'The start URL for the target web site is required',
      'platform': 'general',
      'level': 'error',
      'member': 'start_url',
      'code': 'required-value'
    });
  }

  callback();
};
