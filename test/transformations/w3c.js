'use strict';

var transformation = require('../../lib/transformations/w3c');
var should = require('should');

describe('transformation: w3c', function () {
  describe('convertToBase()', function () {
    it('Should return the same object and no error.', function (done) {
      var originalManifest = { 'start_url' : 'url' };
      transformation.convertToBase(originalManifest, function(err, result) {
        should.not.exist(err);
        result.should.be.exactly(originalManifest);
        done();
      });
    });
  });

  describe('convertFromBase()', function () {
    it('Should return the same object and no error.', function (done) {
      var originalManifest = { 'start_url' : 'url' };
      transformation.convertFromBase(originalManifest, function(err, result) {
        should.not.exist(err);
        result.should.be.exactly(originalManifest);
        done();
      });
    });
  });

  describe('matchFormat()', function () {
    it('Should should return an Error in callback if manifestInfo is undefined.', function(done) {
      transformation.matchFormat(undefined, function(err) {
        should.exist(err);
        err.should.have.property('message', 'Manifest content is empty or not initialized.');
        done();
      });
    });

    it('Should should return an Error in callback if manifestInfo does not contains content property.', function(done) {
      transformation.matchFormat({ key: 'value' }, function(err) {
        should.exist(err);
        err.should.have.property('message', 'Manifest content is empty or not initialized.');
        done();
      });
    });

    it('Should return true if manifestInfo has a empty object content.', function(done) {
      var manifestInfo = { content: {} };

      transformation.matchFormat(manifestInfo, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.be.true;
        done();
      });
    });

    it('Should return true if manifestInfo has a valid W3C manifest in content.', function(done) {
      var manifestInfo = {
        content: {
          'start_url': 'url',
          'name': 'test'
        }
      };

      transformation.matchFormat(manifestInfo, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.be.true;
        done();
      });
    });

    it('Should return true if manifestInfo has a valid W3C manifest in content with extensions.', function(done) {
      var manifestInfo = {
        content: {
          'start_url': 'url',
          'name': 'test',
          'extension_test': 'test',
          'extension_obj': { 'key': 'value' }
        }
      };

      transformation.matchFormat(manifestInfo, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.be.true;
        done();
      });
    });

    it('Should return false if manifestInfo has an invalid W3C manifest in content.', function(done) {
      var manifestInfo = {
        content: {
          'start_url': 'url',
          'name': 'test',
          'invalid': 'test'
        }
      };

      transformation.matchFormat(manifestInfo, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.be.false;
        done();
      });
    });

    it('Should return true if manifestInfo has an valid W3C manifest in content with icons.', function(done) {
      var manifestInfo = {
        content: {
          'start_url': 'url',
          'name': 'test',
          'icons': [{
            'src': 'icon/lowres',
            'sizes': '64x64',
            'type': 'image/webp'
          }]
        }
      };

      transformation.matchFormat(manifestInfo, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.be.true;
        done();
      });
    });

    it('Should return false if manifestInfo has an invalid W3C manifest in content with invalid icons.', function(done) {
      var manifestInfo = {
        content: {
          'start_url': 'url',
          'name': 'test',
          'icons': [{
            'src': 'icon/lowres',
            'invalid': 'test',
            'type': 'image/webp'
          }]
        }
      };

      transformation.matchFormat(manifestInfo, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.be.false;
        done();
      });
    });
  });
});
