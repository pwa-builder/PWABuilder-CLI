'use strict';

var child_process = require('child_process'),
    fs = require('fs'),
    path = require('path'),
    Q = require('q');

var log = require('./log');
var stat = Q.nfbind(fs.stat);   

function writeOutput(text, bufferedOutput, source, title) {

  // split output by line
  var lines = (title + bufferedOutput + text).split(/\r?\n/);
  
  // buffer content from last line, in case it hasn't been read completely
  bufferedOutput = lines.pop();    
  
  // write complete lines to output
  lines.forEach(function (line) {
    log.debug(line, source);
  });
  
  // return buffered output
  return bufferedOutput;
}

function exec (command, args, options, callback) {
  
  var deferred = Q.defer();
  
  var stdout = '';
  var stderr = '';
  var bufferedStdout  = '';
  var bufferedStderr  = '';
  
  if (arguments.length == 2) {
    if (Array.isArray(args)) {
      options = {};
    } else {
      options = args;
      args = [];
    }
  }

  // log command line
  var title = 'Launching external process: \'' + command + ' ' + args.join(' ') + '\'\n';

  // spawn new process
  var childProcess = child_process.spawn(command, args, options);

  // console log source displays the process ID 
  var source = 'pid:' + childProcess.pid;

  // capture stdout
  childProcess.stdout.on('data', function (data) {      
    var text = data.toString()
    stdout += text;
        
    if (!options.suppressOutput) {
      bufferedStdout = writeOutput(text, bufferedStdout, source, title);
      title = '';
    }    
  });

  // capture stderr
  childProcess.stderr.on('data', function (data) {
    var text = data.toString()
    stderr += text;
    
    if (!options.suppressOutput) {
      bufferedStderr = writeOutput(text, bufferedStderr, source, title);
      title = '';
    }
  });
  
  // handle errors
  childProcess.on('error', function (err) {
    return deferred.reject(err);
  });
    
  // process has exited
  childProcess.on('exit', function (code) {
    // write pending output to console
    if (bufferedStdout) {
      writeOutput(bufferedStdout);
    }
    
    if (bufferedStderr) {
      writeOutput(bufferedStderr);
    }
    
    var result = { 'code': code, 'stdout': stdout, 'stderr': stderr };
    
    if (code != 0) {
      var err = new Error('External process completed with errors [process ID: ' + childProcess.pid + ' - exit code: ' + code + '].');
      for (var attrname in result) { err[attrname] = result[attrname]; }
      return deferred.reject(err);
    }
    
    deferred.resolve(result);
  });
  
  return deferred.promise.nodeify(callback);
};

function getCommandPath(currentPath, command) {
  if (!currentPath) {
    return Q.resolve(undefined);
  }
  
  var testPath = path.join(currentPath, 'node_modules', '.bin', command);
  return stat(testPath).then(function (fileInfo) {
    if (fileInfo.isFile()) {
      return Q.resolve(testPath);
    }
  }).catch(function (err) {
    if (err.code !== 'ENOENT') {
      return Q.reject(err);
    }
    currentPath = currentPath.substring(0, currentPath.lastIndexOf('node_modules'));
    return getCommandPath(currentPath, command);
  });  
}

module.exports = {
  exec: exec,
  getCommandPath: getCommandPath
};
