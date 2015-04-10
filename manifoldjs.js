#!/usr/bin/env node

var validations = require('./lib/validations'),
    constants = require('./lib/constants'),
    manifestTools = require('./lib/tools'),
    projectBuilder = require('./lib/projectBuilder'),
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
