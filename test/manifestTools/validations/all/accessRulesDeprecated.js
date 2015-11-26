'use strict';

var validation = require('../../../../lib/manifestTools/validationRules/all/accessRulesDeprecated');
var validationConstants = require('../../../../lib/manifestTools/validationConstants');
var should = require('should');

describe('Validation - All', function () {
  describe('deprecatedAccessRules', function () {
    it('Should return a \'deprecated\' warning if manifest defines access rules', function(done) {
      validation({ mjs_access_whitelist: ['test'] }, function(err, warning) {
        should.not.exist(err);
        should.exist(warning);
        warning.should.have.property('platform', validationConstants.platforms.all);
        warning.should.have.property('level', validationConstants.levels.warning);
        warning.should.have.property('member', validationConstants.manifestMembers.mjs_access_whitelist);
        warning.should.have.property('code', validationConstants.codes.deprecatedMember);
        done();
      });
    });

    it('Should not return a warning if manifest access rules is not defined', function(done) {
      validation({}, function(err, warning) {
        should.not.exist(err);
        should.not.exist(warning);
        done();
      });
    });
  });
});
