'use strict';

var manifestTypeDetector = require('../lib/manifestTypeDetector');
var should = require('should');

describe('Manifest Type Detector', function () {
  describe('detect()', function () {
    it('Empty object should match w3c format', function() {
      var manifestObj = {};

      var result = manifestTypeDetector.detect(manifestObj);

      should.exist(result);
      result.should.be.equal('w3c');
    });

    it('W3C manifest object should match w3c format', function() {
      var manifestObj = {
        'start_url': 'url',
        'name': 'test'
      };

      var result = manifestTypeDetector.detect(manifestObj);

      should.exist(result);
      result.should.be.equal('w3c');
    });

    it('Invalid manifest object should return undefined as format', function() {
      var manifestObj = {
        'start_url': 'url',
        'name': 'test',
        'invalid': 'test'
      };

      var result = manifestTypeDetector.detect(manifestObj);

      should.not.exist(result);
    });
  });
});
