'use strict';

var manifoldjsLib = require('manifoldjs-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageValidation =  manifoldjsLib.manifestTools.imageValidation;

var constants = require('../constants');

module.exports = function (manifestContent, callback) {
  var description = 'A 128x128 icon is required for the installation process and the Chrome Web Store',
  platform = constants.platform.name,
  level = validationConstants.levels.warning,
  requiredIconSizes = ['128x128'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
