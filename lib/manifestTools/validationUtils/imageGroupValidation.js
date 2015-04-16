'use strict';

var validationConstants = require('../validationConstants');

module.exports = function (manifestContent, description, platform, validIconSizes, callback) {
  var icons = manifestContent.icons;

  var result = {
    'description': description,
    'platform': platform,
    'level': validationConstants.levels.warning,
    'member': validationConstants.manifestMembers.icons,
    'code': validationConstants.codes.missingImageGroup,
    'data': validIconSizes.slice()
  };

  if (!icons || icons.length === 0) {
    return callback(undefined, result);
  }

  for (var i = 0; i < icons.length; i++) {
    var icon = icons[i];

    for (var i = 0; i < validIconSizes.length; i++) {
      if (icon === validIconSizes[i]) {
        return callback();
      }
    }
  }

  callback(undefined, result);
};
