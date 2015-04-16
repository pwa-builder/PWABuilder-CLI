'use strict';

var validationConstants = require('../../validationConstants'),
    imageGroupValidation = require('../../ValidationUtils/imageGroupValidation');

module.exports = function (manifestContent, callback) {
  var description = 'A splash screen logo of any of the following sizes is required for Windows: 620x300, 868x420, 1116x540',
      platform = validationConstants.platforms.windows,
      validIconSizes = ['620x300', '868x420', '1116x540'];

  imageGroupValidation(manifestContent, description, platform, validIconSizes, callback);
};
