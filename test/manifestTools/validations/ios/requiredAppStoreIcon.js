'use strict';

var validation = require('../../../../lib/manifestTools/validationRules/ios/requiredAppStoreIcon');
var validationConstants = require('../../../../lib/manifestTools/validationConstants');
var should = require('should');

var requiredIconSizes = ['1024x1024'];
var manifestWithRequiredIconSizes = [{sizes : '1024x1024'}];

describe('Validation - iOS', function () {
  describe('requiredAppStoreIcon', function () {
    it('Should return a warning if manifest does not contains icons', function(done) {
      validation({}, function(err, warning) {
        should.not.exist(err);
        should.exist(warning);
        warning.should.have.property('platform', validationConstants.platforms.ios);
        warning.should.have.property('level', validationConstants.levels.warning);
        warning.should.have.property('member', validationConstants.manifestMembers.icons);
        warning.should.have.property('code', validationConstants.codes.missingImage);
        warning.should.have.property('data', requiredIconSizes);
        done();
      });
    });

    it('Should return a warning if manifest icons is empty', function(done) {
      validation({ icons: [] }, function(err, warning) {
        should.not.exist(err);
        should.exist(warning);
        warning.should.have.property('platform', validationConstants.platforms.ios);
        warning.should.have.property('level', validationConstants.levels.warning);
        warning.should.have.property('member', validationConstants.manifestMembers.icons);
        warning.should.have.property('code', validationConstants.codes.missingImage);
        warning.should.have.property('data', requiredIconSizes);
        done();
      });
    });

    it('Should return a warning if manifest icons does not contains the required sizes', function(done) {
      validation({ icons: [{sizes : '1x1'}] }, function(err, warning) {
        should.not.exist(err);
        should.exist(warning);
        warning.should.have.property('platform', validationConstants.platforms.ios);
        warning.should.have.property('level', validationConstants.levels.warning);
        warning.should.have.property('member', validationConstants.manifestMembers.icons);
        warning.should.have.property('code', validationConstants.codes.missingImage);
        warning.should.have.property('data', requiredIconSizes);
        done();
      });
    });

    it('Should not return a warning if manifest icons contains all of the required sizes', function(done) {
      validation({ icons: manifestWithRequiredIconSizes }, function(err, warning) {
        should.not.exist(err);
        should.not.exist(warning);
        done();
      });
    });

    it('Should not return a warning if manifest icons contains all the required sizes and others at the end', function(done) {
      var icons = manifestWithRequiredIconSizes.slice();
      icons.push({sizes : '1x1'});
      validation({ icons: icons }, function(err, warning) {
        should.not.exist(err);
        should.not.exist(warning);
        done();
      });
    });

    it('Should not return a warning if manifest icons contains all the required sizes and others at the begining', function(done) {
      var icons = [{sizes : '1x1'}];

      for (var i = 0; i < manifestWithRequiredIconSizes.length; i++) {
        icons.push(manifestWithRequiredIconSizes[i]);
      }

      validation({ icons: icons }, function(err, warning) {
        should.not.exist(err);
        should.not.exist(warning);
        done();
      });
    });
  });
});
