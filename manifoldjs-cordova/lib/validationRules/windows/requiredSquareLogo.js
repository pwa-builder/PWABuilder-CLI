'use strict';

var manifoldjsLib = require('manifoldjs-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageGroupValidation =  manifoldjsLib.manifestTools.imageGroupValidation;

var constants = require('../../constants');

module.exports = function (manifestContent, callback) {
  var description = 'A square logo of any of the following sizes is required for Windows: 120x120, 150x150, 210x210, 270x270',
      platform = constants.platform.id,
      validIconSizes = ['120x120', '150x150','210x210','270x270'];

  imageGroupValidation(manifestContent, description, platform, validIconSizes, callback);
};
