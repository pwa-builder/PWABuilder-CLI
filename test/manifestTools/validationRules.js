'use strict';

var validationRules = require('../../lib/manifestTools/validationRules');
var path = require('path');
var fs = require('fs');
require('should');

var validationRulesPath = path.join(__dirname, '..', '..', 'lib', 'manifestTools', 'validationRules');

describe('validationRules', function () {
  describe('Loaded modules', function () {
    it('Should load all validationRules modules', function() {
      validationRules.should.have.property('all');
      validationRules.should.have.property('android');
      validationRules.should.have.property('chrome');
      validationRules.should.have.property('firefox');
      validationRules.should.have.property('windows');
      validationRules.should.have.property('ios');
    });

    it('Should load all modules (files) in the validationRules folder', function(done) {
      fs.readdir(validationRulesPath, function (err, files) {
        var validationRulesLoadedLength = Object.keys(validationRules).length;
        validationRulesLoadedLength.should.be.above(0);
        validationRulesLoadedLength.should.be.equal(files.length);

        done();
      });
    });

    it('All loaded modules should have the same interface', function() {
      for (var validationRules in validationRules) {
        /*jshint -W030 */
        validationRules[validationRules].should.be.a.Function;
      }
    });
  });
});
