var validations = require('./common/validations'),
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    log = require('loglevel');

var installWindows10App = function (manifestPath, callback) {
  log.info('Installing Windows 10 app...');
  var cmdLine = 'powershell Add-AppxPackage -Register ' + manifestPath;
  log.debug('    ' + cmdLine);
  exec(cmdLine, function (err, stdout, stderr) {
    log.debug(stdout);
    if (err) {
      log.debug(err);
      return callback(new Error('Failed to install the Windows 10 app.'));
    } else if (stderr.length) {
      log.error(stderr.trim());
    }
    
    log.warn('The app was installed. You can now launch the app from your recently installed apps list in Start menu');
    callback();
  });
};

var isWindows = function () {
  return isWindows = /^win/.test(process.platform);
};

var getWindowsVersion = function (callback) {
  log.info('Obtaining Windows version...');
  var cmdLine = 'powershell (Get-WmiObject win32_operatingsystem).version';
  log.debug('    ' + cmdLine);
  exec(cmdLine, function (err, stdout, stderr) {
    log.debug(stdout);
    if (err) {
      log.debug(err);
      return callback(new Error('Failed to run the app for Windows platform.'));
    } else if (stderr.length) {
      log.error(stderr.trim());
    }

    callback(undefined, stdout.trim());
  });
};

var searchFile = function (dir, fileName, done) {
  var results = [];
  fs.readdir(dir, function (err, list) {
    if (err) {
      return done(err);
    }

    var pending = list.length;
    if (!pending) {
      return done(null, results);
    }

    list.forEach(function (file) {
      file = path.resolve(dir, file);
      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          searchFile(file, fileName, function (err, res) {
            results = results.concat(res);
            if (!--pending){
              done(null, results);
            }
          });
        } else {
          if (path.basename(file) === fileName) {
            results.push(file);
          }

          if (!--pending) {
            done(null, results);
          }
        }
      });
    });
  });
};

var runCordovaApp = function (platform, callback) {
  log.info('Running cordova app for ' + platform + ' platform...');

  var cordovaDir = path.join(process.cwd(), 'cordova');
  try {
    process.chdir(cordovaDir);
  }
  catch (err) {
    log.error('ERROR: Failed to change the working directory to ' + cordovaDir);
    log.debug(err);
    return callback(new Error('Failed to run the Cordova app.'));
  }

  // path to cordova shell command
  var cordovaPath = path.resolve(__dirname, '..', 'node_modules', 'cordova', 'bin', 'cordova');

  var cmdLine = cordovaPath + ' run ' + platform;
  log.debug('    ' + cmdLine);
  exec(cmdLine, function (err, stdout, stderr) {
    log.debug(stdout);
    if (err) {
      log.debug(err);
      return callback(new Error('Failed to run the app for ' + platform + ' platform.'));
    } else if (stderr.length) {
      log.error(stderr.trim());
    }
    
    log.info('The application was launched successfully!');
    callback();
  });
};

var runApp = function (platform, callback) {
  if (!validations.platformToRunValid(platform)) {
    return (callback(new Error('Invalid platform specified.')));
  }

  if (platform.toUpperCase() === 'WINDOWS') {
    if (!isWindows()) {
      return callback(new Error('Visual Studio projects can only be executed in Windows environments.'));
    }

    var windowsManifest = 'appxmanifest.xml';
    searchFile(process.cwd(), windowsManifest, function (err, results) {
      if (err) {
        log.debug(err);
        return callback(new Error('Could not find the Windows app manifest.'));
      }

      getWindowsVersion(function (error, version) {
        if (err) {
          return callback(err);
        }

        if (results && results.length > 0 && /^10/.test(version)) {
          // If there is a windows app manifest and the OS is Windows 10, install the windows 10 app
          installWindows10App(results[0], function (err) {
            callback(err);
          });
        } else {
          // Run the windows cordova app
          runCordovaApp(platform, function (err) {
            callback(err);
          });
        }
      });
    });
  } else {
    // Run the non-windows cordova app
    runCordovaApp(platform, function (err) {
      callback(err);
    });
  }
};

var openVisualStudioSolution = function (callback) {
  if (!isWindows()) {
    return callback(new Error('Visual Studio solutions can only be opened in Windows environments.'));
  }

  var solutionFileName = 'CordovaApp.sln';
  searchFile(process.cwd(), solutionFileName, function (err, results) {
    if (err) {
      log.debug(err);
      return callback(new Error('Could not find the Visual Studio solution "' + solutionFileName + '"'));
    }

    if (!results || results.length === 0) {
      return callback(new Error('Could not find the Visual Studio solution "' + solutionFileName + '"'));
    }

    var solutionFilePath = results[0];

    log.info('Opening the Visual Studio solution "' + solutionFilePath + '"...');

    var cmdLine = 'start ' + solutionFilePath;
    exec(cmdLine, function (err, stdout, stderr) {
      log.debug(stdout);
      if (err) {
        log.debug(err);
        return callback(new Error('Failed to open the Visual Studio solution "' + solutionFilePath + '".'));
      } else if (stderr.length) {
        log.error(stderr.trim());
      }

      callback();
    });
  });
};

module.exports = {
  runApp: runApp,
  openVisualStudioSolution: openVisualStudioSolution
};
