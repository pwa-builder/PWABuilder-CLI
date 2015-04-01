var manifestTools = require('./tools'),
    path = require('path'),
    url = require('url'),
    exec = require('child_process').exec,
    log = require('loglevel');

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
    log.info('Creating the Cordova application...');
    var cmdLine = 'cordova create ' + appName + ' ' + packageName + ' ' + appName;
    log.debug('    ' + cmdLine);

    exec(cmdLine, function (err, stdout, stderr) {
        if (err) {
            return callback(err);
        }
        
        // copy the manifest file to the 'www' folder of the app
        log.info('Copying the manifest to the app folder...');
        var manifestFilePath = path.join(generatedAppDir, 'www', 'manifest.json');
        manifestTools.writeToFile(manifestInfo, manifestFilePath, function (err) {
            if (err) {
                return callback(err);
            }
            
            process.chdir(generatedAppDir);           

            // add all the supported platforms
            log.info('Adding Android, iOS, and Windows platforms...');
            cmdLine = 'cordova platform add android windows ios';
            log.debug('    ' + cmdLine);
            exec(cmdLine, function (err, stdout, stderr) {
                if (err) {
                    return callback(err);
                }
                
                // add the Hosted Web App plugin
                log.info('Adding the Hosted Web App plugin to the project...');
                cmdLine = 'cordova plugin add "' + pluginDir + '"';
                log.debug('    ' + cmdLine);
                exec(cmdLine, function (err, stdout, stderr) {
                    if (err) {
                        return callback(err);
                    }
                    
                    // build the platform-specific projects
                    log.info('Running cordova build...');
                    cmdLine = 'cordova build windows android';
                    log.debug('    ' + cmdLine);
                    exec(cmdLine, function (err, stdout, stderr) {
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