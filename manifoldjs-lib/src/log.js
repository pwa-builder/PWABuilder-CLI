'use strict';

var log = require('loglevel'),
		path = require('path');

var appPath = path.dirname(require.main.filename);
var app = require(path.join(appPath, 'package.json'));

var maxLenSeverity = 5;
var maxLenSource = 12;

var originalFactory = log.methodFactory;
log.methodFactory = function (methodName, logLevel, loggerName) {
	var rawMethod = originalFactory(methodName, logLevel, loggerName);

	return function (message, source, severity) {
		message = message.replace(/\n/g, '\n' + Array(maxLenSeverity + maxLenSource + 6).join(' '));
		source = source || loggerName || app.name;
		severity = severity || methodName;
		rawMethod(
			'[' + severity + Array(maxLenSeverity - severity.length + 1).join(' ') + '] '
			+ source + Array(maxLenSource - source.length + 1).join(' ') + ': '
			+ message);
	};
}

module.exports = log;
