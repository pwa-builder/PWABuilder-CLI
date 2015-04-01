'use strict';

var manifestTools = require('./lib/tools');
var projectBuilder = require('./lib/projectBuilder.js');

var siteUrl = process.argv[2];
var rootDir = process.argv[3];
var platforms = process.argv[4];

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