'use strict';

var validation = require('../../../../lib/manifestTools/validationRules/all/requiredAccessRules');
var validationConstants = require('../../../../lib/manifestTools/validationConstants');
var should = require('should');

describe('Validation - All', function () {
  describe('requiredAccessRules', function () {
    it('Should return a suggestion if manifest does not contains access rules', function(done) {
      validation({}, function(err, suggestion) {
        should.not.exist(err);
        should.exist(suggestion);
        suggestion.should.have.property('platform', validationConstants.platforms.all);
        suggestion.should.have.property('level', validationConstants.levels.suggestion);
        suggestion.should.have.property('member', validationConstants.manifestMembers.mjs_access_whitelist);
        suggestion.should.have.property('code', validationConstants.codes.requiredValue);
        done();
      });
    });

    it('Should return a suggestion if manifest access rules is not an array', function(done) {
      validation({ mjs_access_whitelist: 'test' }, function(err, suggestion) {
        should.not.exist(err);
        should.exist(suggestion);
        suggestion.should.have.property('platform', validationConstants.platforms.all);
        suggestion.should.have.property('level', validationConstants.levels.suggestion);
        suggestion.should.have.property('member', validationConstants.manifestMembers.mjs_access_whitelist);
        suggestion.should.have.property('code', validationConstants.codes.requiredValue);
        done();
      });
    });

    it('Should return a suggestion if manifest access rules is empty', function(done) {
      validation({ mjs_access_whitelist: [] }, function(err, suggestion) {
        should.not.exist(err);
        should.exist(suggestion);
        suggestion.should.have.property('platform', validationConstants.platforms.all);
        suggestion.should.have.property('level', validationConstants.levels.suggestion);
        suggestion.should.have.property('member', validationConstants.manifestMembers.mjs_access_whitelist);
        suggestion.should.have.property('code', validationConstants.codes.requiredValue);
        done();
      });
    });

    it('Should not return a suggestion if manifest access rules is not empty', function(done) {
      validation({ mjs_access_whitelist: ['something'] }, function(err, suggestion) {
        should.not.exist(err);
        should.not.exist(suggestion);
        done();
      });
    });
  });
});
