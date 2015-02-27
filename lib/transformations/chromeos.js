'use strict';

var baseManifestFormat = 'w3c';

function convertToBase (manifestInfo, callback) {
  if (!manifestInfo || !manifestInfo.content) {
    return callback(new Error('Manifest content is empty or not initialized.'));
  }

  var originalManifest = manifestInfo.content;
  var manifest = {
    'start_url': originalManifest.app.launch.web_url,
    'name': originalManifest.name
  };

  var icons = [];

  for (var size in originalManifest.icons) {
    if (originalManifest.icons.hasOwnProperty(size)) {
      icons.push({
        'sizes' : size + 'x' + size,
        'src': originalManifest.icons[size]
      });
    }
  }

  manifest.icons = icons;

  manifestInfo.content = manifest;
  manifestInfo.format = baseManifestFormat;

  return callback(undefined, manifestInfo);
}

function convertFromBase (manifestInfo, callback) {
  if (!manifestInfo || !manifestInfo.content) {
    return callback(new Error('Manifest content is empty or not initialized.'));
  }

  var originalManifest = manifestInfo.content;

  if (!originalManifest.start_url) {
    return callback(new Error('Start url is required.'));
  }

  var manifest = {
    'app': {
      'urls': [ originalManifest.start_url],
      'launch': {
        'web_url': originalManifest.start_url
      }
    },
    'version': '0.0.1',
    'name': originalManifest.name || originalManifest.start_url,
  };

  if (originalManifest.icons && originalManifest.icons.length) {
    var icons = {};

    for (var i = 0; i < originalManifest.icons.length; i++) {
      var icon = originalManifest.icons[i];
      var iconSize = icon.sizes.split('x')[0];

      icons[iconSize] = icon.src;
    }

    manifest.icons = icons;
    console.log(manifest);
  }

  manifestInfo.content = manifest;
  manifestInfo.format = 'chromeos';

  return callback(undefined, manifestInfo);
}

var requiredRootProperties = ['name', 'version', 'app'];

var validRootProperties = ['name', 'description', 'version', 'app',
  'background_page', 'icons', 'key', 'minimum_chrome_version',
  'offline_enabled', 'permissions', 'update_url'];

var validAppProperties = ['urls', 'launch'];
var validAppLaunchProperties = ['web_url', 'container', 'height', 'width'];

function matchFormat (manifestObj) {
  var lowercasePropName;

  for (var prop in manifestObj) {
    if (manifestObj.hasOwnProperty(prop)) {
      lowercasePropName = prop.toLowerCase();
      if (validRootProperties.indexOf(lowercasePropName) === -1) {
        return false;
      }
    }

    if (lowercasePropName === 'app') {
      for (var appProp in manifestObj.app) {
        if (manifestObj.app.hasOwnProperty(appProp)) {
          if (validAppProperties.indexOf(appProp) === -1) {
            return false;
          }

          if (appProp === 'launch') {
            for (var appLaunchProp in manifestObj.app.launch) {
              if (manifestObj.app.launch.hasOwnProperty(appLaunchProp)) {
                if (validAppLaunchProperties.indexOf(appLaunchProp) === -1) {
                  return false;
                }
              }
            }
          }
        }
      }
    }
  }

  //check required fields
  for (var i = 0; i < requiredRootProperties.length; i++) {
    if (!manifestObj.hasOwnProperty(requiredRootProperties[i])) {
      return false;
    }
  }

  if (!manifestObj.hasOwnProperty('launch') ||
      !manifestObj.launch.hasOwnProperty('web_url')) {
    return false;
  }

  return true;
}


module.exports = {
  convertToBase: convertToBase,
  convertFromBase: convertFromBase,
  matchFormat: matchFormat
};
