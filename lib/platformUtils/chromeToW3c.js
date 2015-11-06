'use strict';

var utils = require('../common/utils');

function chromeToW3CManifest(chromeManifest) {
    var w3cManifest = {
        lang: chromeManifest.lang || 'en-us',
        name: chromeManifest.name,
        short_name: chromeManifest.short_name || chromeManifest.name,
        icons: [],
        splash_screens: chromeManifest.splash_screens || [],
        scope: chromeManifest.scope || '',
        start_url: chromeManifest.app.launch.web_url,
        display: chromeManifest.display || '',
        orientation: chromeManifest.orientation || 'portrait',
        theme_color: chromeManifest.theme_color || 'aliceBlue',
        background_color: chromeManifest.background_color || 'gray'
    };
    
    // Extract icons
    for (var size in chromeManifest.icons) {
        w3cManifest.icons.push({
            sizes: size + 'x' + size,
            src: chromeManifest.icons[size]
        });
    }
    
    // Extract app urls
    if (chromeManifest.app.urls) {
        var extractedUrls = [];
        var urls = chromeManifest.app.urls;
        for (var i = 0; i < urls.length; i++) {
            var url = urls[i];
            if (url.indexOf('*://') === 0) {
                // Url starts with '*://', expand this to both 'http://' and 'https://'
                extractedUrls.push({ url: 'http' + url.substr(1), apiAccess: 'none' });
                extractedUrls.push({ url: 'https' + url.substr(1), apiAccess: 'none' });
            }
            else {
                extractedUrls.push({ url: url, apiAccess: 'none' });
            }
        }
        utils.removeDupesInPlace(extractedUrls, function (a, b) {
            return a.url === b.url;
        });
        w3cManifest.mjs_access_whitelist = (w3cManifest.mjs_access_whitelist || []).concat(extractedUrls);
    }
    
    // Copy any remaining string properties from the Chrome manifest
    for (var prop in chromeManifest) {
        var val = w3cManifest[prop];
        if (!val && (typeof val === 'string')) {
            console.log('Additional property ingested:  ' + prop + ':' + val);
            w3cManifest[prop] = val;
        }
    }
    return w3cManifest;
}

module.exports = { 
    chromeToW3CManifest : chromeToW3CManifest
};
