'use strict';

var validationConstants = require('../../validationConstants'),
imageValidation = require('../../validationUtils/imageValidation');

module.exports = function (manifestContent, callback) {
  var description = 'A launch image of the following sizes is required: 750x1334, 1334x750, 1242x2208, 2208x1242, 640x1136, 640x960, 1536x2048, 2048x1536, 768x1024 and 1024x768',
  platform = validationConstants.platforms.ios,
  level = validationConstants.levels.warning,
  requiredIconSizes = ['750x1334', '1334x750', '1242x2208', '2208x1242', '640x1136', '640x960', '1536x2048', '2048x1536', '768x1024', '1024x768'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
