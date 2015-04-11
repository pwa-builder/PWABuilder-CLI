'use strict';

function parseJSON(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return undefined;
  }
}

// Extracted from: http://stackoverflow.com/questions/5999998/how-can-i-check-if-a-javascript-variable-is-function-type
function isFunction(data) {
  var getType = {};
  return data && getType.toString.call(data) === '[object Function]';
}

function isString(data) {
  return typeof data === 'string';
}

function capitalize(string) {
   return (isString(string) && string.length > 0 ? string.charAt(0).toUpperCase() + string.slice(1) : '');
}

module.exports = {
  parseJSON: parseJSON,
  isFunction: isFunction,
  isString: isString,
  capitalize: capitalize
};
