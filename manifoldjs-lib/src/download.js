'use strict';

var http = require('http'),
    https = require('https'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    Q = require('q');

function download(inputUri, outputFilePath, callback) {

  var uri = url.parse(inputUri);

  if (inputUri.indexOf('http://') !== 0 && inputUri.indexOf('https://') !== 0) {
    // this is to detect scenarios like localhost:8080 where localhost is
    // treated as protocol even if it's not.
    if (inputUri.indexOf(uri.protocol + '//') !== 0) {
      inputUri = 'http://' + inputUri;
      uri = url.parse(inputUri);
    }
  }

  if (!(uri.protocol === 'http:' || uri.protocol === 'https:')) {
    return Q.reject(new Error('Invalid protocol, only http & https are supported')).nodeify(callback);
  }

  var downloadDir = path.dirname(outputFilePath);
  if (!fs.existsSync(downloadDir)) {
    return Q.reject(new Error('Invalid download directory: ' + downloadDir)).nodeify(callback);
  }

  var lastModified;

  if (fs.existsSync(outputFilePath)) {
    var stats = fs.lstatSync(outputFilePath);
    lastModified = new Date(stats.mtime);
  }

  var options = {
    host: uri.hostname,
    port: uri.port || (uri.protocol === 'https:' ? 443 : 80),
    path: uri.path,
    agent: false
  };

  if (lastModified) {
    options.headers = {
      'if-modified-since': lastModified.toUTCString()
    };
  }

  var protocol = uri.protocol === 'https:' ? https : http;

  var deferred = Q.defer();
  protocol.get(options, function (res) {
    // If Moved Permanently or Found, redirect to new URL
    if ([301, 302].indexOf(res.statusCode) > -1) {
      return download(res.headers.location, outputFilePath);
    }

    // If not OK or Not Modified, throw error
    if ([200, 304].indexOf(res.statusCode) === -1) {
      return deferred.reject(new Error('Invalid status code: ' + res.statusCode + ' - ' + res.statusMessage));
    }

    // If Not Modified, ignore
    if (res.statusCode === 304) {
      return deferred.resolve(undefined, { 'path': outputFilePath, 'statusCode': res.statusCode, 'statusMessage': res.statusMessage });
    }

    // If not an image, throw error
    if (!res.headers['content-type'].match(/image/)) {
      return deferred.reject(new Error('Unexpected Content-Type: ' + res.headers['content-type']));
    }

    // Else save
    res.pipe(fs.createWriteStream(outputFilePath))
      .on('close', function () {
        var lastAccessed = new Date();
        var lastModified = res.headers['last-modified'] ? new Date(res.headers['last-modified']) : lastAccessed;
      
        // update the last modified time of the file to match the response header
        fs.utimes(outputFilePath, lastAccessed, lastModified, function (err) {
          if (err) {
            return deferred.reject(err);
          }

          return deferred.resolve({ 'path': outputFilePath, 'statusCode': res.statusCode, 'statusMessage': res.statusMessage });
        });
      });
  }).on('error', function (err) {
    return deferred.reject(err);
  });

  return deferred.promise.nodeify(callback)
};

module.exports = download;
