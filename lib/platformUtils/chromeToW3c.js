'use strict';

var utils = require('../common/utils');

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

    // Extract app urls
    var extractedUrls = chromeManifest.app.urls;
    if (chromeManifest.app.urls && Array.isArray(chromeManifest.app.urls)) {
        utils.removeDupesInPlace(extractedUrls, function (a, b) {
            return a === b;
        });        
    }
    
    if (extractedUrls) {
        w3cManifest.mjs_extended_scope = extractedUrls;
        if (chromeManifest.permissions) {
            w3cManifest.mjs_api_access = [];
            extractedUrls.forEach(function (url) {
                w3cManifest.mjs_api_access.push({ 'match': url, 'platform': 'chrome', 'access': chromeManifest.permissions });
            });              
        }
    }
        
    return w3cManifest;
}

module.exports = { 
    chromeToW3CManifest : chromeToW3CManifest
};
