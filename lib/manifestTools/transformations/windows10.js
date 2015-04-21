'use strict';

var c = require('../constants'),
    fs = require('fs'),
    path = require('path');

// TODO: implement convertToBase function
function convertToBase(manifestInfo, callback) {
  return callback(new Error('Not yet implemented.'));
}

function convertFromBase(manifestInfo, callback) {
  if (!manifestInfo || !manifestInfo.content) {
    return callback(new Error('Manifest content is empty or not initialized.'));
  }
  
  var manifest = {};
  var originalManifest = manifestInfo.content;
  var manifestTemplatePath = path.join(__dirname, 'windows10', 'appxmanifest-template.xml');

  fs.readFile(manifestTemplatePath, function (err, data) {
    if (err) {
      return callback(new Error('Could not read the manifest template' + ' (' + err.message + ')'));
    }
    
    var rawManifest = data.toString()
    
    rawManifest = rawManifest.replace('{StartPage}', originalManifest.start_url);
    rawManifest = rawManifest.replace('{DisplayName}', originalManifest.short_name);
    rawManifest = rawManifest.replace('{Description}', originalManifest.name || originalManifest.short_name);
    rawManifest = rawManifest.replace('{RotationPreference}', originalManifest.orientation || 'portrait');
    
    var icons = {};
    if (originalManifest.icons && originalManifest.icons.length) {      
      for (var i = 0; i < originalManifest.icons.length; i++) {
        var icon = originalManifest.icons[i];
        var iconDimensions = icon.sizes.split('x');
        if (iconDimensions[0] === '44' && iconDimensions[1] === '44') {
          icons['44x44'] = icon.src;          
        } else if (iconDimensions[0] === '150' && iconDimensions[1] === '150') {
          icons['150x150'] = icon.src;  
        } else if (iconDimensions[0] === '620' && iconDimensions[1] === '300') {
          icons['620x300'] = icon.src;
        }
      }      
    }
    
    rawManifest = rawManifest.replace('{Square150x150Logo}', icons['150x150'] || '');
    rawManifest = rawManifest.replace('{Square44x44Logo}', icons['44x44'] || '');
    rawManifest = rawManifest.replace('{SplashScreenImage}', icons['620x300'] || '');

    var manifest = {
      'rawData': rawManifest,
      'icons': icons,
    }

    var convertedManifestInfo = {
      'content': manifest,
      'format': c.WINDOWS10_MANIFEST_FORMAT
    };
    
    return callback(undefined, convertedManifestInfo);
  });
}

// TODO: implement matchFormat function
function matchFormat(manifestObj) {
  return false;
}

module.exports = {
  convertToBase: convertToBase,
  convertFromBase: convertFromBase,
  matchFormat: matchFormat
};