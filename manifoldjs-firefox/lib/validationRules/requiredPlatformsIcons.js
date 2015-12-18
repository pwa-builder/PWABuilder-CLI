'use strict';

var manifoldjsLib = require('manifoldjs-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageValidation =  manifoldjsLib.manifestTools.imageValidation;

var constants = require('../constants');

module.exports = function (manifestContent, callback) {
  var description = 'It is recommended to provide icon sizes for multiple platforms, including: 16x16, 32x32, 48x48, 64x64, 90x90, 128x128 and 256x256',
  platform = constants.platform.name,
  level = validationConstants.levels.suggestion,
  requiredIconSizes = ['16x16', '32x32', '48x48', '64x64', '90x90', '128x128','256x256'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
