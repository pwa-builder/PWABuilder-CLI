/**
 * the top-level API for `manifoldjs`. provides access to the key libraries in
 * manifoldjs so you can write your own tools using `manifoldjs` as a library.
 *
 * Usage
 * -----
 *
 *      var manifoldjs = require('manifoldjs');
 *
 */

module.exports = {
  manifestTools: require('./lib/manifestTools'),
  validationConstants : require('./lib/manifestTools/validationConstants'),
  projectBuilder: require('./lib/projectBuilder'),
  projectTools: require('./lib/projectTools.js')
};
