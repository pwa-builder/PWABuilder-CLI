'use strict';

var manifoldjsLib = require('manifoldjs-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageGroupValidation =  manifoldjsLib.manifestTools.imageGroupValidation;

var constants = require('../../constants');

module.exports = function (manifestContent, callback) {
  var description = 'A store logo of any of the following sizes is required for Windows: size 50x50, 70x70, 90x90',
      platform = constants.platform.subPlatforms.windows.id,
      validIconSizes = ['50x50', '70x70', '90x90'];

  imageGroupValidation(manifestContent, description, platform, validIconSizes, callback);
};
