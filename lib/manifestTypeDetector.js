'use strict';

var transformations = require('./transformations');

var baseManifestFormat = 'w3c';

function detect(manifestObj) {
  var results = [];
  for (var formatType in transformations) {
    if (transformations.hasOwnProperty(formatType)) {
      if (transformations[formatType].matchFormat(manifestObj)) {
        results.push(formatType);
      }
    }
  }

  if (results.length === 0) {
    return undefined;
  }

  if (results.length === 1){
    return formatType;
  }

  if (results.indexOf(baseManifestFormat) !== -1){
    return baseManifestFormat;
  } else {
    return results[0];
  }
}

module.exports = {
  detect: detect
};
