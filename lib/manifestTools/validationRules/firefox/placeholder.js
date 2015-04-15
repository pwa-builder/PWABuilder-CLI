'use strict';

module.exports = function (manifestContent, callback) {
  return callback();

  //  returning a single result (example: issues with icons):
  //--------------------------------
  // return callback(undefined, {
  //   'description': 'You may want to add the X icon',
  //   'platform': 'android',
  //   'level': 'suggestion',
  //   'key': 'icons'
  // });

  //  returning multiple results (example: issues with icons):
  //--------------------------------
  // return callback(undefined, [{
  //   'description': 'You may want to add the X icon',
  //   'platform': 'android',
  //   'level': 'suggestion',
  //   'key': 'icons'
  // },
  // {
  //   'description': 'An issue with the icons format',
  //   'platform': 'android',
  //   'level': 'error',
  //   'key': 'icons'
  // }]);
};
