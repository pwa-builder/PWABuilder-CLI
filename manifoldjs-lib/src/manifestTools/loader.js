'use strict';

var fs = require('fs'),
    cheerio = require('cheerio'),
    request = require('request'),
    url = require('url'),
    utils = require('../utils'),
    transformations = require('./transformations'),
    manifestTypeDetector = require('./manifestTypeDetector'),
    c = require('../constants'),
    validationConstants = c.validation,
    log = require('../log'),
    chromeToW3c = require('./chromeToW3c.js'),
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
      // assume that it's a W3C manifest
      detectedFormat = c.BASE_MANIFEST_FORMAT;
    }
    
    // If the detected format is ChromeOS, we attempt to convert it to W3C Manifest format. 
    if (detectedFormat === c.CHROME_MANIFEST_FORMAT) {
        log.info('Found a ' + detectedFormat.toUpperCase() + ' manifest. Attempting to convert to W3C Manifest format...');
        manifestObj = chromeToW3c.chromeToW3CManifest(manifestObj);
        
        // Assuming conversion was successful, running the manifest JSON through the detector again will return the W3C format type.
        detectedFormat = manifestTypeDetector.detect(manifestObj);
        if (detectedFormat === c.BASE_MANIFEST_FORMAT) {
          log.info('Conversion to W3C Manifest format successful.');
        }
    }

    var manifestInfo = {
      content: manifestObj,
      format: detectedFormat,
      generatedUrl: manifestUrl
    };

    log.info('Found a ' + manifestInfo.format.toUpperCase() + ' manifest...');

    return callback(null, manifestInfo);
  });
}

function getDefaultShortName(siteUrl) {
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

    return shortName;
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

      var shortName = getDefaultShortName(siteUrl);

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
    
    // If the detected format is ChromeOS, we attempt to convert it to W3C Manifest format. 
    if (detectedFormat === c.CHROME_MANIFEST_FORMAT) {
        log.info('Found a ' + detectedFormat.toUpperCase() + ' manifest. Attempting to convert to W3C Manifest format...');
        manifestObj = chromeToW3c.chromeToW3CManifest(manifestObj);
        
        // Assuming conversion was successful, running the manifest JSON through the detector again will return the W3C format type.
        detectedFormat = manifestTypeDetector.detect(manifestObj);
        if (detectedFormat === c.BASE_MANIFEST_FORMAT) {
          log.info('Conversion to W3C Manifest format successful.');
        }
    }

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
    return Q.nfcall(fs.writeFile, filePath, jsonString).nodeify(callback);
  } 
  
  return Q.reject(new Error('Manifest content is empty or invalid.')).nodeify(callback);
}

function validateAndNormalizeStartUrl(siteUrl, manifestInfo, callback) {
  if (manifestInfo.format !== c.BASE_MANIFEST_FORMAT) {
    return callback(new Error('The manifest found is not a W3C manifest.'), manifestInfo);
  }
  
  if (manifestInfo.content.start_url) {
    if (!utils.isURL(manifestInfo.content.start_url)) {
      return callback(new Error('The manifest\'s start_url member is not a valid URL: \'' + manifestInfo.content.start_url + '\''), manifestInfo);
    }
  } else {
    manifestInfo.content.start_url = '/';
  }
  
  if (siteUrl) {
    if (!utils.isURL(siteUrl)) {
      return callback(new Error('The site URL is not a valid URL: \'' + siteUrl + '\''), manifestInfo);
    }
    
    var parsedSiteUrl = url.parse(siteUrl);
    var parsedManifestStartUrl = url.parse(manifestInfo.content.start_url);
    if (parsedManifestStartUrl.hostname && parsedSiteUrl.hostname !== parsedManifestStartUrl.hostname) {
       // issue #88 - bis
      var subDomainOfManifestStartUrlSplitted = parsedManifestStartUrl.hostname.split('.');
      var lengthSubDomain = subDomainOfManifestStartUrlSplitted.length;
      var subDomainOfManifestStartUrl = null;
      if(lengthSubDomain >= 2){
        subDomainOfManifestStartUrl = 
        subDomainOfManifestStartUrlSplitted[lengthSubDomain - 2] + '.' + subDomainOfManifestStartUrlSplitted[lengthSubDomain - 1];
      }
      if(!subDomainOfManifestStartUrl || !utils.isURL(subDomainOfManifestStartUrl) || parsedSiteUrl.hostname.toLowerCase() !== subDomainOfManifestStartUrl.toLowerCase()){
        return callback(new Error('The domain of the hosted site (' + parsedSiteUrl.hostname + ') does not match the domain of the manifest\'s start_url member (' + parsedManifestStartUrl.hostname + ')'), manifestInfo);
      }
    }
    
    manifestInfo.content.start_url = url.resolve(siteUrl, manifestInfo.content.start_url);
    
    manifestInfo.default = { short_name: getDefaultShortName(siteUrl) };
  }

  return callback(undefined, manifestInfo);
}

module.exports = {
  getManifestFromSite: getManifestFromSite,
  getManifestFromFile: getManifestFromFile,
  writeToFile: writeToFile,
  fetchManifestUrlFromSite: fetchManifestUrlFromSite,
  downloadManifestFromUrl: downloadManifestFromUrl,
  validateAndNormalizeStartUrl: validateAndNormalizeStartUrl,
  convertTo: convertTo
};
