'use strict';

var url = require('url'),
		path = require('path'),
		Q = require('q');

var fileTools = require('./fileTools'),
		download = require('./download'),
		log = require('./log');

function getIcon(iconPath, startUrl, baseDir, callback) {

	var iconUrl = url.resolve(startUrl, iconPath);
	var iconFilePath = path.join(baseDir, iconPath);
	var iconFolder = path.dirname(iconFilePath);

	log.debug('Downloading icon file from [' + iconUrl + '] to [' + iconFilePath + ']');
	return fileTools.mkdirp(iconFolder)
		.then(function () {
			return download(iconUrl, iconFilePath)
				.then(function () {
					return Q.resolve(iconFilePath);
				})
		})
		.nodeify(callback);
}

function copyDefaultIcon(manifest, platformId, iconSize, source, targetPath, callback) {
	
	// platform already contains an icon with this size - skip
	if (manifest.icons && manifest.icons[iconSize]) {
		return Q.resolve().nodeify(callback);
	}

	log.info('Copying the default icon for the \'' + platformId + '\' platform...');

	var iconFilename = path.basename(source);
	var target = path.join(targetPath, iconFilename);

	return fileTools.copyFile(source, target)
		.then(function () {
			manifest.icons = manifest.icons || {};
			manifest.icons[iconSize] = iconFilename;
			return Q.resolve(targetPath);
		})
		.nodeify(callback);
}

module.exports = {
	getIcon: getIcon,
	copyDefaultIcon: copyDefaultIcon
};
