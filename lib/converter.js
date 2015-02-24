'use strict';

var fs = require('fs');

module.exports = ManifestConverter;

var validateJSON = function (data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

var validFormats = [
  'W3C',
  'WAT',
  'FirefoxOS',
  'ChromeOS',
];

function ManifestConverter (inputFormat, outputFormat) {
  if (!(this instanceof ManifestConverter)) {
    return new ManifestConverter(inputFormat, outputFormat);
  }

  // TODO: autodetect?
  this.inputFormat = inputFormat || 'W3C';
  this.outputFormat = outputFormat || 'W3C';

  if (validFormats.indexOf(this.inputFormat) === -1) {
    throw new Error('Invalid input format');
  }

  if (validFormats.indexOf(this.outputFormat) === -1) {
    throw new Error('Invalid output format');
  }
}

ManifestConverter.prototype.convert = function (inputFile, outputFile, callback) {
  if (!inputFile) {
    return callback(new Error('input file is required.'));
  }

  fs.readFile(inputFile, 'utf8', function (err, raw) {
    if (err) {
      return callback(err);
    }

    var data = validateJSON(raw);
    if (!data) {
      return callback(new Error('Invalid json file, please provide a valid json file as input file.'));
    }

    // TODO: Convert Manifest and return converted data
    var convertedData = data;

    return callback(null, convertedData);
  });
};
