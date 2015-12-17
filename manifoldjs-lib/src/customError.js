'use strict';

var util = require('util');

var log;
try {
  log = require('./log');
} catch (error) {
  // if log is not available, assume 'info' trace level  
  log = { getLevel: function() { return 2; }}
}

var traceLevels = { "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3, "ERROR": 4, "SILENT": 5};

// When log level is (0 || 'debug'), return error message + stack trace 
// for current error as well as any "inner errors". Otherwise, return
// error message for current error only and without the stack trace.  
Error.prototype.getMessage = function getMessage (logLevel, err) {
  
  if (typeof logLevel === 'undefined') {
    logLevel = log.getLevel();
  }
  
  if (typeof logLevel === "string") {
    logLevel = traceLevels[logLevel.toUpperCase()] || traceLevels['DEBUG'];  
  }
  
  if (typeof logLevel === "number" && (logLevel < 0 || logLevel > traceLevels.SILENT)) {
    logLevel = traceLevels['DEBUG'];
  }
  
  err = err || this;
  if (logLevel <= 1) {
    var message = err.stack.replace(/^Error: /, '');
    if (err.innerError) {
      message += '\n' + err.getMessage(logLevel, err.innerError);
    }    
  }
  else {
    message = err.message;
  }
  
  return message;
};  

// allows constructing Error objects with an innerError property
function CustomError(message, innerError) {

  // configure properties so that CustomError behaves similarly to Error base type  
  Object.defineProperty(this, 'innerError', {
    enumerable: false,
    configurable: true,
    writable: false,
    value: innerError
  });

  Object.defineProperty(this, 'name', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: 'Error'
  });

  Object.defineProperty(this, 'message', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: message
  });
  
  Error.captureStackTrace(this, CustomError);
};

util.inherits(CustomError, Error);

module.exports = CustomError;
