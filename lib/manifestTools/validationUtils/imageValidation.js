'use strict';

var validationConstants = require('../validationConstants');

module.exports = function (manifestContent, description, platform, level, requiredIconSizes, callback) {
  var icons = manifestContent.icons;

  var result = {
    description: description,
    platform: platform,
    level: level,
    member: validationConstants.manifestMembers.icons,
    code: validationConstants.codes.missingImage,
    data: requiredIconSizes.slice()
  };

  if (!icons || icons.length === 0) {
    return callback(undefined, result);
  }

  var missingIconsSizes = [];
  var found;

  for (var i = 0; i < requiredIconSizes.length; i++) {
    var requiredIcon = requiredIconSizes[i];
    found = false;

    for (var j = 0; j < icons.length; j++) {
      if (requiredIcon === icons[j]) {
        found = true;
      }
    }

    if (!found) {
      missingIconsSizes.push(requiredIcon)
    }
  }

  result.data = missingIconsSizes;

  if (!missingIconsSizes || missingIconsSizes.length === 0) {
    callback();
  } else {
    callback(undefined, result);
  }
};
