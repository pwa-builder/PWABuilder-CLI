'use strict';


function convertToBase (manifestInfo, callback) {
  return callback(undefined, manifestInfo);
}

function convertFromBase (manifestInfo, callback) {
  return callback(undefined, manifestInfo);
}

var validProperties = ['name', 'short_name', 'scope', 'icons', 'display', 'orientation', 'start_url'];
var validIconProperties = ['density', 'sizes', 'src', 'type'];

function matchFormat (manifestInfo, callback) {
  if (!manifestInfo || !manifestInfo.content) {
    return callback(new Error('Manifest content is empty or not initialized.'));
  }

  var manifest = manifestInfo.content;
  var lowercasePropName;

  for (var prop in manifest) {
    if (manifest.hasOwnProperty(prop)) {
      lowercasePropName = prop.toLowerCase();
      if (validProperties.indexOf(lowercasePropName) === -1 && lowercasePropName.indexOf('_') <= 0) {
        return callback(undefined, false);
      }

      if (lowercasePropName === 'icons') {
        var icons = manifest[prop];
        for (var i = 0; i < icons.length; i++) {
          for (var iconProp in icons[i]) {
            if (icons[i].hasOwnProperty(iconProp) && validIconProperties.indexOf(iconProp) === -1) {
              return callback(undefined, false);
            }
          }
        }
      }
    }
  }

  return callback(undefined, true);
}

module.exports = {
  convertToBase: convertToBase,
  convertFromBase: convertFromBase,
  matchFormat: matchFormat
};
