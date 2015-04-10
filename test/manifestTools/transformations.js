'use strict';

var transformations = require('../../lib/manifestTools/transformations');
var path = require('path');
var fs = require('fs');
require('should');

var transformationsPath = path.join(__dirname, '..', '..', 'lib', 'manifestTools', 'transformations');

describe('Transformations', function () {
  describe('Loaded modules', function () {
    it('Should load the chromeos transformation module', function() {
      transformations.should.have.property('chromeos');
    });

    it('Should load the w3c transformation module', function() {
      transformations.should.have.property('w3c');
    });

    it('Should load all modules (files) in the transformation folder', function(done) {
      fs.readdir(transformationsPath, function (err, files) {
        var transformationLoadedLength = Object.keys(transformations).length;
        transformationLoadedLength.should.be.above(0);
        transformationLoadedLength.should.be.equal(files.length);

        done();
      });
    });

    it('All loaded modules should have the same interface', function() {
      for (var transformation in transformations) {
        /*jshint -W030 */
        transformations[transformation].should.have.property('convertToBase').and.be.a.Function;
        transformations[transformation].should.have.property('convertFromBase').and.be.a.Function;
        transformations[transformation].should.have.property('matchFormat').and.be.a.Function;
      }
    });
  });
});
