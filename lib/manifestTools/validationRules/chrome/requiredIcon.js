'use strict';

var validationConstants = require('../../validationConstants'),
imageValidation = require('../../validationUtils/imageValidation');

module.exports = function (manifestContent, callback) {
  var description = 'A 128x128 icon is required for the installation process and the Chrome Web Store',
  platform = validationConstants.platforms.chrome,
  level = validationConstants.levels.warning,
  requiredIconSizes = ['128x128'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
