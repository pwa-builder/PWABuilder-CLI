'use strict';

var validations = require('./lib/validations'),
    constants = require('./lib/constants'),
    manifestTools = require('./lib/tools'),
    projectBuilder = require('./lib/projectBuilder'),
    log = require('loglevel');


function checkParameters(argv) {   
    if (argv._.length < 2) {
        throw 'ERROR: Missing required arguments.';
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
                .usage('Usage: node appmyweb.js <website URL> <app directory> [-p <platforms>] [-l <loglevel>] [-b] [-m <manifest file>]')
                .alias('p', 'platforms')
                .alias('l', 'loglevel')
                .alias('b', 'build')
                .alias('m', 'manifest')
                .default('p', 'windows,android,ios')
                .default('l', 'warn')
                .default('b', false)
                .describe('p', '[windows][,android][,ios]')
                .describe('l', 'debug|trace|info|warn|error')
                .check(checkParameters)
                .argv;

var siteUrl = parameters._[0];
var rootDir = parameters._[1];
var platforms = parameters.platforms.split(/[\s,]+/);

global.logLevel = parameters.loglevel;
log.setLevel(global.logLevel);

function manifestRetrieved(err, manifestInfo) {
    if (err) {
        log.error('ERROR: ' + err.message);
        return err;
    }
    
    if (manifestInfo.format !== constants.BASE_MANIFEST_FORMAT) {
        err = new Error("The manifest found is not a W3C manifest.");
        log.error('ERROR: ' + err.message);
        return err;
    }
    
    log.debug('Manifest contents:');
    log.debug(JSON.stringify(manifestInfo.content, null, 4));
    
    // create the cordova application
    projectBuilder.createCordovaApp(manifestInfo, rootDir, platforms, parameters.build, function (err) {
        if (err) {
            log.error('ERROR: ' + err.message);
            return err;
        }
        
        log.info('The Cordova application is ready!');
    });
}

// scan a site to retrieve its manifest 
log.info('Scanning ' + siteUrl + ' for manifest...');

if (parameters.manifest) {
    if (parameters.manifest.toLowerCase().indexOf('http://') === 0 
     || parameters.manifest.toLowerCase().indexOf('https://') === 0) {
        manifestTools.downloadManifestFromUrl(parameters.manifest, manifestRetrieved);
    } else {
        manifestTools.getManifestFromFile(parameters.manifest, manifestRetrieved);
    }   
} else {
    manifestTools.getManifestFromSite(siteUrl, manifestRetrieved);
}
