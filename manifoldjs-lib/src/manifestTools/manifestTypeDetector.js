'use strict';

var transformations = require('./transformations');
var c = require('../constants');

function detect(manifestObj) {
  var results = [];
  for (var formatType in transformations) {
    if (transformations.hasOwnProperty(formatType)) {
      if (transformations[formatType].matchFormat(manifestObj)) {
        if (formatType === c.BASE_MANIFEST_FORMAT) {
          return c.BASE_MANIFEST_FORMAT;
        }

        results.push(formatType);
      }
    }
  }

  if (results.length === 0) {
    return undefined;
  }

  return results[0];
}

module.exports = {
  detect: detect
};
