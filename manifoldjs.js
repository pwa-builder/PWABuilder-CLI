#!/usr/bin/env node

var validations = require('./lib/common/validations'),
    constants = require('./lib/manifestTools/constants'),
    manifestTools = require('./lib/manifestTools'),
    projectBuilder = require('./lib/projectBuilder'),
    validationConstants = require('./lib/manifestTools/validationConstants');
    url = require('url'),
    log = require('loglevel');


function checkParameters(argv) {
    if (argv._.length < 1) {
        throw 'ERROR: Missing required <website-url> parameter.';
    } else if (argv._.length > 1) {
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

var parameters = require('optimist')
                .usage('Usage: node appmyweb <website-url> [-d <app-directory>] [-s <short-name>] [-p <platforms>] [-l <log-level>] [-b] [-m <manifest-file>]')
                .alias('d', 'directory')
                .alias('s', 'shortname')
                .alias('p', 'platforms')
                .alias('l', 'loglevel')
                .alias('b', 'build')
                .default('p', 'windows,android,ios,chrome,firefox')
                .alias('m', 'manifest')
                .default('l', 'warn')
                .default('b', false)
                .describe('p', '[windows][,android][,ios][,chrome][,firefox]')
                .describe('l', 'debug|trace|info|warn|error')
                .check(checkParameters)
                .argv;

var siteUrl = parameters._[0];
var rootDir = parameters.directory ? parameters.directory : process.cwd();
var platforms = parameters.platforms.split(/[\s,]+/);

global.logLevel = parameters.loglevel;
log.setLevel(global.logLevel);

manifestTools.getW3cManifest(siteUrl, parameters.manifest, function (err, manifestInfo) {
    if (err) {
        log.error('ERROR: ' + err.message);
        return;
    }

    manifestTools.validateManifest(manifestInfo, platforms, function (err, validationResults) {
      if (err) {
        log.warn('ERROR: ' + err.message);
        return;
      }

      validationResults.forEach(function (validationResult) {
        var validationMessage = 'Validation ' + validationResult.level + ' (' + validationResult.platform + '): ' + validationResult.description;
        if (validationResult.level === validationConstants.levels.warning) {
          log.warn(validationMessage);
        } else if (validationResult.level === validationConstants.levels.suggestion) {
          log.info(validationMessage);
        }
      });

      // if specified as a parameter, override the app's short name
      if (parameters.s) {
        manifestInfo.content.short_name = parameters.s;
      }

      log.debug('Manifest contents:');
      log.debug(JSON.stringify(manifestInfo.content, null, 4));

      // create the cordova application
      projectBuilder.createApps(manifestInfo, rootDir, platforms, parameters.build, function (err) {
        if (err) {
          log.warn('WARNING: ' + err.message);
          return;
        }

        log.info('The application(s) are ready!');
      });
    });
});
