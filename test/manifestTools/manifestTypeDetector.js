'use strict';

var manifestTypeDetector = require('../../lib/manifestTools/manifestTypeDetector');
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
    
    it('ChromeOS manifest object should match ChromeOS format', function() {
      var manifestObj = {
          'manifest_version': 2,
          'name': 'Sample',
          'description': 'Chrome Web App Sample',
          'version': '0.0.1',
          'app': {
              'launch': {
                  'web_url': 'http://example.com'
              }
          },
          'icons': {
              '16': 'icon-16.png',
              '48': 'icon-48.png',
              '128': 'icon-128.png'
          },
          'permissions': [
              'notifications',
              'background'
          ]
      };

      var result = manifestTypeDetector.detect(manifestObj);

      should.exist(result);
      result.should.be.equal('chromeos');
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
