'use strict';

var validations = require('./lib/validations');
var manifestTools = require('./lib/tools');
var projectBuilder = require('./lib/projectBuilder');

function checkParameters(argv) {   
    if (argv._.length < 2) {
        throw 'ERROR: Missing required arguments.';
    }
    
    // Check platforms
    if (argv.p) {
        var platforms = argv.p.split(/[\s,]+/);
        if (!validations.platformsValid(platforms)) {
            throw 'ERROR: Invalid platform(s) specified.';
        }
    }
}

var parameters = require('optimist')
                .usage('Usage: node appmyweb.js <website URL> <app directory> [-p <platforms>]')
                .alias('p', 'platforms')
                .default('p', 'windows,android,ios')
                .check(checkParameters)
                .argv;

var siteUrl = parameters._[0];
var rootDir = parameters._[1];
var platforms = parameters.p;

// scan a site to retrieve its manifest 
console.log('Scanning ' + siteUrl + ' for manifest...');

manifestTools.getManifestFromSite(siteUrl, function (err, manifestInfo) {
    if (err) {
        console.error(err);
        return err;
    }

    // query manifest info and retrieve its app name
    console.log('Found a ' + manifestInfo.format.toUpperCase() + ' manifest');
    
    // TODO: implement log level logic to decide when to show these messages
    //console.log();
    //console.log(JSON.stringify(manifestInfo.content, null, 4));

    // create the cordova application
    projectBuilder.createCordovaApp(manifestInfo, rootDir, platforms, function (err) {
        if (err) {
            console.error(err);
            return err;
        }

        console.log('The Cordova application is ready!');
    });
});