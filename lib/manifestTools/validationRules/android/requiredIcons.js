'use strict';

module.exports = function (manifestContent) {
  return [{
    'description': 'Icon of size X is required',
    'platform': 'android',
    'level': 'warning',
    'key': 'icons'
    }, {
      'description': 'Icon of size Y is required',
      'platform': 'android',
      'level': 'warning',
      'key': 'icons'
    }];
};
