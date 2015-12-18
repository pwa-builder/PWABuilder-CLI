'use strict';

// App manifest must contain the following fields (if publishing to Firefox Marketplace):
//  - name
//  - description
//  - launch_path(for Packaged Apps)
//  - icons (1 icon of 128x128 required, 1 icon of 512x512 recommended)
//  - developer
//  - default_locale (if locales is defined)
//  - type (for privileged and internal(certified) apps)

// App manifest must contain the following fields (if NOT publishing to Firefox Marketplace):
//  - name
//  - description
//  - icons (1 icon of 128x128 required, 1 icon of 512x512 recommended)

var c = require('../../constants'),
    url = require('url');

function convertToBase(manifestInfo, callback) {
  if (!manifestInfo || !manifestInfo.content) {
    return callback(new Error('Manifest content is empty or not initialized.'));
  }

  var originalManifest = manifestInfo.content;
  var manifest = {
    'start_url': originalManifest.launch_path || '/',
    'name': originalManifest.description,
    'short_name': originalManifest.name
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

  var convertedManifestInfo = {
    'content': manifest,
    'format': c.BASE_MANIFEST_FORMAT
  };

  return callback(undefined, convertedManifestInfo);
}

// function convertFromBase(manifestInfo, callback) {
//   if (!manifestInfo || !manifestInfo.content) {
//     return callback(new Error('Manifest content is empty or not initialized.'));
//   }
// 
//   var originalManifest = manifestInfo.content;
// 
//   if (!originalManifest.start_url) {
//     return callback(new Error('Start url is required.'));
//   }
// 
//   var manifest = {
//     'name': originalManifest.short_name || originalManifest.start_url,
//     'description': originalManifest.name || 'Content from ' + originalManifest.start_url,
//     'launch_path': url.parse(originalManifest.start_url).pathname || '/'
//   };
// 
//   if (originalManifest.icons && originalManifest.icons.length) {
//     var icons = {};
// 
//     var supportedSizes = ['16', '32', '48', '60', '64', '90', '128', '256', '512'];
//     for (var i = 0; i < originalManifest.icons.length; i++) {
//       var icon = originalManifest.icons[i];
//       var iconDimensions = icon.sizes.split('x');
//       if (supportedSizes.indexOf(iconDimensions[0]) >= 0 && iconDimensions[0] === iconDimensions[1]) {
//         icons[iconDimensions[0]] = icon.src;
//       }
//     }
// 
//     manifest.icons = icons;
//   }
// 
//   var convertedManifestInfo = {
//     'content': manifest,
//     'format': c.FIREFOX_MANIFEST_FORMAT
//   };
// 
//   return callback(undefined, convertedManifestInfo);
// }

var requiredRootProperties = ['name', 'version', 'app'];

var validRootProperties = ['name', 'description', 'version', 'app',
                           'background_page', 'icons', 'key',
                           'minimum_chrome_version', 'offline_enabled',
                           'permissions', 'update_url'];

var validAppProperties = ['urls', 'launch'];
var validAppLaunchProperties = ['web_url', 'container', 'height', 'width'];

function matchFormat(manifestObj) {
  var lowercasePropName;

  // check required fields
  for (var i = 0; i < requiredRootProperties.length; i++) {
    if (!manifestObj.hasOwnProperty(requiredRootProperties[i])) {
      return false;
    }
  }

  if (!manifestObj.app.hasOwnProperty('launch') ||
    !manifestObj.app.launch.hasOwnProperty('web_url')) {
    return false;
  }

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

  return true;
}


module.exports = {
  convertToBase: convertToBase,
  // convertFromBase: convertFromBase,
  matchFormat: matchFormat
};
