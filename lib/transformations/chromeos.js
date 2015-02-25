'use strict';

var transformationUtils = require('../transformation-utils');

function convertToBase (manifestInfo, callback) {
  if (!manifestInfo || !manifestInfo.content) {
    return callback(new Error('Manifest content is empty or not initialized.'));
  }

  //TODO implement this method

  transformationUtils.convertWithMatrix(manifestInfo.content, {});
  manifestInfo.format = transformationUtils.baseManifestFormat;

  return callback(undefined, manifestInfo);
}

function convertFromBase (manifestInfo, callback) {
  if (!manifestInfo || !manifestInfo.content) {
    return callback(new Error('Manifest content is empty or not initialized.'));
  }

  //TODO implement this method

  transformationUtils.convertWithMatrix(manifestInfo.content, {});
  manifestInfo.format = transformationUtils.baseManifestFormat;
}

function matchFormat () {
  //TODO implement this method

  return false;
}


module.exports = {
  convertToBase: convertToBase,
  convertFromBase: convertFromBase,
  matchFormat: matchFormat
};
