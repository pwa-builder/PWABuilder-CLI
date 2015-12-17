var validations = require('./validations'),
    platformUtils = require('./platformUtils'),
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    log = require('loglevel'),
    hwa = require('hwa');

var originalPath = process.cwd();

var installWindows10App = function (manifestPath, callback) {
  log.info('Installing Windows 10 app...');
  hwa.registerApp(manifestPath);
  callback();
};

var isWindows10Version = function (version) {
  return /^10/.test(version);
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

  var cmdLine = '"' + cordovaPath + '" run ' + platform;
  log.debug('    ' + cmdLine);
  exec(cmdLine, function (err, stdout, stderr) {
     
    // set original working directory as current
    process.chdir(originalPath);

    log.debug(stdout);
    if (err) {
      log.debug(err);
      return callback(new Error('Failed to run the app for ' + platform + ' platform.'));
    } else if (stderr.length) {
      log.error(stderr.trim());
      return callback(new Error('Failed to run the app for ' + platform + ' platform.'));
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
    if (!platformUtils.isWindows) {
      return callback(new Error('Windows projects can only be executed in Windows environments.'));
    }

    var windowsManifest = 'appxmanifest.xml';
    searchFile(process.cwd(), windowsManifest, function (err, results) {
      if (err) {
        log.debug(err);
        return callback(new Error('Failed to find the Windows app manifest.'));
      }

      getWindowsVersion(function (error, version) {
        if (err) {
          return callback(err);
        }

        if (results && results.length > 0 && isWindows10Version(version)) {
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

var openVisualStudioFile = function (visualStudioFilePath, callback) {
  log.info('Opening the Visual Studio file "' + visualStudioFilePath + '"...');
  
  var cmdLine = 'start ' + visualStudioFilePath;
  exec(cmdLine, function (err, stdout, stderr) {
    log.debug(stdout);
    if (err) {
      log.debug(err);
      return callback(new Error('Failed to open the Visual Studio file "' + visualStudioFilePath + '".'));
    } else if (stderr.length) {
      log.error(stderr.trim());
      return callback(new Error('Failed to open the Visual Studio file "' + visualStudioFilePath + '".'));
    }
    
    callback();
  });
};

var openVisualStudio = function (callback) {
  if (!platformUtils.isWindows) {
    return callback(new Error('Visual Studio projects can only be opened in Windows environments.'));
  }

  var windowsCordovaSolutionFileName = 'CordovaApp.sln';
  var windows10ProjectFileName = 'App.jsproj';
  
  searchFile(process.cwd(), windows10ProjectFileName, function (err, results) {
    if (err) {
      log.debug(err);
      return callback(new Error('Failed to find the Windows 10 project: "' + windows10ProjectFileName + '"'));
    }
    
    getWindowsVersion(function (error, version) {
      if (err) {
        return callback(err);
      }
      
      if (results && results.length > 0 && isWindows10Version(version)) {
        // If there is a windows 10 project file and the OS is Windows 10, open the windows 10 project
        openVisualStudioFile(results[0], function (err) {
          callback(err);
        });
      } else {
        // If there is a windows 8.1 solution file, open the windows 8.1 solution
        searchFile(process.cwd(), windowsCordovaSolutionFileName, function (err, results) {
          if (err) {
            log.debug(err);
            return callback(new Error('Failed to find the Visual Studio solution: "' + windowsCordovaSolutionFileName + '"'));
          }
          
          if (!results || results.length === 0) {
            return callback(new Error('Could not find a Visual Studio project/solution to open. Make sure you are positioned in the right app folder.'));
          }
          
          openVisualStudioFile(results[0], function (err) {
            callback(err);
          });
        });
      }
    });
  });
};

module.exports = {
  runApp: runApp,
  openVisualStudio: openVisualStudio
};
