'use strict';

var utils = require('../common/utils');
var url = require('url');

function replaceManifestValues(w3cManifest, content) {
  var replacedContent = content;
  var guid = utils.newGuid();

  // Update general properties
  replacedContent = replacedContent.replace(/{IdentityName}/g, guid)
                                    .replace(/{PhoneProductId}/g, guid)
                                    .replace(/{DisplayName}/g, w3cManifest.short_name)
                                    .replace(/{ApplicationId}/g, w3cManifest.short_name)
                                    .replace(/{StartPage}/g, w3cManifest.start_url)
                                    .replace(/{DisplayName}/g, w3cManifest.short_name)
                                    .replace(/{Description}/g, w3cManifest.name || w3cManifest.short_name)
                                    .replace(/{RotationPreference}/g, w3cManifest.orientation || 'portrait');

  // Update access rules
  var indentationChars = '\r\n\t\t\t\t';

  // Add base access rule based on the start_url and the scope
  var baseUrlPattern = w3cManifest.start_url;
  if (w3cManifest.scope && w3cManifest.scope.length) {
      baseUrlPattern = url.resolve(baseUrlPattern, w3cManifest.scope);
  }
  
  baseUrlPattern = url.resolve(baseUrlPattern, '*');

  var applicationContentUriRules = '<uap:Rule Type="include" Match="' + baseUrlPattern + '" />';

  // add additional access rules
  if (w3cManifest.mjs_urlAccess && w3cManifest.mjs_urlAccess instanceof Array) {
    var baseUrl = baseUrlPattern.substring(0, baseUrlPattern.length - 1);
    
    for (var j = 0; j < w3cManifest.mjs_urlAccess.length; j++) {
      var accessUrl = w3cManifest.mjs_urlAccess[j];
      if (accessUrl.url !== '*') {
        if (accessUrl.url.indexOf(baseUrl) !== 0) { // To avoid duplicates, add the rule only if it does not have the base URL as a prefix
          applicationContentUriRules += indentationChars + '<uap:Rule Type="include" Match="' + accessUrl.url + '" />';
        }
      }
    }
  }

  replacedContent = replacedContent.replace(/{ApplicationContentUriRules}/g, applicationContentUriRules);

  return replacedContent;
}

module.exports = {
  replaceManifestValues: replaceManifestValues
};
