'use strict';

var utils = require('./utils');

function convertWithMatrix(originalObj, transformationsMatrix, initialObj) {
  var resultObj = initialObj || {};
  var transformation;

  for(var prop in originalObj) {
    transformation = transformationsMatrix[prop];
    if (transformation) {
      if (utils.isFunction(transformation)){
        resultObj = transformation(originalObj, resultObj);
      } else {
        resultObj[transformation] = originalObj[prop];
      }
    }
  }

  return resultObj;
}

module.exports = {
  convertWithMatrix: convertWithMatrix,
  baseManifestFormat : 'w3c'
};
