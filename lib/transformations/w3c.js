'use strict';


function convertToBase (manifestInfo, callback) {
  return callback(undefined, manifestInfo);
}

function convertFromBase (manifestInfo, callback) {
  return callback(undefined, manifestInfo);
}

function matchFormat (manifestInfo, callback) {
  if (!manifestInfo || !manifestInfo.content) {
    return callback(new Error('Manifest content is empty or not initialized.'));
  }

  return callback(undefined, false);
}

module.exports = {
  convertToBase: convertToBase,
  convertFromBase: convertFromBase,
  matchFormat: matchFormat
};
