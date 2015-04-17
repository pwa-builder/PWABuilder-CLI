'use strict';

var validation = require('../../../../lib/manifestTools/validationRules/firefox/requiredPlatformsIcons');
var validationConstants = require('../../../../lib/manifestTools/validationConstants');
var should = require('should');

var requiredIconSizes = ['16x16', '32x32', '48x48', '64x64', '90x90', '128x128', '256x256'];
var manifestWithRequiredIconSizes = [{sizes : '16x16'}, {sizes : '32x32'}, {sizes : '48x48'}, {sizes : '64x64'}, {sizes : '90x90'}, {sizes : '128x128'}, {sizes : '256x256'}];

describe('Validation - Firefox', function () {
  describe('requiredPlatformsIcons', function () {
    it('Should return a suggestion if manifest does not contains icons', function(done) {
      validation({}, function(err, suggestion) {
        should.not.exist(err);
        should.exist(suggestion);
        suggestion.should.have.property('platform', validationConstants.platforms.firefox);
        suggestion.should.have.property('level', validationConstants.levels.suggestion);
        suggestion.should.have.property('member', validationConstants.manifestMembers.icons);
        suggestion.should.have.property('code', validationConstants.codes.missingImage);
        suggestion.should.have.property('data', requiredIconSizes);
        done();
      });
    });

    it('Should return a suggestion if manifest icons is empty', function(done) {
      validation({ icons: [] }, function(err, suggestion) {
        should.not.exist(err);
        should.exist(suggestion);
        suggestion.should.have.property('platform', validationConstants.platforms.firefox);
        suggestion.should.have.property('level', validationConstants.levels.suggestion);
        suggestion.should.have.property('member', validationConstants.manifestMembers.icons);
        suggestion.should.have.property('code', validationConstants.codes.missingImage);
        suggestion.should.have.property('data', requiredIconSizes);
        done();
      });
    });

    it('Should return a suggestion if manifest icons does not contains the required sizes', function(done) {
      validation({ icons: [{sizes : '1x1'}] }, function(err, suggestion) {
        should.not.exist(err);
        should.exist(suggestion);
        suggestion.should.have.property('platform', validationConstants.platforms.firefox);
        suggestion.should.have.property('level', validationConstants.levels.suggestion);
        suggestion.should.have.property('member', validationConstants.manifestMembers.icons);
        suggestion.should.have.property('code', validationConstants.codes.missingImage);
        suggestion.should.have.property('data', requiredIconSizes);
        done();
      });
    });

    it('Should return a suggestion if manifest icons contains only one of the required sizes', function(done) {
      validation({ icons: manifestWithRequiredIconSizes.slice(0,1) }, function(err, suggestion) {
        should.not.exist(err);
        should.exist(suggestion);
        suggestion.should.have.property('platform', validationConstants.platforms.firefox);
        suggestion.should.have.property('level', validationConstants.levels.suggestion);
        suggestion.should.have.property('member', validationConstants.manifestMembers.icons);
        suggestion.should.have.property('code', validationConstants.codes.missingImage);
        suggestion.should.have.property('data', requiredIconSizes.slice(1));
        done();
      });
    });

    it('Should not return a suggestion if manifest icons contains all of the required sizes', function(done) {
      validation({ icons: manifestWithRequiredIconSizes }, function(err, suggestion) {
        should.not.exist(err);
        should.not.exist(suggestion);
        done();
      });
    });

    it('Should not return a suggestion if manifest icons contains all the required sizes and others at the end', function(done) {
      var icons = manifestWithRequiredIconSizes.slice();
      icons.push({sizes : '1x1'});
      validation({ icons: icons }, function(err, suggestion) {
        should.not.exist(err);
        should.not.exist(suggestion);
        done();
      });
    });

    it('Should not return a suggestion if manifest icons contains all the required sizes and others at the begining', function(done) {
      var icons = [{sizes : '1x1'}];

      for (var i = 0; i < manifestWithRequiredIconSizes.length; i++) {
        icons.push(manifestWithRequiredIconSizes[i]);
      }

      validation({ icons: icons }, function(err, suggestion) {
        should.not.exist(err);
        should.not.exist(suggestion);
        done();
      });
    });
  });
});
