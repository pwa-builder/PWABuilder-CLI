'use strict';


function convertToBase (manifestInfo, callback) {
  if (!manifestInfo || !manifestInfo.content) {
    return callback(new Error('Manifest content is empty or not initialized.'));
  }

  return callback(undefined, manifestInfo);
}

function convertFromBase (manifestInfo, callback) {
  if (!manifestInfo || !manifestInfo.content) {
    return callback(new Error('Manifest content is empty or not initialized.'));
  }

  return callback(undefined, manifestInfo);
}

var validRootProperties = ['name', 'short_name', 'scope', 'icons', 'display',
                           'orientation', 'start_url', 'lang', 'theme_color'];

var validIconProperties = ['density', 'sizes', 'src', 'type'];

function matchFormat (manifestObj) {
  var lowercasePropName;

  for (var prop in manifestObj) {
    if (manifestObj.hasOwnProperty(prop)) {
      lowercasePropName = prop.toLowerCase();
      if (validRootProperties.indexOf(lowercasePropName) === -1 && lowercasePropName.indexOf('_') <= 0) {
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
