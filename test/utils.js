'use strict';

var utils = require('../lib/utils');
var should = require('should');

describe('utils', function () {
  describe('parseJSON()', function () {
    it('Return the parsed JSON', function() {
      var inputJSON = '{"key": "value", "number": 42 }';
      var result = utils.parseJSON(inputJSON);
      should.exist(result);
      result.should.have.property('key', 'value');
      result.should.have.property('number', 42);
    });

    it('undefined should return undefined', function() {
      var result = utils.parseJSON(undefined);
      should.not.exist(result);
    });

    it('String should return undefined', function() {
      var result = utils.parseJSON('this is a string');
      should.not.exist(result);
    });
  });

  describe('isFunction()', function () {
    it('Should return true if parameter is a function', function() {
      var inputValue = function() {};
      var result = utils.isFunction(inputValue);
      /*jshint -W030 */
      result.should.be.true;
    });

    it('Should return false if parameter is a boolean', function() {
      var inputValue = true;
      var result = utils.isFunction(inputValue);
      /*jshint -W030 */
      result.should.be.false;
    });

    it('Should return false if parameter is a string', function() {
      var inputValue = 'this is a string';
      var result = utils.isFunction(inputValue);
      /*jshint -W030 */
      result.should.be.false;
    });

    it('Should return false if parameter is a number', function() {
      var inputValue = 42;
      var result = utils.isFunction(inputValue);
      /*jshint -W030 */
      result.should.be.false;
    });

    it('Should return false if parameter is an object', function() {
      var inputValue = { key : 'value'};
      var result = utils.isFunction(inputValue);
      /*jshint -W030 */
      result.should.be.false;
    });
  });
});
