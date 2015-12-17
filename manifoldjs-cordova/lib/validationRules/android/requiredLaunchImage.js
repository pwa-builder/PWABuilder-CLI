'use strict';

var validationConstants = require('../../validationConstants'),
imageValidation = require('../../validationUtils/imageValidation');

module.exports = function (manifestContent, callback) {
  var description = 'Launcher icons of the following sizes are required: 48x48, 72x72, 96x96, 144x144, 192x192, 512x512',
  platform = validationConstants.platforms.android,
  level = validationConstants.levels.warning,
  requiredIconSizes = ['48x48', '72x72', '96x96', '144x144', '192x192', '512x512'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
