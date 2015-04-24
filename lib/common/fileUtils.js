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

module.exports = {
  copyFile: copyFile
};
