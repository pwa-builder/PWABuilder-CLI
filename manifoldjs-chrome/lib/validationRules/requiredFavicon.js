'use strict';

var manifoldjsLib = require('manifoldjs-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageValidation =  manifoldjsLib.manifestTools.imageValidation;

var constants = require('../constants');

module.exports = function (manifestContent, callback) {
  var description = 'It is recommended to have a 16x16 favicon',
  platform = constants.platform.name,
  level = validationConstants.levels.suggestion,
  requiredIconSizes = ['16x16'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
