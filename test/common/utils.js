'use strict';

var utils = require('../../lib/common/utils');
var should = require('should');

describe('utils', function () {
  describe('parseJSON()', function () {
    it('Should parse valid JSON', function() {
      var inputJSON = '{"key": "value", "number": 42 }';
      var result = utils.parseJSON(inputJSON);
      should.exist(result);
      result.should.have.property('key', 'value');
      result.should.have.property('number', 42);
    });

    it('Should return undefined if input is undefined', function() {
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

  describe('isString()', function () {
    it('Should return true if parameter is a string', function() {
      var inputValue = 'this is a string';
      var result = utils.isString(inputValue);
      /*jshint -W030 */
      result.should.be.true;
    });

    it('Should return false if parameter is a boolean', function() {
      var inputValue = true;
      var result = utils.isString(inputValue);
      /*jshint -W030 */
      result.should.be.false;
    });

    it('Should return false if parameter is a function', function() {
      var inputValue = function () {};
      var result = utils.isString(inputValue);
      /*jshint -W030 */
      result.should.be.false;
    });

    it('Should return false if parameter is a number', function() {
      var inputValue = 42;
      var result = utils.isString(inputValue);
      /*jshint -W030 */
      result.should.be.false;
    });

    it('Should return false if parameter is an object', function() {
      var inputValue = { key : 'value'};
      var result = utils.isString(inputValue);
      /*jshint -W030 */
      result.should.be.false;
    });
  });

  describe('isURL()', function () {
    it('Should return false if parameter is a number', function () {
      var inputValue = 123;
      var result = utils.isURL(inputValue);
      /*jshint -W030 */
      result.should.be.false;
    });
    it('Should return false if parameter is a boolean', function () {
      var inputValue = true;
      var result = utils.isURL(inputValue);
      /*jshint -W030 */
      result.should.be.false;
    });
    it('Should return true if parameter is a full URL', function () {
      var inputValue = 'http://www.xyz.com/index.html';
      var result = utils.isURL(inputValue);
      /*jshint -W030 */
      result.should.be.true;
    });
    it('Should return true if parameter is an absolute URL', function () {
      var inputValue = '/a/b/index.html';
      var result = utils.isURL(inputValue);
      /*jshint -W030 */
      result.should.be.true;
    });
    it('Should return true if parameter is a relative URL', function () {
      var inputValue = 'a/b/index.html';
      var result = utils.isURL(inputValue);
      /*jshint -W030 */
      result.should.be.true;
    });
  });
  
  describe('sanitizeName()', function () {
    it('Should not remove any character (lower case)', function () {
      var inputValue = 'abc123.def456.ghi789';
      var result = utils.sanitizeName(inputValue);
      /*jshint -W030 */
      result.should.be.exactly('abc123.def456.ghi789');
    });

    it('Should not remove any character (upper case)', function () {
      var inputValue = 'ABC123.DEF456.GHI789';
      var result = utils.sanitizeName(inputValue);
      /*jshint -W030 */
      result.should.be.exactly('ABC123.DEF456.GHI789');
    });

    it('Should remove invalid characters', function () {
      var inputValue = '!"#-/\ @%abc()!"#-/\ @%';
      var result = utils.sanitizeName(inputValue);
      /*jshint -W030 */
      result.should.be.exactly('abc');
    });

    it('Should remove first character if it is a number', function () {
      var inputValue = '1abc';
      var result = utils.sanitizeName(inputValue);
      /*jshint -W030 */
      result.should.be.exactly('abc');
    });
    
    it('Should remove first character if it is a dot', function () {
      var inputValue = '.abc';
      var result = utils.sanitizeName(inputValue);
      /*jshint -W030 */
      result.should.be.exactly('abc');
    });
    
    it('Should remove all numbers after a dot', function () {
      var inputValue = 'abc.123def';
      var result = utils.sanitizeName(inputValue);
      /*jshint -W030 */
      result.should.be.exactly('abc.def');
    });
    
    it('Should remove numbers and dots at the beginning', function () {
      var inputValue = '123.abc';
      var result = utils.sanitizeName(inputValue);
      /*jshint -W030 */
      result.should.be.exactly('abc');
    });

    it('Should remove numbers and dots at the end (scenario 1)', function () {
      var inputValue = 'abc.123';
      var result = utils.sanitizeName(inputValue);
      /*jshint -W030 */
      result.should.be.exactly('abc');
    });
    
    it('Should remove numbers and dots at the end (scenario 2)', function () {
      var inputValue = 'abc.123.456';
      var result = utils.sanitizeName(inputValue);
      /*jshint -W030 */
      result.should.be.exactly('abc');
    });
    
    it('Should remove "inner" segment if it contains only numbers', function () {
      var inputValue = 'abc.123.def';
      var result = utils.sanitizeName(inputValue);
      /*jshint -W030 */
      result.should.be.exactly('abc.def');
    });

    it('Should remove last character if it is a dot', function () {
      var inputValue = 'abc.';
      var result = utils.sanitizeName(inputValue);
      /*jshint -W030 */
      result.should.be.exactly('abc');
    });
    
    it('Should retrieve default name if sanitization removes all characters', function () {
      var inputValue = '111.222.333';
      var result = utils.sanitizeName(inputValue);
      /*jshint -W030 */
      result.should.be.exactly('MyManifoldJSApp');
    });    
  });
});
