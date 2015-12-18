// from lib/manifestTools/transformations/firefox.js

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
    'name': originalManifest.short_name || originalManifest.start_url,
    'description': originalManifest.name || 'Content from ' + originalManifest.start_url,
    'launch_path': url.parse(originalManifest.start_url).pathname || '/'
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

  // TODO: map permissions?

  var convertedManifestInfo = {
    'content': manifest,
    'format': constants.FIREFOX_MANIFEST_FORMAT
  };
  
  return Q.resolve(convertedManifestInfo).nodeify(callback);
}

module.exports = {
  convertFromBase: convertFromBase
}
