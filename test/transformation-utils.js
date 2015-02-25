'use strict';

var utils = require('../lib/transformation-utils');
var should = require('should');

describe('transformation-utils', function () {
  describe('convertWithMatrix()', function () {
    it('Should return an empty object if original object is undefined', function() {
      var originalObj;
      var transformationsMatrix = {};
      var result = utils.convertWithMatrix(originalObj, transformationsMatrix);

      should.exist(result);
      /*jshint -W030 */
      result.should.be.empty;
    });

    it('Should return an empty object if original object is an empty object', function() {
      var originalObj = {};
      var transformationsMatrix = {};
      var result = utils.convertWithMatrix(originalObj, transformationsMatrix);

      should.exist(result);
      /*jshint -W030 */
      result.should.be.empty;
    });

    it('Should return an empty object if transformationsMatrix object is an empty object', function() {
      var originalObj = { key: 'value'};
      var transformationsMatrix = {};
      var result = utils.convertWithMatrix(originalObj, transformationsMatrix);

      should.exist(result);
      /*jshint -W030 */
      result.should.be.empty;
    });

    it('Should update key with newKey without modifing the value', function() {
      var originalObj = { key: 'value'};
      var transformationsMatrix = { key: 'newKey' };
      var result = utils.convertWithMatrix(originalObj, transformationsMatrix);

      should.exist(result);
      result.should.have.property('newKey', originalObj.key);
      var transformationLoadedLength = Object.keys(result).length;
      transformationLoadedLength.should.be.equal(1);
    });

    it('Should update key with newKey without modifing the value', function() {
      var originalObj = { key: 'value'};
      var transformationsMatrix = { key: 'newKey' };
      var result = utils.convertWithMatrix(originalObj, transformationsMatrix);

      should.exist(result);
      result.should.have.property('newKey', originalObj.key);
      var transformationLoadedLength = Object.keys(result).length;
      transformationLoadedLength.should.be.equal(1);
    });

    it('Should update key with function result', function() {
      var originalObj = { key: 'value', otherKey: 'other value'};
      var transformationsMatrix = {
        key: function (originalObj, resultObj) {
          resultObj.newKey = {
            oldValue : originalObj.key,
            newValue : 'new' + originalObj.key
          };

          return resultObj;
        }
      };

      var result = utils.convertWithMatrix(originalObj, transformationsMatrix);

      should.exist(result);
      result.should.have.property('newKey');
      result.newKey.should.have.property('oldValue', originalObj.key);
      result.newKey.should.have.property('newValue', 'new' + originalObj.key);
      result.should.not.have.property('otherKey');
      var transformationLoadedLength = Object.keys(result).length;
      transformationLoadedLength.should.be.equal(1);
    });
  });
});
