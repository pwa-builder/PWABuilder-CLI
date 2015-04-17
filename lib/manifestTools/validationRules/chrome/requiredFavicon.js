'use strict';

var validationConstants = require('../../validationConstants'),
imageValidation = require('../../validationUtils/imageValidation');

module.exports = function (manifestContent, callback) {
  var description = 'It is recommended to have a 16x16 favicon',
  platform = validationConstants.platforms.chrome,
  level = validationConstants.levels.suggestion,
  requiredIconSizes = ['16x16'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
