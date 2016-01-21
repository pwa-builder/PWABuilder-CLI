'use strict';

var lib = require('manifoldjs-lib');

var log = lib.log;

function run() {
  log.warn('The \'visualstudio\' command is deprecated. Use \'manifoldjs open <windows|windows10>\' instead.')
}

module.exports = run;