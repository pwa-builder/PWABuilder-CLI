'use strict';

var tools = require('./lib/tools');

var siteUrl = process.argv[2];
console.log('Scanning ' + siteUrl + ' for manifest...');
tools.getManifestFromSite(siteUrl, function (err, manifest) {
    if (err) {
        console.log(err);
        return err;
    }
    

    console.log('Found a ' + manifest.format.toUpperCase() + ' manifest');
    console.log();
    console.log(JSON.stringify(manifest.content, null, 4));
});