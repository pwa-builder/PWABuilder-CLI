'use strict';

module.exports = function (manifestContent, callback) {
  return callback(undefined, {
    'description': 'You may want to add an icon of size Z',
    'platform': 'android',
    'level': 'suggestion',
    'key': 'icons'
  });
};
