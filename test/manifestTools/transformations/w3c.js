'use strict';

var transformation = require('../../../lib/manifestTools/transformations/w3c');
var should = require('should');

describe('transformation: W3C Manifest', function () {
  describe('convertToBase()', function () {
    it('Should return an Error if manifest info is undefined', function(done) {
      transformation.convertToBase(undefined, function(err){
        should.exist(err);
        err.should.have.property('message', 'Manifest content is empty or not initialized.');
        done();
      });
    });

    it('Should return an Error if content property is undefined', function(done) {
      var originalManifest = { key: 'value' };

      transformation.convertToBase(originalManifest, function(err) {
        should.exist(err);
        err.should.have.property('message', 'Manifest content is empty or not initialized.');
        done();
      });
    });

    it('Should return the same object if manifest info is valid', function (done) {
      var originalManifest = {
        content: {
          'start_url' : 'url'
        }
      };

      transformation.convertToBase(originalManifest, function(err, result) {
        should.not.exist(err);
        result.should.be.exactly(originalManifest);
        done();
      });
    });
  });

  describe('convertFromBase()', function () {
    it('Should return an Error if manifest info is undefined', function(done) {
      transformation.convertFromBase(undefined, function(err) {
        should.exist(err);
        err.should.have.property('message', 'Manifest content is empty or not initialized.');
        done();
      });
    });

    it('Should return an Error if content property is undefined', function(done) {
      var originalManifest = { key: 'value' };

      transformation.convertFromBase(originalManifest, function(err) {
        should.exist(err);
        err.should.have.property('message', 'Manifest content is empty or not initialized.');
        done();
      });
    });

    it('Should return the same object if manifest info is valid', function (done) {
      var originalManifest = {
        content: {
          'start_url' : 'url'
        }
      };

      transformation.convertFromBase(originalManifest, function(err, result) {
        should.not.exist(err);
        result.should.be.exactly(originalManifest);
        done();
      });
    });
  });

  describe('matchFormat()', function () {
    it('Should return true if manifest is a empty object', function() {
      var manifestObj = {};

      var result = transformation.matchFormat(manifestObj);

      should.exist(result);
      /*jshint -W030 */
      result.should.be.true;
    });

    it('Should return true if manifest is a valid W3C manifest', function() {
      var manifestObj ={
        'start_url': 'url',
        'name': 'test'
      };

      var result = transformation.matchFormat(manifestObj);

      should.exist(result);
      /*jshint -W030 */
      result.should.be.true;
    });

    it('Should return true if manifest has valid extensions', function() {
      var manifestObj = {
        'start_url': 'url',
        'name': 'test',
        'extension_test': 'test',
        'extension_obj': { 'key': 'value' }
      };

      var result = transformation.matchFormat(manifestObj);

      should.exist(result);
      /*jshint -W030 */
      result.should.be.true;
    });

    it('Should return false if manifest is an invalid W3C manifest', function() {
      var manifestObj = {
        'start_url': 'url',
        'name': 'test',
        'invalid': 'test'
      };

      var result = transformation.matchFormat(manifestObj);

      should.exist(result);
      /*jshint -W030 */
      result.should.be.false;
    });

    it('Should return true if manifest has valid icons definition', function() {
      var manifestObj = {
        'start_url': 'url',
        'name': 'test',
        'icons': [{
          'src': 'icon/lowres',
          'sizes': '64x64',
          'type': 'image/webp'
        }]
      };

      var result = transformation.matchFormat(manifestObj);

      should.exist(result);
      /*jshint -W030 */
      result.should.be.true;
    });

    it('Should return false if manifest has invalid icons definition', function() {
      var manifestObj = {
        'start_url': 'url',
        'name': 'test',
        'icons': [{
          'src': 'icon/lowres',
          'invalid': 'test',
          'type': 'image/webp'
        }]
      };

      var result = transformation.matchFormat(manifestObj);

      should.exist(result);
      /*jshint -W030 */
      result.should.be.false;
    });
  });
});
