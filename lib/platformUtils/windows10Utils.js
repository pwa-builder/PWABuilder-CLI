'use strict';

var utils = require('../common/utils');

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
  var applicationContentUriRules = '';
  
  if (w3cManifest.scope && w3cManifest.scope.length && w3cManifest.scope !== '*') {
    applicationContentUriRules = '<uap:Rule Type="include" Match="' + w3cManifest.scope + '" />';
  }
  
  if (w3cManifest.mjs_urlAccess && w3cManifest.mjs_urlAccess.length) {
    for (var j = 0; j < w3cManifest.mjs_urlAccess.length; j++) {
      var accessUrl = w3cManifest.mjs_urlAccess[j];
      if (!accessUrl.external && accessUrl.url !== '*') {
        applicationContentUriRules += (applicationContentUriRules ? indentationChars : '') + '<uap:Rule Type="include" Match="' + accessUrl.url + '" />';
      }
    }
  }
  
  replacedContent = replacedContent.replace(/{ApplicationContentUriRules}/g, applicationContentUriRules);

  return replacedContent;
}

module.exports = {
  replaceManifestValues: replaceManifestValues
};