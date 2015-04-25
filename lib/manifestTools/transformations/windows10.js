'use strict';

var c = require('../constants'),
    fs = require('fs'),
    path = require('path'),
    utils = require('../../common/utils');

// TODO: implement convertToBase function
function convertToBase(manifestInfo, callback) {
  return callback(new Error('Not yet implemented.'));
}

function convertFromBase(manifestInfo, callback) {
  if (!manifestInfo || !manifestInfo.content) {
    return callback(new Error('Manifest content is empty or not initialized.'));
  }

  var originalManifest = manifestInfo.content;

  if (!originalManifest.start_url) {
    return callback(new Error('Start url is required.'));
  }

  var manifestTemplatePath = path.join(__dirname, '..', 'assets', 'windows10', 'appxmanifest-template.xml');

  fs.readFile(manifestTemplatePath, function (err, data) {
    if (err) {
      return callback(new Error('Could not read the manifest template' + ' (' + err.message + ')'));
    }

    var rawManifest = data.toString();
    
    var guid = utils.newGuid().toUpperCase();
    
    rawManifest = rawManifest.replace(/{IdentityName}/g, guid);
    rawManifest = rawManifest.replace(/{PhoneProductId}/g, guid);
    rawManifest = rawManifest.replace(/{StartPage}/g, originalManifest.start_url);
    rawManifest = rawManifest.replace(/{DisplayName}/g, originalManifest.short_name);
    rawManifest = rawManifest.replace(/{Description}/g, originalManifest.name || originalManifest.short_name);
    rawManifest = rawManifest.replace(/{RotationPreference}/g, originalManifest.orientation || 'portrait');

    var icons = {};
    if (originalManifest.icons && originalManifest.icons.length) {
      for (var i = 0; i < originalManifest.icons.length; i++) {
        var icon = originalManifest.icons[i];
        var iconDimensions = icon.sizes.split('x');
        if (iconDimensions[0] === '30' && iconDimensions[1] === '30') {
          icons['30x30'] = icon.src;
        } else if (iconDimensions[0] === '50' && iconDimensions[1] === '50') {
          icons['50x50'] = icon.src;
        }else if (iconDimensions[0] === '150' && iconDimensions[1] === '150') {
          icons['150x150'] = icon.src;
        } else if (iconDimensions[0] === '620' && iconDimensions[1] === '300') {
          icons['620x300'] = icon.src;
        }
      }
    }
    
    rawManifest = rawManifest.replace(/{StoreLogo}/g, icons['50x50'] || '{StoreLogo}');    
    rawManifest = rawManifest.replace(/{Logo}/g, icons['150x150'] || '{Logo}');
    rawManifest = rawManifest.replace(/{SmallLogo}/g, icons['30x30'] || '{SmallLogo}');
    rawManifest = rawManifest.replace(/{SplashScreen}/g, icons['620x300'] || '{SplashScreen}');

    var indentationChars = '\r\n\t\t\t\t';
    var applicationContentUriRules = '';

    if (originalManifest.scope && originalManifest.scope.length) {
      applicationContentUriRules = '<uap:Rule Type="include" Match="' + originalManifest.scope + '" />';
    }

    if (originalManifest.hap_urlAccess && originalManifest.hap_urlAccess.length) {
      for (var j = 0; j < originalManifest.hap_urlAccess.length; j++) {
        var accessUrl = originalManifest.hap_urlAccess[j];
        if (!accessUrl.external) {
          applicationContentUriRules += (applicationContentUriRules ? indentationChars : '') + '<uap:Rule Type="include" Match="' + accessUrl.url + '" />';
        }
      }
    }

    rawManifest = rawManifest.replace(/{ApplicationContentUriRules}/g, applicationContentUriRules);

    var manifest = {
      'rawData': rawManifest,
      'icons': icons,
    };

    var convertedManifestInfo = {
      'content': manifest,
      'format': c.WINDOWS10_MANIFEST_FORMAT
    };

    return callback(undefined, convertedManifestInfo);
  });
}

// TODO: implement matchFormat function
function matchFormat() { //param: manifestObj
  return false;
}

module.exports = {
  convertToBase: convertToBase,
  convertFromBase: convertFromBase,
  matchFormat: matchFormat
};
