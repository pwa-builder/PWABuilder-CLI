'use strict';

var fs = require('fs');

function copyFile(source, target, callback) {
  var cbCalled = false;

  function done(err) {
    if (!cbCalled) {
      callback(err);
      cbCalled = true;
    }
  }

  var rd = fs.createReadStream(source);
  rd.on('error', done);

  var wr = fs.createWriteStream(target);
  wr.on('error', done);
  wr.on('close', function() {
    done();
  });
  rd.pipe(wr);
}

function replaceFileContent(source, replacementFunc, callback) {
  fs.readFile(source, 'utf8', function (err, data) {
    if (err) {
      return callback(err);
    }

    var result = replacementFunc(data);

    fs.writeFile(source, result, 'utf8', function (err) {
      if (err) {
        return callback(err);
      }

      callback();
    });
  });
}

module.exports = {
  copyFile: copyFile,
  replaceFileContent: replaceFileContent
};
