'use strict';

var validation = require('../../../../lib/manifestTools/validationRules/firefox/requiredIconsOnSite');
var validationConstants = require('../../../../lib/manifestTools/validationConstants');
var should = require('should');
var http = require('http');

//var manifestWithRequiredIconSizes = [{sizes : '128x128', src: '' }, {sizes : '512x512', src: '' }];

var responseFunction;
var server = http.createServer(function (req, res) {
  if (responseFunction) {
    responseFunction(req, res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

describe('Validation - Firefox', function () {
  describe('requiredIconsOnSite', function () {
    before(function () {
      server.listen(8042);
    });

    it('Should not return a warning if manifest does not contains icons', function(done) {
      responseFunction = function() {
        should.fail('This function should not be called in this test');
      };

      validation({}, function(err, warning) {
        should.not.exist(err);
        should.not.exist(warning);
        done();
      });
    });

    it('Should not return a warning if manifest icons does not contains the required sizes', function(done) {
      responseFunction = function() {
        should.fail('This function should not be called in this test');
      };

      validation({ icons: [{sizes : '1x1'}] }, function(err, warning) {
        should.not.exist(err);
        should.not.exist(warning);
        done();
      });
    });

    it('Should return a warning if icon is not hosted', function(done) {
      responseFunction = function(req, res) {
        res.writeHead(404);
        res.end();
      };

      var icon = {sizes : '128x128', src: 'http://localhost:8042/notfound'};

      validation({ icons: [icon] }, function(err, warning) {
        should.not.exist(err);
        should.exist(warning);
        warning.should.have.property('platform', validationConstants.platforms.firefox);
        warning.should.have.property('level', validationConstants.levels.warning);
        warning.should.have.property('member', validationConstants.manifestMembers.icons);
        warning.should.have.property('code', validationConstants.codes.missingImageOnsite);
        warning.should.have.property('data', [icon]);
        done();
      });
    });


    it('Should return a warning if icon is not hosted using relative urls', function(done) {
      responseFunction = function(req, res) {
        res.writeHead(404);
        res.end();
      };

      var icon = {sizes : '128x128', src: 'found'};

      validation({ start_url:'http://localhost:8042/',  icons: [icon] }, function(err, warning) {
        should.not.exist(err);
        should.exist(warning);
        warning.should.have.property('platform', validationConstants.platforms.firefox);
        warning.should.have.property('level', validationConstants.levels.warning);
        warning.should.have.property('member', validationConstants.manifestMembers.icons);
        warning.should.have.property('code', validationConstants.codes.missingImageOnsite);
        warning.should.have.property('data', [icon]);
        done();
      });
    });

    it('Should not return a warning if icon is hosted', function(done) {
      responseFunction = function(req, res) {
        res.writeHead(200);
        res.end();
      };

      validation({ icons: [{sizes : '128x128', src: 'http://localhost:8042/found'}] }, function(err, warning) {
        should.not.exist(err);
        should.not.exist(warning);
        done();
      });
    });

    it('Should return a warning if icon is hosted using relative urls', function(done) {
      responseFunction = function(req, res) {
        res.writeHead(200);
        res.end();
      };

      validation({ start_url:'http://localhost:8042/',  icons: [{sizes : '128x128', src: 'found'}] }, function(err, warning) {
        should.not.exist(err);
        should.not.exist(warning);
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
});
