'use strict';

var manifestTools = require('./lib/tools');
var projectBuilder = require('./lib/projectBuilder.js');
var parameters = require('optimist')
                .usage('Usage: node appmyweb.js <web site URL> <app directory> [-p <platforms>]')
                .alias('p', 'platform')
                .default('p', 'windows,android,ios')
                .check(checkParameters)
                .argv;

function checkParameters(argv) {
    var availablePlatforms = ['windows', 'ios', 'android'];
    
    if (argv._.length < 2) {
        throw 'Error: Missing required arguments.';
    }

    // Check platforms
    if (argv.p) {
        argv.p.split(',').forEach(function (platform) {
            if (availablePlatforms.indexOf(platform) < 0) {
                throw 'Error: Invalid platform(s) specified.';
            }
        });
    }
}

// main flow

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