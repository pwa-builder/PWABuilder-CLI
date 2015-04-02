'use strict';

function checkParameters(argv) {
    var availablePlatforms = ['windows', 'ios', 'android'];
    
    if (argv._.length < 2) {
        throw 'Error: Missing required arguments.';
    }
    
    // Check platforms
    if (argv.p) {
        argv.p.split(',').forEach(function (platform) {
            if (availablePlatforms.indexOf(platform) < 0) {
                throw 'Error: Invalid platform(s) specified.';
            }
        });
    }
}

module.exports = {
    checkParameters: checkParameters
};