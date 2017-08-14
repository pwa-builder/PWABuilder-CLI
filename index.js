/**
 * **NOTE**: Use of pwabuilder as a library is now DEPRECATED. Use pwabuilder-lib instead.
 *
 * The top-level API for `pwabuilder`. Provides access to the key libraries in
 * pwabuilder so you can write your own tools using `pwabuilder` as a library.
 *
 * Usage
 * -----
 *
 *      var pwabuilder = require('pwabuilder-lib');
 *
 */

var lib = require('pwabuilder-lib');
var libValidationContants = lib.constants.validation;

// Maintain compatibility with original constant definitions
var validationConstants = {
  levels:           libValidationContants.levels,
  codes:            libValidationContants.codes,
  manifestMembers:  libValidationContants.manifestMembers,
  platforms: {
    all: 'all',
    android: 'android',
    ios: 'ios',
    windows: 'windows'
  },
  platformDisplayNames: {
    all: 'All Platforms',
    android: 'Android',
    ios: 'iOS',
    windows: 'Windows'
  }
};

module.exports = {
  manifestTools:        lib.manifestTools,
  validationConstants:  validationConstants,
  projectBuilder:       lib.projectBuilder,
  projectTools:         lib.projectTools
};
