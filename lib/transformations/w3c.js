'use strict';


function convertToBase (manifestInfo, callback) {
  return callback(undefined, manifestInfo);
}

function convertFromBase (manifestInfo, callback) {
  return callback(undefined, manifestInfo);
}

var validProperties = ['name', 'short_name', 'scope', 'icons', 'display', 'orientation', 'start_url'];
var validIconProperties = ['density', 'sizes', 'src', 'type'];

function matchFormat (manifestObj) {
  var lowercasePropName;

  for (var prop in manifestObj) {
    if (manifestObj.hasOwnProperty(prop)) {
      lowercasePropName = prop.toLowerCase();
      if (validProperties.indexOf(lowercasePropName) === -1 && lowercasePropName.indexOf('_') <= 0) {
        return false;
      }

      if (lowercasePropName === 'icons') {
        var icons = manifestObj[prop];
        for (var i = 0; i < icons.length; i++) {
          for (var iconProp in icons[i]) {
            if (icons[i].hasOwnProperty(iconProp) && validIconProperties.indexOf(iconProp) === -1) {
              return false;
            }
          }
        }
      }
    }
  }

  return true;
}

module.exports = {
  convertToBase: convertToBase,
  convertFromBase: convertFromBase,
  matchFormat: matchFormat
};
