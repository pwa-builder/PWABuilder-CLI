'use strict';

var validation = require('../../../../lib/manifestTools/validationRules/all/shortNameRequired');
var validationConstants = require('../../../../lib/manifestTools/validationConstants');
var should = require('should');

describe('Validation - All', function () {
  describe('shortNameRequired', function () {
    it('Should return an error if manifest does not contains short name', function(done) {
      validation({}, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.property('platform', validationConstants.platforms.all);
        error.should.have.property('level', validationConstants.levels.error);
        error.should.have.property('member', validationConstants.manifestMembers.short_name);
        error.should.have.property('code', validationConstants.codes.requiredValue);
        done();
      });
    });

    it('Should return an error if manifest short name is empty', function(done) {
      validation({ short_name: '' }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.property('platform', validationConstants.platforms.all);
        error.should.have.property('level', validationConstants.levels.error);
        error.should.have.property('member', validationConstants.manifestMembers.short_name);
        error.should.have.property('code', validationConstants.codes.requiredValue);
        done();
      });
    });

    it('Should return an error if manifest short name is only whitespaces', function(done) {
      validation({ short_name: '       ' }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.property('platform', validationConstants.platforms.all);
        error.should.have.property('level', validationConstants.levels.error);
        error.should.have.property('member', validationConstants.manifestMembers.short_name);
        error.should.have.property('code', validationConstants.codes.requiredValue);
        done();
      });
    });

    it('Should not return an error if manifest short name is not empty', function(done) {
      validation({ short_name: 'something' }, function(err, error) {
        should.not.exist(err);
        should.not.exist(error);
        done();
      });
    });
  });
});
