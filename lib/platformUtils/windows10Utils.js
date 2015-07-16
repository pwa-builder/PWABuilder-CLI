'use strict';

var utils = require('../common/utils');
var url = require('url');
var version = require('../common/version');

function replaceManifestValues(w3cManifest, content) {
  var replacedContent = content;
  var guid = utils.newGuid();
  
  var applicationId = utils.sanitizeName(w3cManifest.short_name);

  // Update general properties
  replacedContent = replacedContent.replace(/{IdentityName}/g, guid)
                                    .replace(/{PhoneProductId}/g, guid)
                                    .replace(/{DisplayName}/g, w3cManifest.short_name)
                                    .replace(/{ApplicationId}/g, applicationId)
                                    .replace(/{StartPage}/g, w3cManifest.start_url)
                                    .replace(/{DisplayName}/g, w3cManifest.short_name)
                                    .replace(/{Description}/g, w3cManifest.name || w3cManifest.short_name)
                                    .replace(/{RotationPreference}/g, w3cManifest.orientation || 'portrait')
                                    .replace(/{ManifoldJSVersion}/g, version.getCurrentPackageVersion());

  // Update access rules
  var indentationChars = '\r\n\t\t\t\t';

  // Set the base access rule using the start_url's base url
  var baseUrlPattern = url.resolve(w3cManifest.start_url, '/');
  if (w3cManifest.scope && w3cManifest.scope.length) {
    // If the scope is defined, the base access rule is defined by the scope
    var parsedScopeUrl = url.parse(w3cManifest.scope);

    if (parsedScopeUrl.host && parsedScopeUrl.protocol) {
      baseUrlPattern = w3cManifest.scope;
    } else {
      baseUrlPattern = url.resolve(baseUrlPattern, w3cManifest.scope); 
    }
  }
  
  // If the base access rule ends with '/*', remove the '*'.
  if (baseUrlPattern.indexOf('/*', baseUrlPattern.length - 2) !== -1) {
    baseUrlPattern = baseUrlPattern.substring(0, baseUrlPattern.length - 1);
  }

  var applicationContentUriRules = '<uap:Rule Type="include" Match="' + baseUrlPattern + '" />';

  // Add additional access rules
  if (w3cManifest.mjs_access_whitelist && w3cManifest.mjs_access_whitelist instanceof Array) {    
    for (var j = 0; j < w3cManifest.mjs_access_whitelist.length; j++) {
      var accessUrl = w3cManifest.mjs_access_whitelist[j].url;
      // Ignore the '*' rule 
      if (accessUrl !== '*') {        
        // If the access url ends with '/*', remove the '*'.
        if (accessUrl.indexOf('/*', accessUrl.length - 2) !== -1) {
          accessUrl = accessUrl.substring(0, accessUrl.length - 1);
        }
        
        if (accessUrl.indexOf(baseUrlPattern) !== 0) { // To avoid duplicates, add the rule only if it does not have the base URL as a prefix
          applicationContentUriRules += indentationChars + '<uap:Rule Type="include" Match="' + accessUrl + '" />';
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
