var validations = require('./common/validations'),
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    log = require('loglevel');

var runCordovaApp = function (platform, callback) {
  if (!validations.platformToRunValid(platform)) {
    return (callback(new Error('Invalid platform specified.')));
  }
  
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
    
    callback();
  });
}

var openVisualStudioSolution = function (callback) {
  var isWindows = /^win/.test(process.platform);
  if (!isWindows) {
    return callback(new Error('Visual Studio solutions can only be opened in Windows environments.'));
  }
  
  var solutionFileName = 'CordovaApp.sln';
  searchFile(process.cwd(), solutionFileName, function(err, results) {
    if (results.length === 0) {
      return callback(new Error('Could not find the Visual Studio solution "CordovaApp.sln".'));
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
}

var searchFile = function (dir, fileName, done) {
  var results = [];
  fs.readdir(dir, function (err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function (file) {
      file = path.resolve(dir, file);
      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          searchFile(file, fileName, function (err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (path.basename(file) === fileName) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

module.exports = {
  runCordovaApp: runCordovaApp,
  openVisualStudioSolution: openVisualStudioSolution
};