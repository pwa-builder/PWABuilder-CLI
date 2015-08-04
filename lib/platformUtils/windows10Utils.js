'use strict';

var utils = require('../common/utils'),
    url = require('url'),
    fs = require('fs'),
    path = require('path'),
    request = require('request'),
    archiver = require('archiver'),
    cloudappx = require('cloudappx-server'),
    log = require('loglevel'),
    os = require('os');
var version = require('../common/version');
var metadataItemTemplate=  '\r\n\t\t<build:Item Name ="{0}" Version ="{1}" />';

var serviceEndpoint = 'http://cloudappx.azurewebsites.net';

function replaceManifestValues(w3cManifestInfo, content) {
  var w3cManifest = w3cManifestInfo.content;
  var timestamp = w3cManifestInfo.timestamp || new Date().toISOString().replace(/T/, ' ').replace(/\.[0-9]+/, ' ');
  var replacedContent = content;
  var guid = utils.newGuid();
  
  var applicationId = utils.sanitizeName(w3cManifest.short_name);

  // Update general properties
  replacedContent = replacedContent.replace(/{IdentityName}/g, guid)
                                    .replace(/{PhoneProductId}/g, guid)
                                    .replace(/{DisplayName}/g, w3cManifest.short_name)
                                    .replace(/{ApplicationId}/g, applicationId)
                                    .replace(/{StartPage}/g, w3cManifest.start_url)
                                    .replace(/{DisplayName}/g, w3cManifest.short_name)
                                    .replace(/{Description}/g, w3cManifest.name || w3cManifest.short_name)
                                    .replace(/{RotationPreference}/g, w3cManifest.orientation || 'portrait')
                                    .replace(/{ManifoldJSVersion}/g, version.getCurrentPackageVersion())
                                    .replace(/{GeneratedFrom}/g, w3cManifestInfo.generatedFrom || 'API')
                                    .replace(/{GenerationDate}/g, timestamp);

  // Add additional metadata items
  var metadataItems = '';
  if (w3cManifestInfo.generatedUrl) {
    metadataItems += metadataItemTemplate.replace(/\{0}/g, 'GeneratedURL')
                                         .replace(/\{1}/g, w3cManifestInfo.generatedUrl);
  }
  
  replacedContent = replacedContent.replace(/{MetadataItems}/g, metadataItems);
  
  // Update access rules
  var indentationChars = '\r\n\t\t\t\t';

  // Set the base access rule using the start_url's base url
  var baseUrlPattern = url.resolve(w3cManifest.start_url, '/');
  var baseApiAccess = 'none';
  if (w3cManifest.scope && w3cManifest.scope.length) {
    // If the scope is defined, the base access rule is defined by the scope
    var parsedScopeUrl = url.parse(w3cManifest.scope);

    if (parsedScopeUrl.host && parsedScopeUrl.protocol) {
      baseUrlPattern = w3cManifest.scope;
    } else {
      baseUrlPattern = url.resolve(baseUrlPattern, w3cManifest.scope); 
    }
  }
  
  // If the base access rule ends with '/*', remove the '*'.
  if (baseUrlPattern.indexOf('/*', baseUrlPattern.length - 2) !== -1) {
    baseUrlPattern = baseUrlPattern.substring(0, baseUrlPattern.length - 1);
  }

  var applicationContentUriRules = '';

  // Add additional access rules
  if (w3cManifest.mjs_access_whitelist && w3cManifest.mjs_access_whitelist instanceof Array) {    
    for (var j = 0; j < w3cManifest.mjs_access_whitelist.length; j++) {
      var accessUrl = w3cManifest.mjs_access_whitelist[j].url;
      // Ignore the '*' rule 
      if (accessUrl !== '*') {
        // If the access url ends with '/*', remove the '*'.
        if (accessUrl.indexOf('/*', accessUrl.length - 2) !== -1) {
          accessUrl = accessUrl.substring(0, accessUrl.length - 1);
        }
        
        var apiAccess = w3cManifest.mjs_access_whitelist[j].apiAccess || 'none'; 
        
        if (accessUrl === baseUrlPattern) {
          baseApiAccess = apiAccess;
        } else  {                     
          applicationContentUriRules += indentationChars + '<uap:Rule Type="include" WindowsRuntimeAccess="' + apiAccess + '" Match="' + accessUrl + '" />';
        }
      }
    }
  }

  // Added base rule
  applicationContentUriRules = '<uap:Rule Type="include" WindowsRuntimeAccess="' + baseApiAccess + '" Match="' + baseUrlPattern + '" />' + applicationContentUriRules;

  replacedContent = replacedContent.replace(/{ApplicationContentUriRules}/g, applicationContentUriRules);

  return replacedContent;
}

function invokeCloudAppX(appName, appFolder, outputPath, callback) {
  var archive = archiver('zip');
  var zipFile = path.join(os.tmpdir(), appName + '.zip');
  var output = fs.createWriteStream(zipFile);
  archive.on('error', function (err) {
    callback && callback(err);
  });

  archive.pipe(output);

  archive.directory(appFolder, appName);
  archive.finalize();
  output.on('close', function () {
    var options = {
      method: 'POST',
      url: url.resolve(serviceEndpoint, '/v2/build'),
      encoding: 'binary'
    };
    log.debug('Invoking the CloudAppX service...');

    var req = request.post(options, function (err, resp, body) {
      if (err) {
        return callback && callback(err);
      }

      if (resp.statusCode != 200) {
        return callback && callback(new Error('Failed to create the package. The CloudAppX service returned an error - ' + resp.statusMessage + ' (' + resp.statusCode + '): ' + body));
      }

      fs.writeFile(outputPath, body, { "encoding": 'binary' }, function (err) {
        if (err) {
          return callback && callback(err);
        }

        fs.unlink(zipFile, function (err) {
          return callback && callback(err);
        });
      });
    });

    req.form().append('xml', fs.createReadStream(zipFile));
  });
}

var makeAppx = function (appFolder, outputPath, callback) {
  var outputData = path.parse(outputPath);
  var options = { "dir": appFolder, "name": outputData.name, "out": outputData.dir };
  cloudappx.makeAppx(options).then(
    function (output) {
      callback && callback();
    },
    function (err) {
      log.debug('Unable to create the package locally. Invoking the CloudAppX service instead...');
      invokeCloudAppX(outputData.name, appFolder, outputPath, function (err) {
        callback && callback(err);
      });
    }
  );
}

module.exports = {
  replaceManifestValues: replaceManifestValues,
  makeAppx: makeAppx
};
