#!/usr/bin/env node

'use strict';

var meow = require('meow');
var converter = require('./lib/converter');

// TODO: List supported input/output formats
var cli = meow({
  help: [
    'Usage',
    '  manifest-tools <inputManifestFile> <outputManifestFile> --inputFormat <inputManifestFormat> --outputFormat <outputManifesetFormat>',
    '',
    'Example',
    '  manifest-tools manifest.json convertedManifest.json --inputFormat W3C --outputFormat WAT'
  ].join('\n')
});

var inputFile = cli.flags.inputManifest || cli.input[0];
var outputFile = cli.flags.outputManifest || cli.input[1];

var manifestConverter = converter(cli.flags.inputFormat, cli.flags.outputFormat);
manifestConverter.convert(inputFile, outputFile,
  function (err) {
    if (err) {
      console.error(err.message);
      process.exit(1);
    }

    process.exit(0);
  });
