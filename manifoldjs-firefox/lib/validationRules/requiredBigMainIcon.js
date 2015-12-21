'use strict';

var manifoldjsLib = require('manifoldjs-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageValidation =  manifoldjsLib.manifestTools.imageValidation;

var constants = require('../constants');

module.exports = function (manifestContent, callback) {
  var description = 'Firefox 2.0 onwards, an 512x512 icon is recommended for Firefox Marketplace and devices',
  platform = constants.platform.id,
  level = validationConstants.levels.suggestion,
  requiredIconSizes = ['512x512'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
