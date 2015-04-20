'use strict';

var request = require('request').defaults({
  followAllRedirects: true,
  encoding: null,
  jar: false,
  headers: {
    'Accept': 'text/html, application/xhtml+xml, */*',
    'Accept-Language': 'en-US,en;q=0.5',
    'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)'
  }
}),
  url = require('url'),
  Q = require('q'),
  validationConstants = require('../../validationConstants');

module.exports = function (manifestContent, callback) {
  var icons = manifestContent.icons;
  var startUrl = manifestContent.start_url;

  if (!icons || icons.length === 0) {
    return callback();
  }

  var possibleIconSizes = ['16x16', '32x32', '48x48', '64x64', '90x90', '128x128','256x256', '512x512'];

  var missingIconsSizes = [];
  var pendingValidations = [];
  var found;

  icons.forEach(function (icon) {

    var found = false;
    for (var i = 0; i < possibleIconSizes.length; i++) {
      if (icon.sizes === possibleIconSizes[i]) {
        found = true;
      }
    }

    if (found) {
      var validationTask = new Q.defer();
      pendingValidations.push(validationTask.promise);

      if (icon.src) {
        var iconUrl = url.parse(icon.src);
        if (!iconUrl.host) {
          var siteUrl = url.parse(startUrl);
          iconUrl = siteUrl.protocol + '//' + siteUrl.host + '/' + iconUrl.pathname;
        }

        request({ uri: iconUrl }, function (err, response) {
          if (err) {
            return validationTask.reject(new Error('Failed to retrieve icon from site.'));
          }

          if (response.statusCode !== 200) {
            missingIconsSizes.push(icon);
          }

          validationTask.resolve();
        });
      };
    }

  });

  Q.allSettled(pendingValidations)
    .fail(function(err) {
      callback(err);
    })
    .done(function() {
      if (!missingIconsSizes || missingIconsSizes.length === 0) {
        callback();
      } else {
        var result = {
          description: 'The app icons need to be hosted in the web site',
          platform: validationConstants.platforms.firefox,
          level: validationConstants.levels.warning,
          member: validationConstants.manifestMembers.icons,
          code: validationConstants.codes.missingImageOnsite,
          data: missingIconsSizes
        };

        callback(undefined, result);
      }
    });
};
