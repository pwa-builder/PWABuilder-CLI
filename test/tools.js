'use strict';

var tools = require('../lib/tools');
var path = require('path');
var fs = require('fs');
var should = require('should');
var http = require('http');

var responseFunction;

var server = http.createServer(function (req, res) {
  if (responseFunction) {
    responseFunction(req, res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

var assetsDirectory = path.join(__dirname, 'assets');

var inputFiles = {
  notExistingFile: path.join(assetsDirectory, 'notExistingFile.json'),
  invalidManifest: path.join(assetsDirectory, 'invalid.json'),
  validManifest: path.join(assetsDirectory, 'manifest.json')
};

var outputFiles = {
  invalidManifestPath: path.join(assetsDirectory, 'notExistingDirectory', 'notExistingFile.json'),
  validManifestPath: path.join(assetsDirectory, 'output-manifest.json')
};

describe('Tools', function () {
  describe('getManifestFromFile()', function () {
    it('Invalid path should return an Error in callback.', function(done) {
      tools.getManifestFromFile(inputFiles.notExistingFile, function(err){
        should.exist(err);
        done();
      });
    });

    it('Invalid json format should return an Error in callback.', function(done) {
      tools.getManifestFromFile(inputFiles.invalidManifest, function(err){
        should.exist(err);
        err.should.have.property('message', 'Invalid manifest format');
        done();
      });
    });

    it('Invalid manifest format should return an Error in callback.');

    it('Valid manifest file should return a manifest info object in callback.', function(done) {
      tools.getManifestFromFile(inputFiles.validManifest, function(err, manifestInfo){
        should.not.exist(err);
        should.exist(manifestInfo);
        manifestInfo.should.have.property('content');
        done();
      });
    });
  });

  describe('writeToFile()', function () {
    it('if manifestInfo is undefined, it should should return an Error in callback.', function(done) {
      tools.writeToFile(undefined, outputFiles.invalidManifestPath, function(err){
        should.exist(err);
        err.should.have.property('message', 'Manifest content is empty or not initialized.');
        done();
      });
    });

    it('if manifestInfo does not contains content property, it should should return an Error in callback.', function(done) {
      tools.writeToFile({ key: 'value' }, outputFiles.invalidManifestPath, function(err){
        should.exist(err);
        err.should.have.property('message', 'Manifest content is empty or not initialized.');
        done();
      });
    });

    it('Write errors should return be returned as an Error in callback.', function(done) {
      tools.writeToFile({ content: { 'start_url': 'url' } }, outputFiles.invalidManifestPath, function(err){
        should.exist(err);
        done();
      });
    });

    it('Should write only the manifest information object content in file.', function(done) {
      tools.writeToFile({ content: { 'start_url': 'url' } }, outputFiles.validManifestPath, function(err){
        should.not.exist(err);
        done();
      });
    });

    after(function() {
      // runs after all tests in this block

      fs.exists(outputFiles.validManifestPath, function (exists) {
        if(exists) {
          fs.unlink(outputFiles.validManifestPath, function (err) {
            if (err) {
              throw err;
            }
          });
        }
      });
    });
  });

  describe('getManifestUrlFromSite()', function () {
    before(function () {
      server.listen(8042);
    });

    it('Invalid url should return an Error in callback.', function(done) {
      responseFunction = function() {
        should.fail('This function should not be called in this test');
      };

      tools.getManifestUrlFromSite('invalid url', function(err) {
        should.exist(err);
        err.should.have.property('message', 'Failed to retrieve manifest from site.');
        done();
      });
    });

    it('Valid url but returning 404 should return an Error in callback.', function(done) {
      responseFunction = function(req, res) {
        res.writeHead(404);
        res.end();
      };

      tools.getManifestUrlFromSite('http://localhost:8042/notfound', function(err) {
        should.exist(err);
        err.should.have.property('message', 'Failed to retrieve manifest from site.');
        done();
      });
    });

    it('Should retrieve undefined from a site that does not contains the manifest tag.', function(done) {
      responseFunction = function(req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' });

        res.end('<!doctype>' +
                '<html>' +
                  '<head>' +
                    '<title>test</title>' +
                  '</head>' +
                  '<body></body>' +
                '</html>');
      };

      tools.getManifestUrlFromSite('http://localhost:8042/urlWithoutManifestTag', function(err, manifestUrl) {
        should.not.exist(err);
        should.not.exist(manifestUrl);
        done();
      });
    });

    it('Should retrieve the manifest url from a site that contains the manifest tag with relative manifest url.', function(done) {
      responseFunction = function(req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' });

        res.end('<!doctype>' +
                '<html>' +
                  '<head>' +
                    '<title>test</title>' +
                    '<link rel="manifest" href="manifest.json">' +
                  '</head>' +
                  '<body></body>' +
                '</html>');
      };

      tools.getManifestUrlFromSite('http://localhost:8042/urlWithManifestTag', function(err, manifestUrl) {
        should.not.exist(err);
        should.exist(manifestUrl);
        manifestUrl.should.be.equal('http://localhost:8042/manifest.json');
        done();
      });
    });

    it('Should retrieve the manifest url from a site that contains the manifest tag with absolute manifest url.', function(done) {
      responseFunction = function(req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' });

        res.end('<!doctype>' +
                '<html>' +
                  '<head>' +
                    '<title>test</title>' +
                    '<link rel="manifest" href="http://www.contoso.com/manifest.json">' +
                  '</head>' +
                  '<body></body>' +
                '</html>');
      };

      tools.getManifestUrlFromSite('http://localhost:8042/urlWithManifestTag', function(err, manifestUrl) {
        should.not.exist(err);
        should.exist(manifestUrl);
        manifestUrl.should.be.equal('http://www.contoso.com/manifest.json');
        done();
      });
    });

    afterEach(function () {
      responseFunction = undefined;
    });

    after(function () {
      server.close();
    });
  });

  describe('downloadManifestFromUrl()', function () {
    before(function () {
      server.listen(8042);
    });

    it('Invalid url should return an Error in callback.', function(done) {
      responseFunction = function() {
        should.fail('This function should not be called in this test');
      };

      tools.downloadManifestFromUrl('invalid url', function(err) {
        should.exist(err);
        err.should.have.property('message', 'Failed to download manifest data.');
        done();
      });
    });

    it('Valid url but returning 404 should return an Error in callback.', function(done) {
      responseFunction = function(req, res) {
        res.writeHead(404);
        res.end();
      };

      tools.downloadManifestFromUrl('http://localhost:8042/notfound', function(err) {
        should.exist(err);
        err.should.have.property('message', 'Failed to download manifest data.');
        done();
      });
    });

    it('Valid url but invalid manifest format should return an Error in callback.', function(done) {
      responseFunction = function(req, res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });

        res.end('invalid json');
      };

      tools.downloadManifestFromUrl('http://localhost:8042/invalidJson', function(err) {
        should.exist(err);
        err.should.have.property('message', 'Invalid manifest format.');
        done();
      });
    });

    it('Should retrieve the manifest info object from a site.', function(done) {
      responseFunction = function(req, res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });

        res.end(JSON.stringify({'start_url': 'http://www.contoso.com/'}));
      };

      tools.downloadManifestFromUrl('http://localhost:8042/validManifest.json', function(err, manifestInfo) {
        should.not.exist(err);
        should.exist(manifestInfo);
        manifestInfo.should.have.properties('content', 'format');
        done();
      });
    });

    afterEach(function () {
      responseFunction = undefined;
    });

    after(function () {
      server.close();
    });
  });

  describe('getManifestFromSite()', function () {
    before(function () {
      server.listen(8042);
    });

    it('Invalid url should return an Error in callback.', function(done) {
      responseFunction = function() {
        should.fail('This function should not be called in this test');
      };

      tools.getManifestFromSite('invalid url', function(err) {
        should.exist(err);
        err.should.have.property('message', 'Failed to retrieve manifest from site.');
        done();
      });
    });

    it('Valid url but returning 404 should return an Error in callback.', function(done) {
      responseFunction = function(req, res) {
        res.writeHead(404);
        res.end();
      };

      tools.getManifestFromSite('http://localhost:8042/notfound', function(err) {
        should.exist(err);
        err.should.have.property('message', 'Failed to retrieve manifest from site.');
        done();
      });
    });

    it('Should retrieve the manifest info object from a site that contains the manifest tag.');

    it('Should create the manifest info object from a site that does not contains the manifest tag.');

    //responseFunction = function(req, res) {
    //  var url_parts = url.parse(req.url);
    //  var route = url_parts.pathname;
    //});

    afterEach(function () {
      responseFunction = undefined;
    });

    after(function () {
      server.close();
    });
  });

  describe('convertTo()', function () {
    it('Convert from W3C to chromeOS.');
    it('Convert from W3C to W3C.');
    it('Convert from chromeOS to W3C.');
    it('Convert from invalid to W3C.');
    it('Convert from W3C to invalid.');
  });
});
