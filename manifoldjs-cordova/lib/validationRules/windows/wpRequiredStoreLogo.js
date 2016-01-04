'use strict';

var manifoldjsLib = require('manifoldjs-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageGroupValidation =  manifoldjsLib.manifestTools.imageGroupValidation;

var constants = require('../../constants');

module.exports = function (manifestContent, callback) {
  var description = 'A store logo of any of the following sizes is required for Windows Phone: 50x50, 70x70, 120x120',
      platform = constants.platform.id,
      validIconSizes = ['50x50', '70x70', '120x120'];

  imageGroupValidation(manifestContent, description, platform, validIconSizes, callback);
};
