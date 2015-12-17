'use strict';

var validationConstants = require('../../validationConstants'),
    imageGroupValidation = require('../../validationUtils/imageGroupValidation');

module.exports = function (manifestContent, callback) {
  var description = 'A small square logo of any of the following sizes is required for Windows: 24x24, 30x30, 42x42, 54x54',
      platform = validationConstants.platforms.windows,
      validIconSizes = ['24x24', '30x30', '42x42', '54x54'];

  imageGroupValidation(manifestContent, description, platform, validIconSizes, callback);
};
