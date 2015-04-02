var manifestTools = require('./tools'),
    path = require('path'),
    url = require('url'),
    exec = require('child_process').exec,
    fs = require('fs'),
    log = require('loglevel'),
    validations = require('./validations');

function createCordovaApp(manifestInfo, rootDir, platforms, callback) {
    log.setLevel('info');
    
    if (!validations.platformsValid(platforms.split(/[\s,]+/))) {
        return callback(new Error('Invalid platform(s) specified.'));
    }

    var appName = manifestInfo.content.short_name;
    
    platforms = platforms.replace(/,/g, ' ');
    
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
        log.info('Creating the Cordova application...');
        var cmdLine = cordovaPath + ' create ' + appName + ' ' + packageName + ' ' + appName;
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
                
                // add all the specified platforms
                log.info('Adding the following platforms: ' + platforms + '...');
                cmdLine = cordovaPath + ' platform add ' + platforms;
                log.debug('    ' + cmdLine);
                exec(cmdLine, function (err, stdout, stderr) {
                    if (err) {
                        return callback(err);
                    }
                    
                    // add the Hosted Web App plugin
                    log.info('Adding the Hosted Web App plugin to the project...');
                    cmdLine = cordovaPath + ' plugin add "' + pluginDir + '"';
                    log.debug('    ' + cmdLine);
                    exec(cmdLine, function (err, stdout, stderr) {
                        if (err) {
                            return callback(err);
                        }
                        
                        // build the platform-specific projects
                        log.info('Running cordova build...');
                        cmdLine = cordovaPath + ' build ' + platforms;
                        log.debug('    ' + cmdLine);
                        exec(cmdLine, function (err, stdout, stderr) {
                            return callback(err);
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