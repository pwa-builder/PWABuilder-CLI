'use strict';

var validation = require('../../../../lib/manifestTools/validationRules/all/shortNameRequiresSanitization');
var validationConstants = require('../../../../lib/manifestTools/validationConstants');
var should = require('should');

describe('Validation - All', function () {
  describe('shortNameRequiresSanitization', function () {
    it('Should return a warning if manifest short name is not valid', function(done) {
      validation({ short_name: '123.456.789' }, function(err, error) {
        should.not.exist(err);
        should.exist(error);
        error.should.have.property('platform', validationConstants.platforms.all);
        error.should.have.property('level', validationConstants.levels.warning);
        error.should.have.property('member', validationConstants.manifestMembers.short_name);
        error.should.have.property('code', validationConstants.codes.invalidValue);
        done();
      });
    });
    
    it('Should return no warning if manifest does not contain short name', function(done) {
      validation({}, function(err, error) {
        should.not.exist(err);
        should.not.exist(error);
        done();
      });
    });

    it('Should return no warning if manifest short name is empty', function(done) {
      validation({ short_name: '' }, function(err, error) {
        should.not.exist(err);
        should.not.exist(error);
        done();
      });
    });

    it('Should return no warning error if manifest short name is only whitespaces', function(done) {
      validation({ short_name: '      ' }, function(err, error) {
        should.not.exist(err);
        should.not.exist(error);
        done();
      });
    });

    it('Should return no warning if manifest short name is valid', function(done) {
      validation({ short_name: 'something' }, function(err, error) {
        should.not.exist(err);
        should.not.exist(error);
        done();
      });
    });
  });
});
