'use strict';

var fs = require('fs');
var path = require('path');

var transformationsPath = path.join(__dirname, 'transformations');

var modules = {};

fs.readdirSync(transformationsPath).forEach(function(file) {
  var moduleName = path.basename(file, path.extname(file));
  modules[moduleName] = require('./transformations/' + file);
});

module.exports = modules;
