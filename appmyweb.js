'use strict';

var validations = require('./lib/validations'),
    constants = require('./lib/constants'),
    manifestTools = require('./lib/tools'),
    projectBuilder = require('./lib/projectBuilder'),
    url = require('url'),
    log = require('loglevel');


function checkParameters(argv) {   
    if (argv._.length < 1) {
        throw 'ERROR: Missing required <website URL> parameter.';
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
                .usage('Usage: node appmyweb <website URL> -d [<app directory>[ [-p <platforms>] [-l <loglevel>] [-b] [-m <manifest file>]')
                .alias('d', 'directory')
                .alias('p', 'platforms')
                .alias('l', 'loglevel')
                .alias('b', 'build')
                .default('p', 'windows,android,ios,chrome')
                .alias('m', 'manifest')
                .default('l', 'warn')
                .default('b', false)
                .describe('p', '[windows][,android][,ios][,chrome]')
                .describe('l', 'debug|trace|info|warn|error')
                .check(checkParameters)
                .argv;

var siteUrl = parameters._[0];
var rootDir = parameters.directory ? parameters.directory : process.cwd();
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
    
    // Make sure the manifest's start_url is an absolute URL
    manifestInfo.content.start_url = url.resolve(siteUrl, manifestInfo.content.start_url);
            
    log.debug('Manifest contents:');
    log.debug(JSON.stringify(manifestInfo.content, null, 4));
    
    // create the cordova application
    projectBuilder.createApps(manifestInfo, rootDir, platforms, parameters.build, function (err) {
        if (err) {
            log.error('ERROR: ' + err.message);
            return err;
        }
        
        log.info('The application(s) are ready!');
    });
}

if (parameters.manifest) {
    var parsedManifestUrl = url.parse(parameters.manifest);
    if (parsedManifestUrl && parsedManifestUrl.host) {
        // download manifest from remote location 
        log.info('Downloading manifest from ' + parameters.manifest + '...');
        manifestTools.downloadManifestFromUrl(parameters.manifest, manifestRetrieved);
    } else {
        // read local manifest file
        log.info('Reading manifest file ' + parameters.manifest + '...');
        manifestTools.getManifestFromFile(parameters.manifest, manifestRetrieved);
    }   
} else {
    // scan a site to retrieve its manifest 
    log.info('Scanning ' + siteUrl + ' for manifest...');
    manifestTools.getManifestFromSite(siteUrl, manifestRetrieved);
}
