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

module.exports = {
  runCordovaApp: runCordovaApp
};