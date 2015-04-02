var manifestTools = require('./tools'),
    path = require('path'),
    url = require('url'),
    exec = require('child_process').exec,
    fs = require('fs'),
    log = require('loglevel');

function createCordovaApp(manifestInfo, rootDir, platforms, callback) {    
    var appName = manifestInfo.content.short_name;
        
    // determine the path where the Cordova app will be created
    var generatedAppDir = path.join(rootDir, appName);
    
    // path to cordova shell command
    var cordovaPath = path.resolve(__dirname, '..', 'node_modules', 'cordova', 'bin', 'cordova');
    
    // path where the plugin is located (TEMPORARY - THIS WILL BE REPLACED WITH REFERENCE TO PLUGIN'S REPOSITORY)
    var pluginDir = path.resolve(__dirname, '..', '..', '..', 'cordovaApps', 'plugins', 'com.microsoft.hostedwebapp');
    
    // if the root dir does not exists, create it
    fs.mkdir(rootDir, function (err) {
        if (err && err.code !== 'EEXIST') {
            return callback(err);
        }
    
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
        log.trace('Creating the Cordova application...');
        var cmdLine = cordovaPath + ' create ' + appName + ' ' + packageName + ' ' + appName;
        log.debug('    ' + cmdLine);
        exec(cmdLine, function (err, stdout, stderr) {
            if (err) {
                log.error('ERROR: Failed to create the Cordova application.');
                log.debug(err);
                return callback(new Error('The project could not be created successfully.'));
            }

            // copy the manifest file to the 'www' folder of the app
            log.trace('Copying the manifest to the app folder...');
            var manifestFilePath = path.join(generatedAppDir, 'www', 'manifest.json');
            manifestTools.writeToFile(manifestInfo, manifestFilePath, function (err) {
                if (err) {
                    log.error('ERROR: Failed to copy the manifest to the app folder.');
                    log.debug(err);
                    return callback(new Error('The project could not be created successfully.'));
                }
                
                // set generated app's directory as current
                process.chdir(generatedAppDir);
                
                // add the Hosted Web App plugin
                log.trace('Adding the Hosted Web App plugin to the project...');
                cmdLine = cordovaPath + ' plugin add "' + pluginDir + '"';
                log.debug('    ' + cmdLine);
                exec(cmdLine, function (err, stdout, stderr) {
                    if (err) {
                        log.error('ERROR: Failed to add the Hosted Web App plugin.');
                        log.debug(err);
                        return callback(new Error('The project could not be created successfully.'));
                    }
                        
                    // process all the specified platforms
                    platforms.forEach(function (platform, index) {
                        log.trace('Adding platform: ' + platform + '...');
                        cmdLine = cordovaPath + ' platform add ' + platform;
                        log.debug('    ' + cmdLine);
                        exec(cmdLine, function (err, stdout, stderr) {
                            if (err) {
                                log.warn('WARNING: Failed to add ' + platform + ' platform.');
                                log.debug(err);
                                return;
                            }

                            // build the platform-specific projects
                            log.trace('Building platform: ' + platform + '...');
                            cmdLine = cordovaPath + ' build ' + platform;
                            log.debug('    ' + cmdLine);
                            exec(cmdLine, function (err, stdout, stderr) {
                                if (err) {
                                    log.warn('WARNING: Failed to build ' + platform + ' platform.');
                                    log.debug(err);
                                }

                                if (index === platforms.length - 1) {
                                    return callback();
                                }
                            });
                        });
                    });
                });
            });
        });
    });
}

module.exports = {
    createCordovaApp: createCordovaApp
}