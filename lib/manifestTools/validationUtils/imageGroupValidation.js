'use strict';

var validationConstants = require('../validationConstants');

module.exports = function (manifestContent, description, platform, validIconSizes, callback) {
  var icons = manifestContent.icons;

  var result = {
    description: description,
    platform: platform,
    level: validationConstants.levels.warning,
    member: validationConstants.manifestMembers.icons,
    code: validationConstants.codes.missingImageGroup,
    data: validIconSizes.slice()
  };

  if (!icons || icons.length === 0) {
    return callback(undefined, result);
  }

  for (var i = 0; i < icons.length; i++) {
    var iconSizes = icons[i].sizes;

    for (var j = 0; j < validIconSizes.length; j++) {
      if (iconSizes === validIconSizes[j]) {
        return callback();
      }
    }
  }

  callback(undefined, result);
};
