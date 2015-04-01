'use strict';

var manifestTools = require('./lib/tools');
var projectBuilder = require('./lib/projectBuilder.js');

// scan a site to retrieve its manifest 
var siteUrl = process.argv[2];
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
    projectBuilder.createCordovaApp(manifestInfo, function (err) {
        if (err) {
            console.error(err);
            return err;
        }

        console.log('The Cordova application is ready!');
    });
});