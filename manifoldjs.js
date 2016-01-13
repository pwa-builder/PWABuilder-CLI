#!/usr/bin/env node

var url = require('url'),
    path = require('path');

var Q = require('q');

var lib = require('manifoldjs-lib');

var CustomError = lib.CustomError,
    fileTools = lib.fileTools,
    log = lib.log,
    manifestTools = lib.manifestTools,
    packageTools = lib.packageTools,
    projectBuilder = lib.projectBuilder,
    projectTools = lib.projectTools,
    utils = lib.utils,
    validations = lib.validations; 

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
        unknownArgs = 1;
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

var isWindows10Version = function (version) {
  return /^10/.test(version);
};

function runApp (platform) {
  if (!validations.platformToRunValid(platform)) {
    return log.error('Invalid platform specified.');
  }

  Q().then(function () {
    if (platform.toUpperCase() !== 'WINDOWS') {
      return Q.resolve(platform);
    }
    
    if (!utils.isWindows) {
      return Q.reject(new Error('Windows projects can only be executed in Windows environments.'));
    }
    
    var windowsManifest = 'appxmanifest.xml';
    return Q.nfcall(fileTools.searchFile, process.cwd(), windowsManifest).then(function (results) {
      return Q.nfcall(projectTools.getWindowsVersion).then(function (version) {
        if (results && results.length > 0 && isWindows10Version(version)) {
          // If there is a windows app manifest and the OS is Windows 10, install the windows 10 app
          return 'windows10';
        }
        
        return 'windows';
      });
    })
    .catch (function (err) {
        return Q.reject(new CustomError('Failed to find the Windows app manifest.', err));      
    })        
  })
  .then(projectBuilder.runApp)
  .catch(function (err) {
    log(err.getMessage());
  });  
}

function launchVisualStudio() {
  projectTools.openVisualStudio(function (err) {
    if (err) {
      log.error('ERROR: ' + err.message);
    } else {
      log.info('The Visual Studio project was opened successfully!');
    }
  });  
}

function packageApps() {
  // create app store packages for publishing
  var platforms = program.platforms.split(/[\s,]+/);
  projectBuilder.packageApps(platforms, process.cwd()).then(function () {
    log.write('The app store package(s) are ready.');
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
}

function generateApp(siteUrl) {
  
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

var program = require('commander')
             .usage('<website-url> [options]'
                    + '\n'
                    + '\n           available options:'
                    + '\n'
                    + '\n             -d | --directory, -s | --short-name, -l | --loglevel,'
                    + '\n             -p | --platforms, -m | --manifest,   -c | --crosswalk'                      
                    + '\n  -or-'
                    + '\n'
                    + '\n         manifoldjs -m <manifest-location> [options]'
                    + '\n'
                    + '\n           available options:'
                    + '\n'
                    + '\n             -d | --directory, -s | --short-name, -l | --loglevel,'
                    + '\n             -p | --platforms, -m | --manifest,   -c | --crosswalk'                      
                    + '\n  -or-'
                    + '\n         manifoldjs package [options]'
                    + '\n'
                    + '\n           available options:'
                    + '\n'
                    + '\n             -l | --loglevel,  -p | --platforms'
                    + '\n'
                    + '\n  -or-'
                    + '\n         manifoldjs run <windows|android>'
                    + '\n'
                    + '\n  -or-'
                    + '\n         manifoldjs visualstudio')
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

packageTools.checkForUpdate(function (err, updateAvailable) {
  if (!err && updateAvailable) {
    console.log();
    console.log('*******************************************************************************');
    console.log('A new version of ManifoldJS is available (v' + updateAvailable + ').');
    console.log('We recommend that you upgrade.');
    console.log('*******************************************************************************');
    console.log();
  }
});

if (program.run) {
  var platform = program.args[1];
  runApp(platform);
} else if (program.visualstudio) {
  launchVisualStudio();
} else if (program.package) {
  packageApps();
} else {
  var siteUrl = program.args[0];
  generateApp(siteUrl);
}
