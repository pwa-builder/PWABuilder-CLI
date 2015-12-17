'use strict';

var validationConstants = require('../../validationConstants'),
imageValidation = require('../../validationUtils/imageValidation');

module.exports = function (manifestContent, callback) {
  var description = 'Firefox 2.0 onwards, an 512x512 icon is recommended for Firefox Marketplace and devices',
  platform = validationConstants.platforms.firefox,
  level = validationConstants.levels.suggestion,
  requiredIconSizes = ['512x512'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
