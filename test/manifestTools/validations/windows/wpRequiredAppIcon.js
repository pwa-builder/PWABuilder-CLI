'use strict';

var validation = require('../../../../lib/manifestTools/validationRules/windows/wpRequiredAppIcon');
var validationConstants = require('../../../../lib/manifestTools/validationConstants');
var should = require('should');

var validIconSizes = ['44x44', '62x62', '106x106'];

describe('Validation - Windows', function () {
  describe('wpRequiredAppIcon', function () {
    it('Should return a warning if manifest does not contains icons', function(done) {
      validation({}, function(err, warning) {
        should.not.exist(err);
        should.exist(warning);
        warning.should.have.property('platform', validationConstants.platforms.windows);
        warning.should.have.property('level', validationConstants.levels.warning);
        warning.should.have.property('member', validationConstants.manifestMembers.icons);
        warning.should.have.property('code', validationConstants.codes.missingImageGroup);
        warning.should.have.property('data', validIconSizes);
        done();
      });
    });

    it('Should return a warning if manifest icons is empty', function(done) {
      validation({ icons: [] }, function(err, warning) {
        should.not.exist(err);
        should.exist(warning);
        warning.should.have.property('platform', validationConstants.platforms.windows);
        warning.should.have.property('level', validationConstants.levels.warning);
        warning.should.have.property('member', validationConstants.manifestMembers.icons);
        warning.should.have.property('code', validationConstants.codes.missingImageGroup);
        warning.should.have.property('data', validIconSizes);
        done();
      });
    });

    it('Should return a warning if manifest icons does not contains the required sizes', function(done) {
      validation({ icons: ['1x1'] }, function(err, warning) {
        should.not.exist(err);
        should.exist(warning);
        warning.should.have.property('platform', validationConstants.platforms.windows);
        warning.should.have.property('level', validationConstants.levels.warning);
        warning.should.have.property('member', validationConstants.manifestMembers.icons);
        warning.should.have.property('code', validationConstants.codes.missingImageGroup);
        warning.should.have.property('data', validIconSizes);
        done();
      });
    });

    it('Should not return a warning if manifest icons contains one of the required sizes', function(done) {
      validation({ icons: validIconSizes.slice(1,2) }, function(err, warning) {
        should.not.exist(err);
        should.not.exist(warning);
        done();
      });
    });

    it('Should not return a warning if manifest icons contains all of the required sizes', function(done) {
      validation({ icons: validIconSizes }, function(err, warning) {
        should.not.exist(err);
        should.not.exist(warning);
        done();
      });
    });

    it('Should not return a warning if manifest icons contains one of the required sizes and others at the end', function(done) {
      var icons = validIconSizes.slice(1,3);
      icons.push('1x1');
      validation({ icons: icons }, function(err, warning) {
        should.not.exist(err);
        should.not.exist(warning);
        done();
      });
    });

    it('Should not return a warning if manifest icons contains one of the required sizes and others at the begining', function(done) {
      var icons = ['1x1'];
      icons.push(validIconSizes[1]);

      validation({ icons: icons }, function(err, warning) {
        should.not.exist(err);
        should.not.exist(warning);
        done();
      });
    });
  });
});
