'use strict';

function parseJSON(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return undefined;
  }
}

// Extracted from: http://stackoverflow.com/questions/5999998/how-can-i-check-if-a-javascript-variable-is-function-type
function isFunction(functionToCheck) {
  var getType = {};
  return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

module.exports = {
  parseJSON: parseJSON,
  isFunction: isFunction
};
