/**
 * **NOTE**: Use of manifoldjs as a library is now DEPRECATED. Use manifoldjs-lib instead.
 *
 * The top-level API for `manifoldjs`. Provides access to the key libraries in
 * manifoldjs so you can write your own tools using `manifoldjs` as a library.
 *
 * Usage
 * -----
 *
 *      var manifoldjs = require('manifoldjs');
 *
 */

var lib = require('manifoldjs-lib');
var libValidationContants = lib.constants.validation;

// Maintain compatibility with original constant definitions
var validationConstants = {
  levels:           libValidationContants.levels,
  codes:            libValidationContants.codes,
  manifestMembers:  libValidationContants.manifestMembers,
  platforms: {
    all: 'all',
    android: 'android',
    chrome: 'chrome',
    firefox: 'firefox',
    ios: 'ios',
    windows: 'windows'
  },
  platformDisplayNames: {
    all: 'All Platforms',
    android: 'Android',
    chrome: 'Chrome',
    firefox: 'Firefox',
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
