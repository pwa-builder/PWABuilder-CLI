'use strict';

var manifoldjsLib = require('manifoldjs-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageValidation =  manifoldjsLib.manifestTools.imageValidation;

var constants = require('../../constants');

module.exports = function (manifestContent, callback) {
  var description = 'An app icon of the following sizes is required: 76x76, 120x120, 152x152 and 180x180',
  platform = constants.platform.id,
  level = validationConstants.levels.warning,
  requiredIconSizes = ['76x76', '120x120', '152x152', '180x180'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
