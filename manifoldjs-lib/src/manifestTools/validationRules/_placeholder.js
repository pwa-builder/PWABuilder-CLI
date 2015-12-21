'use strict';

var validationConstants = require('../../constants').validation;

module.exports = function (manifestContent, callback) {
  return callback();

  //  returning a single result (example: issues with icons):
  //--------------------------------
  // return callback(undefined, {
  //   'description': 'You may want to add the X icon',
  //   'platform': validationConstants.platforms.all,
  //   'level': validationConstants.levels.suggestion,
  //   'members': validationConstants.manifestMembers.icons,
  //   'code': validationConstants.codes.missingImage
  // });

  //  returning multiple results (example: issues with icons):
  //--------------------------------
  // return callback(undefined, [{
  //   'description': 'You may want to add the X icon',
  //   'platform': validationConstants.platforms.all,
  //   'level': validationConstants.levels.suggestion,
  //   'members': validationConstants.manifestMembers.icons,
  //   'code': validationConstants.codes.missingImage
  // },
  // {
  //   'description': 'An issue with the icons format',
  //   'platform': validationConstants.platforms.all,
  //   'level': validationConstants.levels.suggestion,
  //   'members': validationConstants.manifestMembers.icons,
  //   'code': validationConstants.codes.missingImage
  // }]);
};
