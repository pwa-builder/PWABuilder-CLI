'use strict';

var http = require('http');
var https = require('https');
var url = require('url');

var path = require('path');
var fs = require('fs');

var downloadImage = function (inputUri, outputFilePath, callback) {
  var uri = url.parse(inputUri);

  if (inputUri.indexOf('http://') !== 0 && inputUri.indexOf('https://') !== 0) {
    // this is to detect scenarios like localhost:8080 where localhost is
    // treated as protocol even if it's not.
    if (inputUri.indexOf(uri.protocol + '//') !== 0) {
      inputUri = 'http://' + inputUri;
      uri = url.parse(inputUri);
    }
  }

  if(!(uri.protocol === 'http:' || uri.protocol === 'https:')) {
    return callback(new Error('Invalid protocol, only http & https are supported'));
  }
  
  var downloadDir = path.dirname(outputFilePath);
  if (!fs.existsSync(downloadDir)) {
    return callback(new Error('Invalid download directory: ' + downloadDir));
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
    agent : false
  };

  if (lastModified) {
    options.headers = {
      'if-modified-since': lastModified.toUTCString()
    };
  }

  var protocol = uri.protocol === 'https:' ? https : http;
  protocol.get(options, function(res) {
    // If Moved Permanently or Found, redirect to new URL
    if ([301, 302].indexOf(res.statusCode) > -1) {
      return downloadImage(res.headers.location, outputFilePath, callback);
    }

    // If not OK or Not Modified, throw error
    if ([200, 304].indexOf(res.statusCode) === -1) {
      return callback(new Error('Invalid status code: ' + res.statusCode + ' - ' + res.statusMessage));
    }

    // If Not Modified, ignore
    if (res.statusCode === 304) {
      return callback(undefined, { 'path': outputFilePath, 'statusCode': res.statusCode, 'statusMessage': res.statusMessage });
    }

    // If not an image, throw error
    if (!res.headers['content-type'].match(/image/)) {
      return callback(new Error('Unexpected Content-Type: ' + res.headers['content-type']));
    }

    // Else save
    res.pipe(fs.createWriteStream(outputFilePath))
       .on('close', function () {
         return callback(undefined, { 'path': outputFilePath, 'statusCode': res.statusCode, 'statusMessage': res.statusMessage });
       });
  }).on('error', function(err) {
    return callback(err);
  });
};

module.exports = {
  downloadImage: downloadImage,
};
