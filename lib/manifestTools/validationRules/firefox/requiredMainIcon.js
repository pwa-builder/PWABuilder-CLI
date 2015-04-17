'use strict';

var validationConstants = require('../../validationConstants'),
imageValidation = require('../../validationUtils/imageValidation');

module.exports = function (manifestContent, callback) {
  var description = 'A 128x128 icon is required for the Firefox Marketplace and the devices',
  platform = validationConstants.platforms.firefox,
  level = validationConstants.levels.warning,
  requiredIconSizes = ['128x128'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
