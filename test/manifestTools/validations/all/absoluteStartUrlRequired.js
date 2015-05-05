'use strict';

var validation = require('../../../../lib/manifestTools/validationRules/all/absoluteStartUrlRequired');
var validationConstants = require('../../../../lib/manifestTools/validationConstants');
var should = require('should');

describe('Validation - All', function () {
  describe('absoluteStartUrlRequired', function () {
    it('Should return an error if manifest does not contains start url', function(done) {
      validation({}, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.property('platform', validationConstants.platforms.all);
        error.should.have.property('level', validationConstants.levels.error);
        error.should.have.property('member', validationConstants.manifestMembers.start_url);
        error.should.have.property('code', validationConstants.codes.requiredAbsoluteUrl);
        done();
      });
    });

    it('Should return an error if manifest start url is empty', function(done) {
      validation({ start_url: '' }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.property('platform', validationConstants.platforms.all);
        error.should.have.property('level', validationConstants.levels.error);
        error.should.have.property('member', validationConstants.manifestMembers.start_url);
        error.should.have.property('code', validationConstants.codes.requiredAbsoluteUrl);
        done();
      });
    });

    it('Should return an error if manifest start url is a relative url', function(done) {
      validation({ start_url: 'index.html' }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.property('platform', validationConstants.platforms.all);
        error.should.have.property('level', validationConstants.levels.error);
        error.should.have.property('member', validationConstants.manifestMembers.start_url);
        error.should.have.property('code', validationConstants.codes.requiredAbsoluteUrl);
        done();
      });
    });

    it('Should return an error if manifest start url is a absolute url', function(done) {
      validation({ start_url: '/index.html' }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.property('platform', validationConstants.platforms.all);
        error.should.have.property('level', validationConstants.levels.error);
        error.should.have.property('member', validationConstants.manifestMembers.start_url);
        error.should.have.property('code', validationConstants.codes.requiredAbsoluteUrl);
        done();
      });
    });

    it('Should return an error if manifest start url is a full url without protocol', function(done) {
      validation({ start_url: 'www.manifoldjs.com/index.html' }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.property('platform', validationConstants.platforms.all);
        error.should.have.property('level', validationConstants.levels.error);
        error.should.have.property('member', validationConstants.manifestMembers.start_url);
        error.should.have.property('code', validationConstants.codes.requiredAbsoluteUrl);
        done();
      });
    });

    it('Should not return an error if manifest start url is valid', function(done) {
      validation({ start_url: 'http://www.manifoldjs.com/' }, function(err, error) {
        should.not.exist(err);
        should.not.exist(error);
        done();
      });
    });

    it('Should not return an error if manifest start url is a valid full url.', function(done) {
      validation({ start_url: 'http://www.manifoldjs.com/index.html' }, function(err, error) {
        should.not.exist(err);
        should.not.exist(error);
        done();
      });
    });
  });
});
