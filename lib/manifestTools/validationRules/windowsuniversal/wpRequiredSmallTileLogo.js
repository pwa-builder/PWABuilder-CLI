'use strict';

var validationConstants = require('../../validationConstants'),
    imageGroupValidation = require('../../validationUtils/imageGroupValidation');

module.exports = function (manifestContent, callback) {
  var description = 'A small tile logo of any of the following sizes is required for Windows Phone: 71x71, 99x99, 170x170',
      platform = validationConstants.platforms.windowsuniversal,
      validIconSizes = ['71x71', '99x99', '170x170'];

  imageGroupValidation(manifestContent, description, platform, validIconSizes, callback);
};
