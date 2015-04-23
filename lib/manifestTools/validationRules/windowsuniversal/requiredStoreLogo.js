'use strict';

var validationConstants = require('../../validationConstants'),
    imageGroupValidation = require('../../validationUtils/imageGroupValidation');

module.exports = function (manifestContent, callback) {
  var description = 'A store logo of any of the following sizes is required for Windows: size 50x50, 70x70, 90x90',
      platform = validationConstants.platforms.windowsuniversal,
      validIconSizes = ['50x50', '70x70', '90x90'];

  imageGroupValidation(manifestContent, description, platform, validIconSizes, callback);
};
