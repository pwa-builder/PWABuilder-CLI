#!/usr/bin/env node
'use strict';

var Q = require('q');

var lib = require('manifoldjs-lib');

var log = lib.log,
    packageTools = lib.packageTools,
    platformTools = lib.platformTools,
    manifestTools = lib.manifestTools,
    validations = lib.validations; 

var commands = require('./commands');

// Get the available formats for the --forceManifestFormat parameter
var availableManifestFormats = manifestTools.listAvailableManifestFormats();

function checkParameters(program) {
  var unknownArgs = 0;
  if (program.args.length > 0) {
    var command = program.args[0].toLowerCase();
    switch (command) {
      case 'run':
        unknownArgs = 3;
        program.run = true;
        break;
      case 'package':        
        unknownArgs = 2;
        program.package = true;
        break;
      case 'platform':
        unknownArgs = 4;
        program.platform = true;
        break;        
      case 'open':
        unknownArgs = 3;
        program.open = true;
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
      return 'You must specify either the web site URL or the location of a W3C manifest (-m | --manifest).';
    }
  }

  if (program.args.length > unknownArgs) {
    return 'Unexpected parameters - [' + program.args.slice(unknownArgs).join() + '].';
  }

  // check platforms
  // TODO: loading registered platforms twice, by calling platformsValid and to generate the usage text. Consolidate!
  if (program.platforms) {
    var platforms = program.platforms.split(/[\s,]+/);
    if (!validations.platformsValid(platforms)) {
      return 'Invalid platform(s) specified.';
    }
  }

  // check log level
  if (program.loglevel) {
    if (!validations.logLevelValid(program.loglevel)) {
      return 'Invalid loglevel specified. Valid values are: debug, info, warn, error.';
    }
  }

  if (program.forceManifestFormat) {
    if (!validations.manifestFormatValid(program.forceManifestFormat)) {
      return 'Invalid manifest format specified. Valid values are: ' + availableManifestFormats.join(', ') + '.';
    }
  }
}

// get the list of registered platforms
var availablePlatforms = platformTools.listPlatforms();

// dynamically generates the help text with the list of registered
// platforms and splits it into multiple lines so that it doesn't 
// break the layout of the usage text
function getPlatformHelpText() {
  // offset of the column where the parameter help text starts
  var columnOffset = 38;

  // maximum width of the help text 
  var maxWidth = 80;

  return availablePlatforms.reduce(function (list, platform) {  
    var segmentLength = list.length - list.lastIndexOf('\n') - 1;
    if (segmentLength > maxWidth - columnOffset) {
      list += '\n';
    }
    
    return list + '[' + (list ? ',' : '') + platform + ']';  
  }, '').replace(/\n/g, '\n' + new Array(columnOffset - 1).join(' '));  
}

var program = require('commander')
             .usage('<website-url> [options]' +
                    '\n         manifoldjs -m <manifest-location> [options]' +
                    '\n           options:' +
                    '\n             -d | --directory, -s | --short-name, -l | --loglevel,' +
                    '\n             -p | --platforms, -m | --manifest, -f | --forceManifestFormat, -c | --crosswalk' +                    
                    '\n  -or-' +
                    '\n         manifoldjs package [project-directory] [options]' +
                    '\n           options:' +
                    '\n             -l | --loglevel,  -p | --platforms, -S | --Sign' +
                    '\n' +
                    '\n  -or-' +
                    '\n         manifoldjs platform add <platform-id> <source> [options]' +
                    '\n         manifoldjs platform remove <platform-id> [options]' +
                    '\n         manifoldjs platform list [options]' +
                    '\n           options:' +
                    '\n             -l | --loglevel' +
                    '\n' +
                    '\n  -or-' +
                    '\n         manifoldjs run <platform> [project-directory]' +
                    '\n           options:' +
                    '\n             -l | --loglevel' +
                    '\n' +
                    '\n  -or-' +
                    '\n         manifoldjs open <platform> [project-directory]' +
                    '\n           options:' +
                    '\n             -l | --loglevel')
             .option('-d, --directory <app-dir>', 'path to the generated project files')
             .option('-s, --shortname <short-name>', 'application short name')
             .option('-l, --loglevel <log-level>', 'debug|info|warn|error', 'warn')
             .option('-p, --platforms <platforms>', getPlatformHelpText()) 
             .option('-b, --build', 'forces the building process', false)
             .option('-m, --manifest <manifest-location>', 'location of the W3C Web App manifest\n                                    ' +
                                                    'file (URL or local path)')
             .option('-c, --crosswalk', 'enable Crosswalk for Android', false)
             .option('-S, --Sign', 'return a signed package in windows', false)
             .option('-w, --webAppToolkit', 'adds the Web App Toolkit cordova plugin', false)
             .option('-f, --forceManifestFormat <format>', availableManifestFormats.join('|'))
             .option('-W, --DotWeb', 'generate a .web package in windows', false)
             .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.help();
}

var validationResult = checkParameters(program);
if (validationResult) {
  log.error(validationResult);
  process.exit(1);
}

global.logLevel = program.loglevel;
log.setLevel(global.logLevel);

if (process.env.NODE_ENV === 'development') {
  Q.longStackSupport = true;
}
packageTools.checkForUpdate(function (err, updateAvailable) {
  if (!err && updateAvailable) {
    log.write();
    log.write('*******************************************************************************');
    log.write('A new version of ManifoldJS is available (v' + updateAvailable + ').');
    log.write('We recommend that you upgrade.');
    log.write('*******************************************************************************');
    log.write();
  }
  
  var command;
  if (program.run) {
    command = commands.run(program);
  }
  else if (program.open) {
    command = commands.open(program);
  }
  else if (program.visualstudio) {
    command = commands.visualstudio(program);
  }
  else if (program.package) {
    command = commands.package(program);
  }
  else if (program.platform) {
    command = commands.platform(program);
  }
  else {
    command = commands.generate(program);
  }
  
  command.catch(function (err) {
    var errmsg = err.getMessage();
    if (log.getLevel() !== log.levels.DEBUG) {
      errmsg += '\nFor more information, run manifoldjs with the diagnostics level set to debug (e.g. manifoldjs [...] -l debug)';
    }

    log.error(errmsg);
  });
});
