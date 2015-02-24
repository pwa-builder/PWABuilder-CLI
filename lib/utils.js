'use strict';

function parseJSON(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return undefined;
  }
}

module.exports = {
  parseJSON: parseJSON
};
