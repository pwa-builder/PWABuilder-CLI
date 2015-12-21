'use strict';

var validationConstants = {
  levels: {
    error: 'error',
    warning: 'warning',
    suggestion: 'suggestion'
  },
  codes: {
    requiredValue: 'required-value',
    invalidValue: 'invalid-value',
    missingImageGroup: 'missing-image-group',
    missingImage: 'missing-image',
    missingImageOnsite: 'missing-image-onsite',
    requiredAbsoluteUrl: 'requiredAbsoluteUrl',
    deprecatedMember: 'deprecatedMember'
  },
  manifestMembers: {
    lang: 'lang',
    name: 'name',
    short_name: 'short_name',
    scope: 'scope',
    icons: 'icons',
    display: 'display',
    orientation: 'orientation',
    start_url: 'start_url',
    theme_color: 'theme_color',
    related_applications: 'related_applications',
    prefer_related_applications: 'prefer_related_applications',
    mjs_access_whitelist: 'mjs_access_whitelist',
    mjs_api_access: 'mjs_api_acces',
    mjs_extended_scope: 'mjs_extended_scope'
  },
  platforms: {
    all: 'general'
  }
};

module.exports = {
  BASE_MANIFEST_FORMAT: 'w3c',
  validation: validationConstants
};
