// from lib/manifestTools/transformations/chromeos.js

'use strict';

var url = require('url'),
    Q = require('q');

var utils = require('manifoldjs-lib').utils;

var constants = require('./constants');

// TODO: why is a callback needed here? Nothing is async...
function convertFromBase(manifestInfo, callback) {

  if (!manifestInfo || !manifestInfo.content) {
    return Q.reject(new Error('Manifest content is empty or not initialized.')).nodeify(callback);
  }
  
  var originalManifest = manifestInfo.content;

  if (!originalManifest.start_url) {
    return Q.reject(new Error('Start URL is required.')).nodeify(callback);
  }

  var manifest = {
    'manifest_version': 2,
    'name': originalManifest.name || originalManifest.short_name || utils.sanitizeName(url.parse(originalManifest.start_url).hostname),
    'version': '0.0.1',
    'app': {
      'launch': {
        'web_url': originalManifest.start_url
      }
    }
  };

  // map icons
  if (originalManifest.icons && originalManifest.icons.length) {
    var icons = {};

    for (var i = 0; i < originalManifest.icons.length; i++) {
      var icon = originalManifest.icons[i];
      var iconDimensions = icon.sizes.split('x');
      if (iconDimensions[0] === iconDimensions[1]) {
        icons[iconDimensions[0]] = icon.src;
      }
    }

    manifest.icons = icons;
  }

  // map permissions
  // NOTE: Chrome manifest does not support assigning different permissions based on URL.
  // Mapping calculates union of all permissions found for the 'Chrome' platform and grants 
  // the same set of permissions for all URLs.  
  if (originalManifest.mjs_api_access && originalManifest.mjs_api_access.length) {
    var permissionSet = {};   
    originalManifest.mjs_api_access.forEach(function(rule) {
      if (rule.platform && rule.platform.split(';') 
        .map(function (item) { return item.trim(); }) 
        .indexOf('chrome') >= 0) {
          if (!manifest.app.urls) {
            manifest.app.urls = [];
          }
          
          // add app URL unless it matches start_url
          var url = rule.match.trim().replace(/\*$/, '');
          if (url !== originalManifest.start_url) {
            manifest.app.urls.push(url);            
          }
          
          // use permissionSet object to calculate union of the permissions in all rules  
          rule.access.split(';').forEach(function (p) {
            permissionSet[p.trim()] = undefined;
          }); 
        }
    });
    
    // create permissions array
    var permissions = Object.keys(permissionSet); 
    if (permissions.length) {
      manifest.permissions = permissions;
    }   
  }

  var convertedManifestInfo = {
    'content': manifest,
    'format': constants.CHROME_MANIFEST_FORMAT
  };
  
  return Q.resolve(convertedManifestInfo).nodeify(callback);
}

module.exports = {
  convertFromBase: convertFromBase
}
