'use strict';

var url = require('url'),
    path = require('path');

var lib = require('manifoldjs-lib');

var log = lib.log,
    manifestTools = lib.manifestTools,
    projectBuilder = lib.projectBuilder,
    utils = lib.utils;

function getW3cManifest(siteUrl, manifestLocation, callback) {
  function resolveStartURL(err, manifestInfo) {
    if (err) {
      return callback(err, manifestInfo);
    }

    return manifestTools.validateAndNormalizeStartUrl(siteUrl, manifestInfo, callback);
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
      manifestTools.downloadManifestFromUrl(manifestLocation, resolveStartURL);
    } else {
      // read local manifest file
      log.info('Reading manifest file ' + manifestLocation + '...');
      manifestTools.getManifestFromFile(manifestLocation, resolveStartURL);
    }
  } else if (siteUrl) {    
    // scan a site to retrieve its manifest
    log.info('Scanning ' + siteUrl + ' for manifest...');
    manifestTools.getManifestFromSite(siteUrl, resolveStartURL);
  } else {
    return callback(new Error('A site URL or manifest should be specified.'));
  }
}

function generateApp(program) {
  
  var siteUrl = program.args[0];
  var rootDir = program.directory ? path.resolve(program.directory) : process.cwd();
  var platforms = program.platforms.split(/[\s,]+/);
  
  // remove windows as default platform if run on Linux or MacOS
  // Fix for issue # 115: https://github.com/manifoldjs/ManifoldJS/issues/115
  // it should be removed once cordova adds support for Windows on Linux and MacOS
  if (!utils.isWindows && 
       program.rawArgs.indexOf('-p') === -1 && 
       program.rawArgs.indexOf('--platforms')  === -1) {
    platforms.splice(platforms.indexOf('windows'), 1);
  }
  
  getW3cManifest(siteUrl, program.manifest, function (err, manifestInfo) {
    if (err) {
      return log.error('ERROR: ' + err.message);
    }

      // Fix #145: don't require a short name
    manifestInfo.content.short_name =   manifestInfo.content.short_name || 
                                        manifestInfo.content.name ||
                                        manifestInfo.default.short_name;

    // if specified as a parameter, override the app's short name
    if (program.shortname) {
      manifestInfo.content.short_name = program.shortname;
    }
 
    log.debug('Manifest contents:');
    log.debug(JSON.stringify(manifestInfo.content, null, 4));
    
    // add generatedFrom value to manifestInfo for telemetry
    manifestInfo.generatedFrom = 'CLI';

    // Create the apps for the specified platforms
    projectBuilder.createApps(manifestInfo, rootDir, platforms, program).then(function () {
      log.info('The application(s) are ready.');
    })
    .catch(function (err) {
      var errmsg = err.getMessage();
      if (log.getLevel() !== log.levels.DEBUG) {
        errmsg += '\nFor more information, run manifoldjs with the diagnostics level set to debug (e.g. manifoldjs [...] -l debug)';
      }

      log.error(errmsg);
    })
    .done(function () {
      log.write('All done!');        
    });
  });
}

module.exports = generateApp;