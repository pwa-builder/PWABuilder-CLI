'use strict';

var manifestTools = require('./lib/tools'),
    path = require('path'),
    exec = require('child_process').exec;

// scan a site to retrieve its manifest 
var siteUrl = process.argv[2];
console.log('Scanning ' + siteUrl + ' for manifest...');
manifestTools.getManifestFromSite(siteUrl, function (err, manifestInfo) {
    if (err) {
        console.log(err);
        return err;
    }
    
    // query manifest info and retrieve its app name
    console.log('Found a ' + manifestInfo.format.toUpperCase() + ' manifest');
    console.log();
    console.log(JSON.stringify(manifestInfo.content, null, 4));
    var appName = manifestInfo.content.short_name;
    
    // determine the path where the Cordova app will be created
    var actualPath = process.cwd();
    var generatedAppDir = path.join(actualPath, appName);
    
    // create the Cordova app
    console.log('Creating the Cordova application...');
    var cmdLine = 'cordova create ' + appName + ' com.microsoft.sample ' + appName;
    console.log('    ' + cmdLine);
    exec(cmdLine, function (err, stdout, stderr) {
        if (err) {
            console.error(err);
            return;
        }
        
        // copy the manifest file to the 'www' folder of the app
        console.log('Copying the manifest to the app folder...');
        var manifestFilePath = path.join(generatedAppDir, 'www', 'manifest.json');
        manifestTools.writeToFile(manifestInfo, manifestFilePath, function (err) {
            if (err) {
                console.log(err);
                return err;
            }
            
            process.chdir(generatedAppDir);
            
            // add all the supported platforms
            console.log('Adding the Android, iOS, and Windows platforms...');
            cmdLine = 'cordova platform add android windows ios';
            exec(cmdLine, function (err, stdout, stderr) {
                if (err) {
                    console.error(err);
                    return;
                }
                
                // add the Hosted Web App plugin
                console.log('Adding the Hosted Web App plugin to the project...');
                exec('cordova plugin add "../../../cordovaApps/plugins/com.microsoft.hostedwebapp"', function (err, stdout, stderr) {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    // build the platform-specific projects
                    console.log('Running cordova build...');
                    exec('cordova build', function (err, stdout, stderr) {
                        if (err) {
                            console.error(err);
                            return;
                            
                            console.log('The Cordova application is ready!');
                        }
                    });
                });
            });
        });
    });
});
