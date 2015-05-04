'use strict';

var validationConstants = require('../../validationConstants');
var url = require('url');

module.exports = function (manifestContent, callback) {
  var startUrl = manifestContent.start_url;

  if (startUrl) {
    var parsedSiteUrl = url.parse(startUrl);

    if (parsedSiteUrl.hostname && parsedSiteUrl.protocol) {
      return callback();
    }
  }

  return callback(undefined, {
    'description': 'The start URL for the target web site need to be a full valid URL',
    'platform': validationConstants.platforms.all,
    'level': validationConstants.levels.error,
    'member': validationConstants.manifestMembers.start_url,
    'code': validationConstants.codes.requiredFullUrl
  });
};
