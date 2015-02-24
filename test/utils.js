'use strict';

var utils = require('../lib/utils');
var should = require('should');

describe('utils', function () {
  describe('parseJSON()', function () {
    it('Return the parsed JSON.', function() {
      var inputJSON = '{"key": "value", "number": 42 }';
      var result = utils.parseJSON(inputJSON);
      should.exist(result);
      result.should.have.property('key', 'value');
      result.should.have.property('number', 42);
    });

    it('undefined should return undefined.', function() {
      var result = utils.parseJSON(undefined);
      should.not.exist(result);
    });

    it('String should return undefined.', function() {
      var result = utils.parseJSON('this is a string');
      should.not.exist(result);
    });
  });
});
