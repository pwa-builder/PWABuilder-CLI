#!/usr/bin/env node

var validations = require('./lib/common/validations'),
    manifestTools = require('./lib/manifestTools'),
    projectBuilder = require('./lib/projectBuilder'),
    projectTools = require('./lib/projectTools'),
    platformUtils = require('./lib/platformUtils'),
    version = require('./lib/common/version'),
    url = require('url'),
    log = require('loglevel'),
    path = require('path');

version.checkForUpdate(function (err, updateAvailable) {
  if (!err && updateAvailable) {
    console.log();
    console.log('*******************************************************************************');
    console.log('A new version of ManifoldJS is available (v' + updateAvailable + ').');
    console.log('We recommend that you upgrade.');
    console.log('*******************************************************************************');
    console.log();
  }
});

function checkParameters(program) {
  var unknownArgs = 0;
  if (program.args.length > 0) {
    var command = program.args[0].toLowerCase();
    switch (command) {
      case 'run':
        if (program.args.length < 2) {
          return 'ERROR: You must specify a platform (windows | android).';
        } 
        
        if (!validations.platformToRunValid(program.args[1])) {
          return 'ERROR: Invalid platform specified - [' + program.args[1] + '].';
        }

        unknownArgs = 2;
        program.run = true;
        break;
      case 'package':
        if (program.args.length < 2) {
          return 'ERROR: You must specify a content directory.';
        }
        
        if (program.args.length < 3) {
          return 'ERROR: You must specify an output package path.';
        }

        unknownArgs = 3;
        program.package = true;
        break;
      case 'visualstudio':
        unknownArgs = 1;
        program.visualstudio = true;
        break;
      default:
        unknownArgs = 1;
        break;
    }
  } else {
    if (!program.manifest) {
      return 'ERROR: You must specify either the web site URL or the location of a W3C manifest (-m | --manifest).';
    }
  }

  if (program.args.length > unknownArgs) {
    return 'ERROR: Unexpected parameters - [' + program.args.slice(unknownArgs).join() + '].';
  }

  // check platforms
  if (program.platforms) {
    var platforms = program.platforms.split(/[\s,]+/);
    if (!validations.platformsValid(platforms)) {
      return 'ERROR: Invalid platform(s) specified.';
    }
  }

  // check log level
  if (program.loglevel) {
    if (!validations.logLevelValid(program.loglevel)) {
      return 'ERROR: Invalid loglevel specified. Valid values are: debug, trace, info, warn, error';
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
                    '         manifoldjs package <content-directory> <output-package-path>\n' +
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
             .option('-w, --webAppToolkit', 'adds the Web App Toolkit cordova plugin', false)
             .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.help();
}

var validationResult = checkParameters(program);
if (validationResult) {
  console.log(validationResult);
  process.exit(1);
}

global.logLevel = program.loglevel;
log.setLevel(global.logLevel);

if (program.run) {
  // Run the app for the specified platform

  var platform = program.args[1];
  projectTools.runApp(platform, function (err) {
    if (err) {
      log.error('ERROR: ' + err.message);
    }
  });

} else if (program.visualstudio) {

  projectTools.openVisualStudio(function (err) {
    if (err) {
      log.error('ERROR: ' + err.message);
    } else {
      log.info('The Visual Studio project was opened successfully!');
    }
  });

} else if (program.package) {
  // creates App Store packages for publishing - currently supports Windows 10 only
  log.info('Creating a Windows Store AppX package for the Windows 10 hosted app project...');
  var directory = program.args[1];
  var outputPath = program.args[2];
  platformUtils.makeAppx(directory, outputPath, function (err) {
    if (err) {
      log.error('ERROR: ' + err.message);
      return;
    }

    log.info('The app store package was created successfully!');
  });
} else {
  var siteUrl = program.args[0];
  var rootDir = program.directory ? path.resolve(program.directory) : process.cwd();
  var platforms = program.platforms.split(/[\s,]+/);
  
  // remove windows as default platform if run on Linux or MacOS
  // Fix for issue # 115: https://github.com/manifoldjs/ManifoldJS/issues/115
  // it should be removed once cordova adds support for Windows on Linux and MacOS
  if (!platformUtils.isWindows && 
       program.rawArgs.indexOf('-p') === -1 && 
       program.rawArgs.indexOf('--platforms')  === -1) {
    platforms.splice(platforms.indexOf('windows'), 1);
  }
  
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
    
    // add generatedFrom value to manifestInfo for telemetry
    manifestInfo.generatedFrom = 'CLI';

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
