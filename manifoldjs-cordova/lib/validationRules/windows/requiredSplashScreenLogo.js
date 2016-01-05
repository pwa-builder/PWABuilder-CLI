'use strict';

var manifoldjsLib = require('manifoldjs-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageGroupValidation =  manifoldjsLib.manifestTools.imageGroupValidation;

var constants = require('../../constants');

module.exports = function (manifestContent, callback) {
  var description = 'A splash screen logo of any of the following sizes is required for Windows: 620x300, 868x420, 1116x540',
      platform = constants.platform.subPlatforms.windows.id,
      validIconSizes = ['620x300', '868x420', '1116x540'];

  imageGroupValidation(manifestContent, description, platform, validIconSizes, callback);
};
