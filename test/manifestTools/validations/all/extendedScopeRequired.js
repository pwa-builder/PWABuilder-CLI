'use strict';

var validation = require('../../../../lib/manifestTools/validationRules/all/extendedScopeRequired');
var validationConstants = require('../../../../lib/manifestTools/validationConstants');
var should = require('should');

describe('Validation - All', function () {
  describe('extendedScopeRequired', function () {
    it('Should return a suggestion if manifest does not contain scope rules', function(done) {
      validation({}, function(err, suggestion) {
        should.not.exist(err);
        should.exist(suggestion);
        suggestion.should.have.property('platform', validationConstants.platforms.all);
        suggestion.should.have.property('level', validationConstants.levels.suggestion);
        suggestion.should.have.property('member', validationConstants.manifestMembers.mjs_extended_scope);
        suggestion.should.have.property('code', validationConstants.codes.requiredValue);
        done();
      });
    });

    it('Should return a suggestion if manifest scope rules is not an array', function(done) {
      validation({ mjs_extended_scope: 'test' }, function(err, suggestion) {
        should.not.exist(err);
        should.exist(suggestion);
        suggestion.should.have.property('platform', validationConstants.platforms.all);
        suggestion.should.have.property('level', validationConstants.levels.suggestion);
        suggestion.should.have.property('member', validationConstants.manifestMembers.mjs_extended_scope);
        suggestion.should.have.property('code', validationConstants.codes.requiredValue);
        done();
      });
    });

    it('Should return a suggestion if manifest scope rules is an empty array', function(done) {
      validation({ mjs_extended_scope: [] }, function(err, suggestion) {
        should.not.exist(err);
        should.exist(suggestion);
        suggestion.should.have.property('platform', validationConstants.platforms.all);
        suggestion.should.have.property('level', validationConstants.levels.suggestion);
        suggestion.should.have.property('member', validationConstants.manifestMembers.mjs_extended_scope);
        suggestion.should.have.property('code', validationConstants.codes.requiredValue);
        done();
      });
    });

    it('Should not return a suggestion if manifest scope rules array is not empty', function(done) {
      validation({ mjs_extended_scope: ['url'] }, function(err, suggestion) {
        should.not.exist(err);
        should.not.exist(suggestion);
        done();
      });
    });
  });
});
