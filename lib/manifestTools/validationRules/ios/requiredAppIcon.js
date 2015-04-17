'use strict';

var validationConstants = require('../../validationConstants'),
imageValidation = require('../../validationUtils/imageValidation');

module.exports = function (manifestContent, callback) {
  var description = 'An app icon of the following sizes is required: 76x76, 120x120, 152x152 and 180x180',
  platform = validationConstants.platforms.ios,
  level = validationConstants.levels.warning,
  requiredIconSizes = ['76x76', '120x120', '152x152', '180x180'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
