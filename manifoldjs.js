#!/usr/bin/env node
'use strict';

var lib = require('manifoldjs-lib');

var log = lib.log,
    packageTools = lib.packageTools,
    platformTools = lib.platformTools,
    validations = lib.validations; 

var commands = require('./commands');

function checkParameters(program) {
  var unknownArgs = 0;
  if (program.args.length > 0) {
    var command = program.args[0].toLowerCase();
    switch (command) {
      case 'run':
        unknownArgs = 2;
        program.run = true;
        break;
      case 'package':        
        unknownArgs = 1;
        program.package = true;
        break;
      case 'platform':
        unknownArgs = 5;
        program.platform = true;
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
}

// get the list of registered platforms
var availablePlatforms = platformTools.listPlatformsSync();

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
  }, '').replace(/\n/g, '\n' + Array(columnOffset - 1).join(' '));  
}

var program = require('commander')
             .usage('<website-url> [options]'
                    + '\n         manifoldjs -m <manifest-location> [options]'
                    + '\n           options:'
                    + '\n             -d | --directory, -s | --short-name, -l | --loglevel,'
                    + '\n             -p | --platforms, -m | --manifest,   -c | --crosswalk'                      
                    + '\n  -or-'
                    + '\n         manifoldjs package [options]'
                    + '\n           options:'
                    + '\n             -l | --loglevel,  -p | --platforms'
                    + '\n'
                    + '\n  -or-'
                    + '\n         manifoldjs platform add <platform-id> <module-name> <source>'
                    + '\n         manifoldjs platform remove <platform-id>'
                    + '\n         manifoldjs platform list'
                    + '\n'
                    + '\n  -or-'
                    + '\n         manifoldjs run <windows|android>'
                    + '\n'
                    + '\n  -or-'
                    + '\n         manifoldjs visualstudio')
             .option('-d, --directory <app-dir>', 'path to the generated project files')
             .option('-s, --shortname <short-name>', 'application short name')
             .option('-l, --loglevel <log-level>', 'debug|info|warn|error', 'warn')
             .option('-p, --platforms <platforms>', getPlatformHelpText(), availablePlatforms.join(',')) 
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
  log.error(validationResult);
  process.exit(1);
}

global.logLevel = program.loglevel;
log.setLevel(global.logLevel);

packageTools.checkForUpdate(function (err, updateAvailable) {
  if (!err && updateAvailable) {
    log.write();
    log.write('*******************************************************************************');
    log.write('A new version of ManifoldJS is available (v' + updateAvailable + ').');
    log.write('We recommend that you upgrade.');
    log.write('*******************************************************************************');
    log.write();
  }
  
  if (program.run) {
    commands.run(program);
  }
  else if (program.visualstudio) {
    commands.visualstudio(program);
  }
  else if (program.package) {
    commands.package(program);
  }
  else if (program.platform) {
    commands.platform(program);
  }
  else {
    commands.generate(program);
  }  
});
