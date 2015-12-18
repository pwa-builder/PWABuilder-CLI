'use strict';

var fs = require('fs'),
    path = require('path'),
    tv4 = require('tv4');

var validationConstants = require('../../constants').validation,
    utils = require('../../utils');
    
tv4.addFormat('uri', function (data) {
  if (!utils.isURL(data)) {
    return '\'' + data + '\' is not a valid URL.';
  }
  return null;
});

var errorCodeLookup = {};
for (var key in tv4.errorCodes) {
  errorCodeLookup[tv4.errorCodes[key]] = key.toLowerCase();
}

module.exports = function (manifestContent, callback) {
  var schemaFile = path.resolve(__dirname, '..', 'assets', 'web-manifest.json');
  var schema = JSON.parse(fs.readFileSync(schemaFile).toString());
  
  var extendedSchemaFile = path.resolve(__dirname, '..', 'assets', 'web-manifest-extended.json');
  var extendedSchema = JSON.parse(fs.readFileSync(extendedSchemaFile).toString());
  
  // merge the extended schema with the standard schema 
  for (var property in extendedSchema.properties) { schema.properties[property] = extendedSchema.properties[property]; }
  for (var definition in extendedSchema.definitions) { schema.definitions[definition] = extendedSchema.definitions[definition]; }
  
  var schemaValidation = tv4.validateMultiple(manifestContent, schema, true, true);
  var validationResults = [];
  schemaValidation.errors.forEach(function (err) {
    var message = err.message;
    if (err.subErrors) {
      message = err.subErrors.reduce(function (previous, current) {
        return previous.message + (previous ? ' ' : '') + current.message + '.';
      });
    }
      
    var member = err.dataPath.split('/').pop();
    if (err.code !== tv4.errorCodes.UNKNOWN_PROPERTY || (member && member.indexOf('_') < 0)) {
      validationResults.push({
        'description': message,
        'platform': validationConstants.platforms.all,
        'level': (err.code === tv4.errorCodes.UNKNOWN_PROPERTY) ? validationConstants.levels.warning : validationConstants.levels.error,
        'member': err.dataPath,
        'code': 'w3c-schema-' + errorCodeLookup[err.code]
      });
    }
  });
  
  return callback(undefined, validationResults);
};
