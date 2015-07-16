#!/usr/bin/env node

var validations = require('./lib/common/validations'),
    manifestTools = require('./lib/manifestTools'),
    projectBuilder = require('./lib/projectBuilder'),
    projectTools = require('./lib/projectTools'),
    version = require('./lib/common/version'),
    url = require('url'),
    log = require('loglevel'),
    path = require('path');

version.checkForUpdate(function (err, updateAvailable) {
  if (!err && updateAvailable) {
    console.log();
    console.log('*****************************************************************************************');
    console.log('*** A new version of ManifoldJS is available (v' + updateAvailable + '). We recommend that you upgrade. ***');
    console.log('*****************************************************************************************');
    console.log();
  }
});

function checkParameters(program) {
  if (program.args.length === 0 && !program.manifest) {
    console.error('ERROR: Missing required parameters. Either the web site URL or the location of a W3C manifest should be specified.');
    process.exit(1);
  } else if(program.args.length === 1) {
    if (program.args[0].toLowerCase() === 'run') {
      console.error('ERROR: Missing platform parameter.');
      process.exit(1);
    }
  } else if (program.length === 2) {
    if (program.args[0].toLowerCase() !== 'run') {
      console.error('ERROR: Invalid parameters.');
      process.exit(1);
    } else {
      if (!validations.platformToRunValid(program.args[1])) {
        console.error('ERROR: Invalid platform specified.');
        process.exit(1);
      }
    }
  } else if (program.length > 2) {
    console.error('ERROR: Unexpected parameters.');
    process.exit(1);
  }

  // check platforms
  if (program.platforms) {
    var platforms = program.platforms.split(/[\s,]+/);
    if (!validations.platformsValid(platforms)) {
      console.error('ERROR: Invalid platform(s) specified.');
      process.exit(1);
    }
  }

  // check log level
  if (program.loglevel) {
    if (!validations.logLevelValid(program.loglevel)) {
      console.error('ERROR: Invalid loglevel specified. Valid values are: debug, trace, info, warn, error');
      process.exit(1);
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

var program = require('commander')
             .usage('<website-url> [options]\n' +
                    '  -or-\n' +
                    '         manifoldjs -m <manifest-location> [options]\n' +
                    '  -or-\n' +
                    '         manifoldjs run <windows|android>\n' +
                    '  -or-\n' +
                    '         manifoldjs visualstudio')
             .option('-d, --directory <app-dir>', 'path to the generated project files')
             .option('-s, --shortname <short-name>', 'application short name')
             .option('-l, --loglevel <log-level>', 'debug|info|warn|error', 'warn')
             .option('-p, --platforms <platforms>', '[windows][,windows10][,android][,ios]\n                                    ' +
                                                    '[,chrome][,web][,firefox]', 'windows,windows10,android,ios,chrome,web,firefox')
             .option('-b, --build', 'forces the building process', false)
             .option('-m, --manifest <manifest-location>', 'location of the W3C Web App manifest\n                                    ' +
                                                    'file (URL or local path)')
             .option('-c, --crosswalk', 'enable Crosswalk for Android', false)
             .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.help();
}

checkParameters(program);

global.logLevel = program.loglevel;
log.setLevel(global.logLevel);

if (program.args[0] && program.args[0].toLowerCase() === 'run') {
  // Run the app for the specified platform

  var platform = program.args[1];
  projectTools.runApp(platform, function (err) {
    if (err) {
      log.error('ERROR: ' + err.message);
    }
  });

} else if (program.args[0] && program.args[0].toLowerCase() === 'visualstudio') {

  projectTools.openVisualStudio(function (err) {
    if (err) {
      log.error('ERROR: ' + err.message);
    } else {
      log.info('The Visual Studio project was opened successfully!');
    }
  });

} else {
  var siteUrl = program.args[0];
  var rootDir = program.directory ? path.resolve(program.directory) : process.cwd();
  var platforms = program.platforms.split(/[\s,]+/);
  getW3cManifest(siteUrl, program.manifest, function (err, manifestInfo) {
    if (err) {
      log.error('ERROR: ' + err.message);
      return;
    }

    // if specified as a parameter, override the app's short name
    if (program.shortname) {
      manifestInfo.content.short_name = program.shortname;
    }
    
    log.debug('Manifest contents:');
    log.debug(JSON.stringify(manifestInfo.content, null, 4));
    
    // Create the apps for the specified platforms
    projectBuilder.createApps(manifestInfo, rootDir, platforms, program, function (err) {
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