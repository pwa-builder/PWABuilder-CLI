'use strict';

var converter = require('../lib/converter');

var assert = require('assert');
var path = require('path');

var assetsDirectory = path.join(__dirname, 'assets');
var validManifest = path.join(assetsDirectory, 'manifest.json');

describe('ManifestConverter()', function () {
  it('input & output format should be optional', function () {
    var manifestConverter = converter(null, null);
    assert(manifestConverter);
  });

  it('if specified, input format should be valid', function () {
    assert.throws(function () { converter('not supported', null); });
  });

  it('if specified, output format should be valid', function () {
    assert.throws(function () { converter(null, 'not supported'); });
  });
});

describe('ManifestConverter.convert()', function () {
  it('inputFile should be required', function (done) {
    var manifestConverter = converter(null, null);

    manifestConverter.convert(null, 'output.json', function (err) {
      assert(err);
      done();
    });
  });

  it('outputFile should be optional', function (done) {
    var manifestConverter = converter(null, null);
    manifestConverter.convert(validManifest, null, done);
  });

  it('should validate input manifest exists', function (done) {
    var manifestConverter = converter(null, null);
    manifestConverter.convert('nonexistent.json', null, function (err) {
      assert(err);
      done();
    });
  });

  it('should validate input manifest is valid json file', function (done) {
    var invalidManifest = path.join(assetsDirectory, 'invalid.json');

    var manifestConverter = converter(null, null);
    manifestConverter.convert(invalidManifest, 'output.json', function (err) {
      assert(err);
      done();
    });
  });

  it('should not report errors if no invalid argument is found', function (done) {
    var manifestConverter = converter(null, null);
    manifestConverter.convert(validManifest, 'output.json', done);
  });
});
