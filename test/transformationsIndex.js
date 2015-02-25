'use strict';

var transformations = require('../lib/transformationsIndex');
var path = require('path');
var fs = require('fs');
require('should');

var transformationsPath = path.join(__dirname, '..', 'lib', 'transformations');

describe('Transformations Index', function () {
  describe('Loaded modules', function () {
    it('Should at least load the chromeos transformation module.', function() {
      transformations.should.have.property('chromeos');
    });

    it('Should load the same number of modules as files in the transformation folder.', function(done) {
      fs.readdir(transformationsPath, function (err, files) {
        var transformationLoadedLength = Object.keys(transformations).length;
        transformationLoadedLength.should.be.above(0);
        transformationLoadedLength.should.be.equal(files.length);

        done();
      });
    });
  });
});
