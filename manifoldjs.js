#!/usr/bin/env node

var validations = require('./lib/common/validations'),
    manifestTools = require('./lib/manifestTools'),
    projectBuilder = require('./lib/projectBuilder'),
    projectTools = require('./lib/projectTools'),
    url = require('url'),
    log = require('loglevel'),
    path = require('path');

function checkParameters(argv) {
  if (argv._.length < 1) {
    throw 'ERROR: Missing required parameters.';
  } else if(argv._.length === 1) {
    if (argv._[0].toLowerCase() === 'run') {
      throw 'ERROR: Missing platform parameter.';
    }
  } else if (argv._.length === 2) {
    if (argv._[0].toLowerCase() !== 'run') {
      throw 'ERROR: Invalid parameters.';
    } else {
      if (!validations.platformToRunValid(argv._[1])) {
        throw 'ERROR: Invalid platform specified.';
      }
    }
  } else {
    throw 'ERROR: Unexpected parameters.';
  }

  // check platforms
  if (argv.platforms) {
    var platforms = argv.platforms.split(/[\s,]+/);
    if (!validations.platformsValid(platforms)) {
      throw 'ERROR: Invalid platform(s) specified.';
    }
  }

  // check log level
  if (argv.loglevel) {
    if (!validations.logLevelValid(argv.loglevel)) {
      throw 'ERROR: Invalid loglevel specified. Valid values are: debug, trace, info, warn, error';
    }
  }
}

function getW3cManifest(siteUrl, manifestLocation, callback) {
  function resolveStartURL(err, manifestInfo) {
    if (err) {
      return callback(err, manifestInfo);
    }

    return manifestTools.validateAndNormalizeStartUrl(siteUrl, manifestInfo, callback);
  }

  var parsedSiteUrl = url.parse(siteUrl);

  if (!parsedSiteUrl.hostname) {
    return callback(new Error('The site URL is not a valid URL.'));
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
  } else {
    // scan a site to retrieve its manifest
    log.info('Scanning ' + siteUrl + ' for manifest...');
    manifestTools.getManifestFromSite(siteUrl, resolveStartURL);
  }
}

var parameters = require('optimist')
                .usage('Usage: manifoldjs <website-url> [-d <app-directory>] [-s <short-name>]\n' +
                       '                                [-p <platforms>] [-l <log-level>]\n' +
                       '                                [-b] [-m <manifest-file>]\n' +
                       '-or-\n' +
                       '       manifoldjs run <windows|android>')
                .alias('d', 'directory')
                .alias('s', 'shortname')
                .alias('p', 'platforms')
                .alias('l', 'loglevel')
                .alias('b', 'build')
                .default('p', 'windows10,windows81,android,ios,chrome,web,firefox')
                .alias('m', 'manifest')
                .default('l', 'warn')
                .default('b', false)
                .describe('p', '[windows10][,windows81][,android][,ios][,chrome][,web][,firefox]')
                .describe('l', 'debug|trace|info|warn|error')
                .check(checkParameters)
                .argv;

global.logLevel = parameters.loglevel;
log.setLevel(global.logLevel);

if (parameters._[0].toLowerCase() === 'run') {
  // Run the app for the specified platform

  var platform = parameters._[1];
  projectTools.runApp(platform, function (err) {
    if (err) {
      log.error('ERROR: ' + err.message);
    }
  });

} else if (parameters._[0].toLowerCase() === 'visualstudio') {

  projectTools.openVisualStudio(function (err) {
    if (err) {
      log.error('ERROR: ' + err.message);
    } else {
      log.info('The Visual Studio project was opened successfully!');
    }
  });

} else {
  var siteUrl = parameters._[0];
  var rootDir = parameters.directory ? path.resolve(parameters.directory) : process.cwd();
  var platforms = parameters.platforms.split(/[\s,]+/);
  getW3cManifest(siteUrl, parameters.manifest, function (err, manifestInfo) {
    if (err) {
      log.error('ERROR: ' + err.message);
      return;
    }

    // if specified as a parameter, override the app's short name
    if (parameters.s) {
      manifestInfo.content.short_name = parameters.s;
    }
    
    log.debug('Manifest contents:');
    log.debug(JSON.stringify(manifestInfo.content, null, 4));
    
    // Create the apps for the specified platforms
    projectBuilder.createApps(manifestInfo, rootDir, platforms, parameters.build, function (err) {
      if (err) {
        var errmsg = err.message;
        if (global.logLevel !== 'debug') {
          errmsg += ' For more information, run manifoldjs with the diagnostics level set to debug (e.g. manifoldjs [...] -l debug)';
        }

        log.error(errmsg);
        return;
      }
      
      log.info('The application(s) are ready!');
    });
  });
}
