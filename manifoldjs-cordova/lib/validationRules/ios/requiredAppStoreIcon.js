'use strict';

var manifoldjsLib = require('manifoldjs-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageValidation =  manifoldjsLib.manifestTools.imageValidation;

var constants = require('../../constants');

module.exports = function (manifestContent, callback) {
  var description = 'An 1024x1024 app icon for the App Store is required',
  platform = constants.platform.id,
  level = validationConstants.levels.warning,
  requiredIconSizes = ['1024x1024'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
