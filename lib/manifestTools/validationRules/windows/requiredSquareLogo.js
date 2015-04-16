'use strict';

var validationConstants = require('../../validationConstants'),
    imageGroupValidation = require('../../ValidationUtils/imageGroupValidation');

module.exports = function (manifestContent, callback) {
  var description = 'A square logo of any of the following sizes is required for Windows: 120x120, 150x150, 210x210, 270x270',
      platform = validationConstants.platforms.windows,
      validIconSizes = ['120x120', '150x150','210x210','270x270'];

  imageGroupValidation(manifestContent, description, platform, validIconSizes, callback);
};
