'use strict';

var validationConstants = require('../../validationConstants'),
    imageGroupValidation = require('../../validationUtils/imageGroupValidation');

module.exports = function (manifestContent, callback) {
  var description = 'A medium tile logo of any of the following sizes is required for Windows Phone: 150x150, 210x210, 360x360',
      platform = validationConstants.platforms.windows,
      validIconSizes = ['150x150', '210x210', '360x360'];

  imageGroupValidation(manifestContent, description, platform, validIconSizes, callback);
};
