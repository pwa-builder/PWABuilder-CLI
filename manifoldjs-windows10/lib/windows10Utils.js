'use strict';

var url = require('url');

var manifoldjsLib = require('manifoldjs-lib');
     
var utils = manifoldjsLib.utils,
    packageTools = manifoldjsLib.packageTools;

var metadataItemTemplate = '\r\n\t\t<build:Item Name ="{0}" Version ="{1}" />';

var baseAcurMatch;

function findRuleByMatch(acurList, match) {
  for (var i = 0; i < acurList.length; i++) {
    if (acurList[i].match === match) {
      return acurList[i];
    }
  }
}

function tryAddAcurToList(acurList, acur) {
  // if match is '*', replace match with base match
  if (acur.match === '*') {
    acur.match = baseAcurMatch;
  }
  
  // if the match url ends with '/*', remove the '*'.
  if (acur.match.indexOf('/*', acur.match.length - 2) !== -1) {
    acur.match = acur.match.substring(0, acur.match.length - 1);
  }
  
  // ensure rule is not duplicated
  var rule = findRuleByMatch(acurList, acur.match);
  if (!rule) {
    // if no type is specified in rule and access is 'none', ignore the rule
    if (!acur.type && acur.runtimeAccess === 'none') {
      return;
    }
    
    rule = { match: acur.match };
    acurList.push(rule);
  }
  
  // override the runtimeAccess property (if any) or use default value ('none')
  rule.runtimeAccess = acur.runtimeAccess || rule.runtimeAccess || 'none';
  
  // override the type (if any) or use default value ('include')
  rule.type = acur.type || rule.type || 'include';
}

function replaceManifestValues(w3cManifestInfo, content) {
  var w3cManifest = w3cManifestInfo.content;
  var timestamp = w3cManifestInfo.timestamp || new Date().toISOString().replace(/T/, ' ').replace(/\.[0-9]+/, ' ');
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
                                    .replace(/{ManifoldJSVersion}/g, packageTools.getCurrentPackageVersion())
                                    .replace(/{GeneratedFrom}/g, w3cManifestInfo.generatedFrom || 'API')
                                    .replace(/{GenerationDate}/g, timestamp)
                                    .replace(/{theme_color}/g, w3cManifest.theme_color || 'blue');

  // Add additional metadata items
  var metadataItems = '';
  if (w3cManifestInfo.generatedUrl) {
    metadataItems += metadataItemTemplate.replace(/\{0}/g, 'GeneratedURL')
                                         .replace(/\{1}/g, w3cManifestInfo.generatedUrl);
  }
  
  replacedContent = replacedContent.replace(/{MetadataItems}/g, metadataItems);
  
  // Update ACURs
  var indentationChars = '\r\n\t\t\t\t';
  var applicationContentUriRules = '';
  var acurList = [];

  // Set the base acur rule using the start_url's base url
  baseAcurMatch = url.resolve(w3cManifest.start_url, '/');
  if (w3cManifest.scope && w3cManifest.scope.length) {
    // If the scope is defined, the base access rule is defined by the scope
    var parsedScopeUrl = url.parse(w3cManifest.scope);

    if (parsedScopeUrl.host && parsedScopeUrl.protocol) {
      baseAcurMatch = w3cManifest.scope;
    } else {
      baseAcurMatch = url.resolve(baseAcurMatch, w3cManifest.scope); 
    }
  }
  
  // Add base rule to ACUR list
  tryAddAcurToList(acurList, { 'match': baseAcurMatch, 'type': 'include' });

  // Add rules from mjs_access_whitelist to ACUR list
  // TODO: mjs_access_whitelist is deprecated. Should be removed in future versions
  if (w3cManifest.mjs_access_whitelist) {
    w3cManifest.mjs_access_whitelist.forEach(function(whitelistRule) {
      tryAddAcurToList(acurList, { 'match': whitelistRule.url, 'type': 'include', 'runtimeAccess': whitelistRule.apiAccess });
    });
  }
  
  // Add rules from mjs_extended_scope to ACUR list
  if (w3cManifest.mjs_extended_scope) {
    w3cManifest.mjs_extended_scope.forEach(function(scopeRule) {
      tryAddAcurToList(acurList, { 'match': scopeRule, 'type': 'include' });
    });
  }
  
  // Add rules from mjs_api_access to ACUR list
  if (w3cManifest.mjs_api_access) {
    w3cManifest.mjs_api_access.forEach(function (apiRule) {
      // ensure rule applies to current platform
      if (apiRule.platform && apiRule.platform.split(',')
           .map(function (item) { return item.trim(); })
           .indexOf('windows10') < 0) {
                return false;
      }   
      
      tryAddAcurToList(acurList, { match: apiRule.match, runtimeAccess: apiRule.access || 'all' });
    });
  } 

  // Create XML entries for ACUR rules
  acurList.forEach(function (acur) {
    applicationContentUriRules += indentationChars + '<uap:Rule Type="' + acur.type + '" WindowsRuntimeAccess="' + acur.runtimeAccess + '" Match="' + acur.match + '" />';
  });

  replacedContent = replacedContent.replace(/{ApplicationContentUriRules}/g, applicationContentUriRules);

  return replacedContent;
}

module.exports = {
  replaceManifestValues: replaceManifestValues
};
