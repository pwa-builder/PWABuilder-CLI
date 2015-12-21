'use strict';

var manifoldjsLib = require('manifoldjs-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageGroupValidation =  manifoldjsLib.manifestTools.imageGroupValidation;

var constants = require('../constants');

module.exports = function (manifestContent, callback) {
  var description = 'A medium tile logo of any of the following sizes is required for Windows Phone: 150x150, 210x210, 360x360',
      platform = constants.platforms.id,
      validIconSizes = ['150x150', '210x210', '360x360'];

  imageGroupValidation(manifestContent, description, platform, validIconSizes, callback);
};
