'use strict';

function platformsValid(platforms) {
    var availablePlatforms = ['windows', 'ios', 'android'];
    
    for (var i = 0; i < platforms.length; i++) {     
        if (availablePlatforms.indexOf(platforms[i]) < 0) {
            return false;
        }
    }

    return true;
}

module.exports = {
    platformsValid: platformsValid
};