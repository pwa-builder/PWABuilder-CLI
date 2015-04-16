'use strict';

var validationConstants = require('../../validationConstants'),
    imageGroupValidation = require('../../ValidationUtils/imageGroupValidation');

module.exports = function (manifestContent, callback) {
  var description = 'A store logo of any of the following sizes is required for Windows Phone: 50x50, 70x70, 120x120',
      platform = validationConstants.platforms.windows,
      validIconSizes = ['50x50', '70x70', '120x120'];

  imageGroupValidation(manifestContent, description, platform, validIconSizes, callback);
};
