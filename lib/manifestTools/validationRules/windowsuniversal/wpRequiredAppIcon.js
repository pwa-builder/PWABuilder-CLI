'use strict';

var validationConstants = require('../../validationConstants'),
    imageGroupValidation = require('../../validationUtils/imageGroupValidation');

module.exports = function (manifestContent, callback) {
  var description = 'An app icon of any of the following sizes is required for Windows Phone: 44x44, 62x62, 106x106',
      platform = validationConstants.platforms.windowsuniversal,
      validIconSizes = ['44x44', '62x62', '106x106'];

  imageGroupValidation(manifestContent, description, platform, validIconSizes, callback);
};
