'use strict';

var utils = require('../utils');

function chromeToW3CManifest(chromeManifest) {
    var w3cManifest = {
        start_url: chromeManifest.app.launch.web_url,
        icons: []
    };
    
    if (chromeManifest.default_locale) {
        w3cManifest.lang = chromeManifest.default_locale;
    }
    
    if (chromeManifest.name) {
        w3cManifest.name = chromeManifest.name;
    }

    if (chromeManifest.short_name) {
        w3cManifest.name = chromeManifest.short_name;
    }
    
    // Extract icons
    for (var size in chromeManifest.icons) {
        w3cManifest.icons.push({
            sizes: size + 'x' + size,
            src: chromeManifest.icons[size]
        });
    }

    // Extract app URLs
    var appUrls = chromeManifest.app.urls;
    if (appUrls && Array.isArray(appUrls)) {
        appUrls = utils.removeDupesInPlace(appUrls, function (a, b) {
            return a === b;
        }).map(function (url) {
            return url.trim().replace(/\/$/, '/*');
        });        
    }
    
    if (appUrls) {
        w3cManifest.mjs_extended_scope = appUrls;
    }
    
    if (chromeManifest.permissions) {
        var allPermissions = chromeManifest.permissions.join(', ');
        w3cManifest.mjs_api_access = [{ 'match': chromeManifest.app.launch.web_url.replace(/\/$/, '/*'), 'platform': 'chrome', 'access': allPermissions }];
        
        if (appUrls && Array.isArray(appUrls)) {
            appUrls.forEach(function (url) {
                w3cManifest.mjs_api_access.push({ 'match': url, 'platform': 'chrome', 'access': allPermissions });
            });
        } 
    }
        
    return w3cManifest;
}

module.exports = { 
    chromeToW3CManifest : chromeToW3CManifest
};
