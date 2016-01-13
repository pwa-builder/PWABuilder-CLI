#!/usr/bin/env node
'use strict';

var lib = require('manifoldjs-lib');

var log = lib.log,
    packageTools = lib.packageTools,
    validations = lib.validations; 

var commands = require('./commands');

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
  
  if (program.run) {
    commands.run(program);
  }
  else if (program.visualstudio) {
    commands.visualstudio(program);
  }
  else if (program.package) {
    commands.package(program);
  }
  else {
    commands.generate(program);
  }  
});

