'use strict';

var fs = require('fs'),
    cheerio = require('cheerio'),
    request = require('request'),
    url = require('url'),
    utils = require('./utils'),
    transformations = require('./transformations'),
    manifestTypeDetector = require('./manifestTypeDetector'),
    c = require('./constants'),
    log = require('loglevel');

function convertTo(manifestInfo, outputFormat, callback) {
  if (!manifestInfo || !manifestInfo.content) {
    return callback(new Error('Manifest content is empty or not initialized.'));
  }

  var inputFormat = c.BASE_MANIFEST_FORMAT;
  if (manifestInfo.format && utils.isString(manifestInfo.format)) {
    inputFormat = manifestInfo.format.toLowerCase();
  }

  if (outputFormat && utils.isString(outputFormat)) {
    outputFormat = outputFormat.toLowerCase();
  } else {
    outputFormat = c.BASE_MANIFEST_FORMAT;
  }

  if (inputFormat === outputFormat) {
    if (!manifestInfo.format) {
      manifestInfo.format = outputFormat;
    }
    return callback(undefined, manifestInfo);
  }

  var inputTransformation = transformations[inputFormat];
  var outputTransformation = transformations[outputFormat];

  if (!inputTransformation || !outputTransformation) {
    return callback(new Error('Manifest format is not recognized.'));
  }

  inputTransformation.convertToBase(manifestInfo, function (err, resultManifestInfo) {
    if (err) {
      return callback(err, resultManifestInfo);
    }

    outputTransformation.convertFromBase(resultManifestInfo, callback);
  });
}

function getManifestUrlFromSite(siteUrl, callback) {
  request({
    uri: siteUrl
  }, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return callback(new Error('Failed to retrieve manifest from site.'));
    }

    var $ = cheerio.load(body);
    var manifestUrl = $('link[rel=manifest]').attr('href');
    if (manifestUrl) {
      var parsedManifestUrl = url.parse(manifestUrl);
      if (!parsedManifestUrl.host) {
        var parsedSiteUrl = url.parse(siteUrl);
        manifestUrl = parsedSiteUrl.protocol + '//' + parsedSiteUrl.host + '/' + parsedManifestUrl.pathname;
      }
    }

    return callback(undefined, manifestUrl);
  });
}

function downloadManifestFromUrl(manifestUrl, callback) {
  request({
    uri: manifestUrl
  }, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return callback(new Error('Failed to download manifest data.'));
    }

    var manifestObj = utils.parseJSON(body);

    if (!manifestObj) {
      return callback(new Error('Invalid manifest format.'));
    }
        
    var manifestInfo = {
      content: manifestObj,
      format: c.BASE_MANIFEST_FORMAT
    };

    log.info('Found a ' + manifestInfo.format.toUpperCase() + ' manifest...');

    return callback(null, manifestInfo);
  });
}

function getManifestFromSite(siteUrl, callback) {
  getManifestUrlFromSite(siteUrl, function (err, manifestUrl) {
    if (err) {
      return callback(err);
    }

    if (manifestUrl) {      
      downloadManifestFromUrl(manifestUrl, callback);
    } else {
      // TODO: review what to do in this case. (manifest meta tag is not present)
      log.warn('WARNING: No manifest found. A new manifest will be created.');
            
      var shortName = '';
      url.parse(siteUrl)
         .hostname
         .split('.')
         .map(function (segment) {
                segment.split('-')
                       .map(function (fraction) {
                              shortName = shortName + utils.capitalize(fraction);
                        });
          });      

      return callback(null, {
        content: {
          'start_url': siteUrl,
          'short_name': shortName
        },
        format: c.BASE_MANIFEST_FORMAT
      });
    }
  });
}

function getManifestFromFile(filePath, callback) {
  fs.readFile(filePath, function (err, data) {
    if (err) {
      return callback(err);
    }

    var manifestObj = utils.parseJSON(data);

    if (!manifestObj) {
      return callback(new Error('Invalid manifest format'));
    }

    var detectedFormat = manifestTypeDetector.detect(manifestObj);

    if (!detectedFormat) {
      return callback(new Error('Invalid manifest format'));
    } else {
      return callback(undefined, {
        content: manifestObj,
        format: detectedFormat
      });
    }
  });
}

function writeToFile(manifestInfo, filePath, callback) {
  if (manifestInfo && manifestInfo.content) {
    var jsonString = JSON.stringify(manifestInfo.content, undefined, 4);
    fs.writeFile(filePath, jsonString, callback);
  } else {
    return callback(new Error('Manifest content is empty or invalid.'));
  }
}

module.exports = {
  getManifestFromSite: getManifestFromSite,
  getManifestFromFile: getManifestFromFile,
  writeToFile: writeToFile,

  getManifestUrlFromSite: getManifestUrlFromSite,
  downloadManifestFromUrl: downloadManifestFromUrl,

  convertTo: convertTo
};
