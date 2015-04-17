'use strict';

var validationConstants = require('../../validationConstants'),
imageValidation = require('../../validationUtils/imageValidation');

module.exports = function (manifestContent, callback) {
  var description = 'An 1024x1024 app icon for the App Store is required',
  platform = validationConstants.platforms.ios,
  level = validationConstants.levels.warning,
  requiredIconSizes = ['1024x1024'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
