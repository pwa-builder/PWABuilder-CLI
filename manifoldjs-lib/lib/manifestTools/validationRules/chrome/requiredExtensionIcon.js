'use strict';

var validationConstants = require('../../validationConstants'),
imageValidation = require('../../validationUtils/imageValidation');

module.exports = function (manifestContent, callback) {
  var description = 'A 48x48 icon should be provided for the extensions management page (chrome://extensions)',
  platform = validationConstants.platforms.chrome,
  level = validationConstants.levels.suggestion,
  requiredIconSizes = ['48x48'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
