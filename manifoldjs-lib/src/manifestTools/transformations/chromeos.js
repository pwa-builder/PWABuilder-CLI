'use strict';

var url = require('url'),
    utils = require('../../utils'), 
    c = require('../../constants');

function convertToBase(manifestInfo, callback) {
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
//     'manifest_version': 2,
//     'name': originalManifest.name || originalManifest.short_name || utils.sanitizeName(url.parse(originalManifest.start_url).hostname),
//     'version': '0.0.1',
//     'app': {
//       'launch': {
//         'web_url': originalManifest.start_url
//       }
//     }
//   };
// 
//   // map icons
//   if (originalManifest.icons && originalManifest.icons.length) {
//     var icons = {};
// 
//     for (var i = 0; i < originalManifest.icons.length; i++) {
//       var icon = originalManifest.icons[i];
//       var iconDimensions = icon.sizes.split('x');
//       if (iconDimensions[0] === iconDimensions[1]) {
//         icons[iconDimensions[0]] = icon.src;
//       }
//     }
// 
//     manifest.icons = icons;
//   }
// 
//   // map permissions
//   // NOTE: Chrome manifest does not support assigning different permissions based on URL.
//   // Mapping calculates union of all permissions found for the 'Chrome' platform and grants 
//   // the same set of permissions for all URLs.  
//   if (originalManifest.mjs_api_access && originalManifest.mjs_api_access.length) {
//     var permissionSet = {};   
//     originalManifest.mjs_api_access.forEach(function(rule) {
//       if (rule.platform && rule.platform.split(';') 
//         .map(function (item) { return item.trim(); }) 
//         .indexOf('chrome') >= 0) {
//           if (!manifest.app.urls) {
//             manifest.app.urls = [];
//           }
//           
//           // add app URL unless it matches start_url
//           var url = rule.match.trim().replace(/\*$/, '');
//           if (url !== originalManifest.start_url) {
//             manifest.app.urls.push(url);            
//           }
//           
//           // use permissionSet object to calculate union of the permissions in all rules  
//           rule.access.split(';').forEach(function (p) {
//             permissionSet[p.trim()] = undefined;
//           }); 
//         }
//     });
//     
//     // create permissions array
//     var permissions = Object.keys(permissionSet); 
//     if (permissions.length) {
//       manifest.permissions = permissions;
//     }   
//   }
// 
//   var convertedManifestInfo = {
//     'content': manifest,
//     'format': c.CHROME_MANIFEST_FORMAT
//   };
// 
//   return callback(undefined, convertedManifestInfo);
// }

// see https://developer.chrome.com/webstore/hosted_apps
var requiredRootProperties = ['name', 'version', 'manifest_version', 'app'];

var validRootProperties = ['name', 'description', 'version', 'manifest_version', 'app',
                           'background_page', 'icons', 'key',
                           'minimum_chrome_version', 'offline_enabled',
                           'permissions', 'update_url', 'default_locale'];

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
