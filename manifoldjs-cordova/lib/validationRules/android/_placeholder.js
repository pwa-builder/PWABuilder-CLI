'use strict';

var manifoldjsLib = require('manifoldjs-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageValidation =  manifoldjsLib.manifestTools.imageValidation,
    imageGroupValidation =  manifoldjsLib.manifestTools.imageGroupValidation;

var constants = require('../../constants');

module.exports = function (manifestContent, callback) {
  return callback();

  //  returning a single result (example: issues with icons):
  //--------------------------------
  // return callback(undefined, {
  //   'description': 'You may want to add the X icon',
  //   'platform': constants.platform.subPlatforms.android.id,
  //   'level': validationConstants.levels.suggestion,
  //   'members': validationConstants.manifestMembers.icons,
  //   'code': validationConstants.codes.missingImage
  // });

  //  returning multiple results (example: issues with icons):
  //--------------------------------
  // return callback(undefined, [{
  //   'description': 'You may want to add the X icon',
  //   'platform': constants.platform.subPlatforms.android.id,
  //   'level': validationConstants.levels.suggestion,
  //   'members': validationConstants.manifestMembers.icons,
  //   'code': validationConstants.codes.missingImage
  // },
  // {
  //   'description': 'An issue with the icons format',
  //   'platform': constants.platform.subPlatforms.android.id,
  //   'level': validationConstants.levels.suggestion,
  //   'members': validationConstants.manifestMembers.icons,
  //   'code': validationConstants.codes.missingImage
  // }]);
};
