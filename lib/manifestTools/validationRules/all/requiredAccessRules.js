'use strict';

module.exports = function (manifestContent, callback) {
  var hap_urlAccess = manifestContent.hap_urlAccess;
  if (!hap_urlAccess || !(hap_urlAccess instanceof Array) || hap_urlAccess.length === 0) {
    return callback(undefined, {
      'description': 'It is recommended to specify a set of access rules that represent the navigation scope of the application',
      'platform': 'general',
      'level': 'suggestion',
      'member': 'hap_urlAccess',
      'code': 'required-value'
    });
  }
  
  callback();
};
