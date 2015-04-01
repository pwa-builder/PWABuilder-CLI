var manifestTools = require('./tools'),
    path = require('path'),
    url = require('url'),
    exec = require('child_process').exec;

function createCordovaApp(manifestInfo, rootDir, platforms, callback) {
    var appName = manifestInfo.content.short_name;
    
    // determine the path where the Cordova app will be created
    var generatedAppDir = path.join(rootDir, appName);
    
    // determine the path where the plugin is located
    var pluginDir = path.join(process.cwd(), "../../cordovaApps/plugins/com.microsoft.hostedwebapp");
    
    // go to the directory where the app will be created
    process.chdir(rootDir); 
    
    // generate a reverse-domain-style package name from the manifest's start_url
    var packageName = '';
    url.parse(manifestInfo.content.start_url)
            .hostname
            .replace('-', '')
            .split('.')
            .map(function (segment) {
                packageName = segment + (packageName ? '.' : '') + packageName;
            });
    
    // create the Cordova app
    console.log('Creating the Cordova application...');
    var cmdLine = 'cordova create ' + appName + ' ' + packageName + ' ' + appName;
    
    // TODO: implement log level logic to decide when to show these messages
    //console.log('    ' + cmdLine);

    exec(cmdLine, function (err, stdout, stderr) {
        if (err) {
            return callback(err);
        }
        
        // copy the manifest file to the 'www' folder of the app
        console.log('Copying the manifest to the app folder...');
        var manifestFilePath = path.join(generatedAppDir, 'www', 'manifest.json');
        manifestTools.writeToFile(manifestInfo, manifestFilePath, function (err) {
            if (err) {
                return callback(err);
            }
            
            process.chdir(generatedAppDir);           

            // add all the supported platforms
            console.log('Adding the Android, iOS, and Windows platforms...');
            cmdLine = 'cordova platform add android windows ios';
            exec(cmdLine, function (err, stdout, stderr) {
                if (err) {
                    return callback(err);
                }
                
                // add the Hosted Web App plugin
                console.log('Adding the Hosted Web App plugin to the project...');
                exec('cordova plugin add "' + pluginDir + '"', function (err, stdout, stderr) {
                    if (err) {
                        return callback(err);
                    }
                    
                    // build the platform-specific projects
                    console.log('Running cordova build...');
                    exec('cordova build windows android', function (err, stdout, stderr) {
                        return callback(err);   
                    });
                });
            });
        });
    });
}

module.exports = {
    createCordovaApp: createCordovaApp
}