'use strict';

var url = require('url'),
    path = require('path');

var Q = require('q');

var lib = require('manifoldjs-lib');

var log = lib.log,
    manifestTools = lib.manifestTools,
    platformTools = lib.platformTools,
    projectBuilder = lib.projectBuilder,
    utils = lib.utils;

var build = require('./package');

function getW3cManifest(siteUrl, manifestLocation, manifestFormat, callback) {
  function resolveStartURL(err, manifestInfo) {
    if (err) {
      return callback(err, manifestInfo);
    }

    if (manifestInfo.format === lib.constants.BASE_MANIFEST_FORMAT) {
      return manifestTools.validateAndNormalizeStartUrl(siteUrl, manifestInfo, callback);
    } else {
      return callback(undefined, manifestInfo);
    }
  }
  
  if (siteUrl) {
    var parsedSiteUrl = url.parse(siteUrl);
    if (!parsedSiteUrl.hostname) {
      return callback(new Error('The site URL is not a valid URL.'));
    }
  }

  if (manifestLocation) {
    var parsedManifestUrl = url.parse(manifestLocation);
    if (parsedManifestUrl && parsedManifestUrl.host) {
      // download manifest from remote location
      log.info('Downloading manifest from ' + manifestLocation + '...');
      manifestTools.downloadManifestFromUrl(manifestLocation, manifestFormat, resolveStartURL);
    } else {
      // read local manifest file
      log.info('Reading manifest file ' + manifestLocation + '...');
      manifestTools.getManifestFromFile(manifestLocation, manifestFormat, resolveStartURL);
    }
  } else if (siteUrl) {    
    // scan a site to retrieve its manifest
    log.info('Scanning ' + siteUrl + ' for manifest...');
    manifestTools.getManifestFromSite(siteUrl, manifestFormat, resolveStartURL);
  } else {
    return callback(new Error('A site URL or manifest should be specified.'));
  }
}

function generateApp(program) {
  
  var siteUrl = program.args[0];
  var rootDir = program.directory ? path.resolve(program.directory) : process.cwd();
  
  var deferred = Q.defer();
  
  function callback (err, manifestInfo) {
    if (err) {
      return deferred.reject(err);
    }
    
    // Fix #145: don't require a short name
    manifestInfo.content.short_name = manifestInfo.content.short_name || 
                                      manifestInfo.content.name ||
                                      manifestInfo.default.short_name;

    // if specified as a parameter, override the app's short name
    if (program.shortname) {
      manifestInfo.content.short_name = program.shortname;
    }
 
    log.debug('Manifest contents:\n' + JSON.stringify(manifestInfo.content, null, 4));
    
    // add generatedFrom value to manifestInfo for telemetry
    manifestInfo.generatedFrom = 'CLI';

    var platforms = [];
    if (program.platforms) {
      platforms = program.platforms.split(/[\s,]+/);
    } else {
      platforms = platformTools.listPlatforms();
      // Remove edgeextension from the default platforms for W3C manifests
      if (manifestInfo.format === lib.constants.BASE_MANIFEST_FORMAT) {
        var edgeIndex = platforms.indexOf('edgeextension');
        if (edgeIndex > -1) {
          log.debug('Removing Edge Extension platform. The W3C manifest format is not currently supported by this platform.');
          platforms.splice(edgeIndex, 1);
        }
      }
    }

    // Create the apps for the specified platforms
    return projectBuilder.createApps(manifestInfo, rootDir, platforms, program).then(function (projectDir) {
      if (program.build) {
        program.args[1] = projectDir;
        return build(program, platforms).catch(function (err) {
          log.warn('One or more platforms could not be built successfully. Correct any errors and then run manifoldjs package [project-directory] [options] to build the applications.');
          // return deferred.reject(err);
        });
      }
    })
    .then(function () {
      log.info('The application(s) are ready.');
      return deferred.resolve();
    })
    .catch(function (err) {
      return deferred.reject(err);
    });
  };
  
  getW3cManifest(siteUrl, program.manifest, program.forceManifestFormat, callback);
  
  return deferred.promise;
};

module.exports = generateApp;