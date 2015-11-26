'use strict';

var validation = require('../../../../lib/manifestTools/validationRules/all/apiAccessRulesValid');
var validationConstants = require('../../../../lib/manifestTools/validationConstants');
var should = require('should');

describe('Validation - All', function () {
  describe('apiAccessRulesValid', function () {
    it('Should return error if platforms are not supported', function(done) {
      validation({ mjs_api_access: [ { platform : 'invalidplatform' } ] }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.length(1);
        error[0].should.have.property('platform', validationConstants.platforms.all);
        error[0].should.have.property('level', validationConstants.levels.error);
        error[0].should.have.property('member', validationConstants.manifestMembers.mjs_api_access);
        error[0].should.have.property('code', validationConstants.codes.invalidValue);
        done();
      });
    });

    it('Should return error if API access type is not supported for cordova platforms', function(done) {
      validation({ mjs_api_access: [ { platform : 'windows,ios,android', access : 'invalidtype' } ] }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.length(3);
        error[0].should.have.property('platform', validationConstants.platforms.all);
        error[0].should.have.property('level', validationConstants.levels.error);
        error[0].should.have.property('member', validationConstants.manifestMembers.mjs_api_access);
        error[0].should.have.property('code', validationConstants.codes.invalidValue);
        error[1].should.have.property('platform', validationConstants.platforms.all);
        error[1].should.have.property('level', validationConstants.levels.error);
        error[1].should.have.property('member', validationConstants.manifestMembers.mjs_api_access);
        error[1].should.have.property('code', validationConstants.codes.invalidValue);
        error[2].should.have.property('platform', validationConstants.platforms.all);
        error[2].should.have.property('level', validationConstants.levels.error);
        error[2].should.have.property('member', validationConstants.manifestMembers.mjs_api_access);
        error[2].should.have.property('code', validationConstants.codes.invalidValue);
        done();
      });
    });

    it('Should return error if API access type is not supported for windows10 platform', function(done) {
      validation({ mjs_api_access: [ { platform : 'windows10', access : 'invalidtype' } ] }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.length(1);
        error[0].should.have.property('platform', validationConstants.platforms.all);
        error[0].should.have.property('level', validationConstants.levels.error);
        error[0].should.have.property('member', validationConstants.manifestMembers.mjs_api_access);
        error[0].should.have.property('code', validationConstants.codes.invalidValue);
        done();
      });
    });

    it('Should not return error if \'cordova\' access type is specified for cordova platforms', function(done) {
      validation({ mjs_api_access: [ { match : 'http://domain.com', platform : 'windows,ios,android', access: 'cordova' } ] }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.length(0);
        done();
      });
    });
   
    it('Should not return error if \'all\' access type is specified for windows10 platform', function(done) {
      validation({ mjs_api_access: [ { match : 'http://domain.com', platform : 'windows10', access: 'all' } ] }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.length(0);
        done();
      });
    });

    it('Should not return error if \'allowForWebOnly\' access type is specified for windows10 platform', function(done) {
      validation({ mjs_api_access: [ { match : 'http://domain.com', platform : 'windows10', access: 'allowForWebOnly' } ] }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.length(0);
        done();
      });
    });
    
    it('Should not return error if \'none\' access type is specified for all platforms', function(done) {
      validation({ mjs_api_access: [ { match : 'http://domain.com', platform : 'android,ios,windows,windows10', access: 'none' } ] }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.length(0);
        done();
      });
    });
  });
});
