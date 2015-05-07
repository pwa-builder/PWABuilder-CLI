'use strict';

var fs = require('fs'),
    cheerio = require('cheerio'),
    request = require('request'),
    url = require('url'),
    utils = require('./common/utils'),
    transformations = require('./manifestTools/transformations'),
    validationRules =require('./manifestTools/validationRules'),
    manifestTypeDetector = require('./manifestTools/manifestTypeDetector'),
    c = require('./manifestTools/constants'),
    validationConstants = require('./manifestTools/validationConstants'),
    log = require('loglevel'),
    Q = require('q'),
    // Request settings taken from https://github.com/InternetExplorer/modern.IE-static-code-scan/blob/master/app.js
    request = request.defaults({
      followAllRedirects: true,
      encoding: null,
      jar: false,
      headers: {
        'Accept': 'text/html, application/xhtml+xml, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)'
      }
    });

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

function fetchManifestUrlFromSite(siteUrl, callback) {
  request({
    uri: siteUrl
  }, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return callback(new Error('Failed to retrieve manifest from site.'));
    }

    var $ = cheerio.load(body);
    var manifestUrl = $('link[rel~="manifest"]').attr('href');
    if (manifestUrl) {
      var parsedManifestUrl = url.parse(manifestUrl);
      if (!parsedManifestUrl.host) {
        manifestUrl = url.resolve(siteUrl, parsedManifestUrl.pathname);
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

    var detectedFormat = manifestTypeDetector.detect(manifestObj);

    if (!detectedFormat) {
        return callback(new Error('Invalid manifest format.'));
    }

    var manifestInfo = {
      content: manifestObj,
      format: detectedFormat
    };

    log.info('Found a ' + manifestInfo.format.toUpperCase() + ' manifest...');

    return callback(null, manifestInfo);
  });
}

function getManifestFromSite(siteUrl, callback) {
  fetchManifestUrlFromSite(siteUrl, function (err, manifestUrl) {
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
      log.debug(err);
      return callback(new Error('Could open the manifest file.'));
    }

    var manifestObj = utils.parseJSON(data);

    if (!manifestObj) {
      return callback(new Error('Invalid manifest format.'));
    }

    var detectedFormat = manifestTypeDetector.detect(manifestObj);

    if (!detectedFormat) {
      return callback(new Error('Invalid manifest format.'));
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

function validateManifest(manifestInfo, targetPlatforms, callback) {
    if (!manifestInfo || !manifestInfo.content) {
        return callback(new Error('Manifest content is empty or invalid.'));
    }

    if (manifestInfo.format !== c.BASE_MANIFEST_FORMAT) {
        return callback(new Error('The manifest passed as argument is not a W3C manifest.'));
    }

    // Add 'general' if it is not present
    var validationTargetPlatforms;
    if (!targetPlatforms) {
      validationTargetPlatforms = [validationConstants.platforms.all];
    } else if (targetPlatforms.length === 0 || targetPlatforms.indexOf(validationConstants.platforms.all) < 0) {
      validationTargetPlatforms = targetPlatforms.slice(); // Creates a copy
      validationTargetPlatforms.push(validationConstants.platforms.all);
    }

    var validationResults = [];
    var pendingValidations = [];

    validationTargetPlatforms.forEach(function (platform) {
      var validationTask = new Q.defer();
      pendingValidations.push(validationTask.promise);
      var validationFunc = validationRules[platform];

      if (validationFunc) {
        validationFunc(manifestInfo.content, function(err, platformResults) {
          if (err) {
            return validationTask.reject(err);
          }

          validationResults.push.apply(validationResults, platformResults);
          validationTask.resolve();
        });
      } else {
        return validationTask.reject(new Error('Target platform does not have validations.'));
      }
    });

    Q.allSettled(pendingValidations)
      .fail(function(err) {
        callback(err);
      })
      .done(function() {
        callback(undefined, validationResults);
      });
}

function validateAndNormalizeStartUrl(siteUrl, manifestInfo, callback) {
  if (manifestInfo.format !== c.BASE_MANIFEST_FORMAT) {
    return callback(new Error('The manifest found is not a W3C manifest.'), manifestInfo);
  }

  var parsedSiteUrl = url.parse(siteUrl);
  var parsedManifestStartUrl = url.parse(manifestInfo.content.start_url);
  if (parsedManifestStartUrl.hostname && parsedSiteUrl.hostname !== parsedManifestStartUrl.hostname) {
    return callback(new Error('The domain of the hosted site (' + parsedSiteUrl.hostname + ') does not match the domain of the manifest\'s start_url parameter (' + parsedManifestStartUrl.hostname + ')'), manifestInfo);
  }

  // make sure the manifest's start_url is an absolute URL
  manifestInfo.content.start_url = url.resolve(siteUrl, manifestInfo.content.start_url);

  return callback(undefined, manifestInfo);
}

module.exports = {
  getManifestFromSite: getManifestFromSite,
  getManifestFromFile: getManifestFromFile,
  writeToFile: writeToFile,

  fetchManifestUrlFromSite: fetchManifestUrlFromSite,
  downloadManifestFromUrl: downloadManifestFromUrl,

  validateAndNormalizeStartUrl: validateAndNormalizeStartUrl,

  convertTo: convertTo,

  validateManifest: validateManifest
};
