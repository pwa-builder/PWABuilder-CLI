'use strict';

var validation = require('../../../../lib/manifestTools/validationRules/all/startUrlRequired');
var validationConstants = require('../../../../lib/manifestTools/validationConstants');
var should = require('should');

describe('Validation - All', function () {
  describe('startUrlRequired', function () {
    it('Should return an error if manifest does not contains start url', function(done) {
      validation({}, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.property('platform', validationConstants.platforms.all);
        error.should.have.property('level', validationConstants.levels.error);
        error.should.have.property('member', validationConstants.manifestMembers.start_url);
        error.should.have.property('code', validationConstants.codes.requiredValue);
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
        error.should.have.property('code', validationConstants.codes.requiredValue);
        done();
      });
    });

    it('Should return an error if manifest start url is only whitespaces', function(done) {
      validation({ start_url: '       ' }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.property('platform', validationConstants.platforms.all);
        error.should.have.property('level', validationConstants.levels.error);
        error.should.have.property('member', validationConstants.manifestMembers.start_url);
        error.should.have.property('code', validationConstants.codes.requiredValue);
        done();
      });
    });

    it('Should not return an error if manifest start url is not empty', function(done) {
      validation({ start_url: 'something' }, function(err, error) {
        should.not.exist(err);
        should.not.exist(error);
        done();
      });
    });
  });
});
