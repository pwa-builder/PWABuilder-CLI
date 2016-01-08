'use strict';

var fs = require('fs'),
    path = require('path'),
    url = require('url');

var Q = require('q');

var manifoldjsLib = require('manifoldjs-lib');

var PlatformBase = manifoldjsLib.PlatformBase,
    manifestTools = manifoldjsLib.manifestTools,
    CustomError = manifoldjsLib.CustomError,
    utils = manifoldjsLib.utils,
    processTools = manifoldjsLib.processTools,
    fileTools = manifoldjsLib.fileTools,
    exec = processTools.exec;

var constants = require('./constants');
  
function Platform (packageName, platforms) {

  var self = this;
  Object.assign(this, PlatformBase.prototype);
  PlatformBase.apply(this, [constants.platform.id, constants.platform.name, packageName, __dirname]);
  
  // save platform list
  self.platforms = platforms;

  // returns the path to the cordova shell command
  var cachedCordovaPath;
  function getCordovaPath () {
    if (!cachedCordovaPath) {
      // npm command in Windows is a batch file and needs to include extension to be resolved by spawn call
      var cordova = (process.platform === 'win32' ? 'cordova.cmd' : 'cordova');
      return processTools.getCommandPath(__dirname, cordova)
            .then(function (commandPath) {
              cachedCordovaPath = commandPath;
              if (!commandPath) {
                return Q.reject('Failed to locate the Cordova shell command: \'' + cordova + '\'.');
              }
              
              return cachedCordovaPath = commandPath;
            });
    }
    
    return Q.resolve(cachedCordovaPath);
  }

  // ID or URL of the Hosted Web App plugin - THIS SETTING WILL NEED TO BE UPDATED IF THE PLUGIN IS RELOCATED
  // TODO: make this overridable via environment variable
  var pluginIdOrUrl = 'cordova-plugin-hostedwebapp@>=0.2.0 <0.3.0';
  
  function createApp (rootDir, appName, packageName, cordovaAppName, callback) {
    self.info('Creating the Cordova project...');    
    return getCordovaPath().then(function (cordovaPath) {
            return exec(cordovaPath, ['create', appName, packageName, cordovaAppName], { cwd: rootDir });
          })
          .catch(function (err) {
            return Q.reject(new CustomError('Failed to create the base application.', err));          
          })
          .nodeify(callback);
  }
  
  function addPlatforms (rootDir, platforms, callback) {
    var allPlatforms = platforms.join(' ');
    self.info('Adding the following Cordova platforms: ' + allPlatforms + '...');
    return getCordovaPath().then(function (cordovaPath) {
            return exec(cordovaPath, ['platform', 'add'].concat(platforms), { cwd: rootDir });
          })
          .catch(function (err) {
            return Q.reject(new CustomError('Failed to add the Cordova platforms: ' + allPlatforms + '.', err));
          })
          .nodeify(callback);
  }
  
  function addPlugins (rootDir, options, callback) {
    var pluginList = [pluginIdOrUrl];
    if (options.crosswalk) {
      pluginList.push('cordova-plugin-crosswalk-webview');
    }
  
    if (options.webAppToolkit) {
      pluginList.push('cordova-plugin-webapptoolkit');
      self.warn('\n*******************************************************************************');
      self.warn('The WAT plugin requires you to perform manual steps before running the app');
      self.warn('Follow the steps described here: https://github.com/manifoldjs/Web-App-ToolKit');
      self.warn('*******************************************************************************\n');
    }
  
    // Fixes an issue in Cordova that requires a version of cordova-ios that is not released yet
    // and stops automated plugin installations - see https://issues.apache.org/jira/browse/CB-9232
    // and https://issues.apache.org/jira/browse/CB-916) - Needs to be removed once a fix is released!!!!
    pluginList.push('cordova-plugin-whitelist@1.0.0');
  
    var allPlugins = pluginList.join(' ');
    self.info('Adding the following plugins to the Cordova project: ' + allPlugins + '...');
    
    return getCordovaPath().then(function (cordovaPath) {
            return exec(cordovaPath, ['plugin', 'add'].concat(pluginList), { cwd: rootDir });
          })
          .catch(function (err) {
            return Q.reject(new CustomError('Failed to add one or more plugins.', err));
          })
          .nodeify(callback);
  }

  function processPlatforms (rootDir, platformDir, platforms) {
    
    return Q.allSettled(platforms.map(function (platform) {
      self.info('Processing the \'' + platform + '\' Cordova platform...');

      var cordovaPlatformPath = path.join(platformDir, 'platforms', platform);

      // copy the documentation file
      return self.copyDocumentation(cordovaPlatformPath, platform)
        // create top-level platform shortcut
        .then(function () {
          // don't create a shortcut for the Windows platform
          if (platform.toUpperCase() !== 'WINDOWS') {
            self.info('Creating a shortcut for the \'' + platform + '\' Cordova platform...');
            var srcpath = path.resolve(platformDir, 'platforms', platform);
            var dstpath = path.resolve(rootDir, platform);
            return fileTools.createShortcut(srcpath, dstpath);
          }
        })
        // create generation info
        .then(function () {          
          return self.createGenerationInfo(cordovaPlatformPath);
        });
    }));
  }

  // override create function
  self.create = function (w3cManifestInfo, rootDir, options, callback) {

    var allPlatforms = self.platforms.map(function (platformId) {
      return constants.platform.subPlatforms[platformId].name;      
    }).join(', ');
    
    self.info('Generating the ' + allPlatforms + ' app(s)...');
    
    var platformDir = path.join(rootDir, constants.platform.id);
    
    // generate a reverse-domain-style package name from the manifest's start_url
    var packageName = '';
    url.parse(w3cManifestInfo.content.start_url)
              .hostname
              .replace(/-/g, '')
              .split('.')
              .map(function (segment) {
                // BUG:  Issue 149 aparently "in" is a reserved word for android package names
                if(segment === 'in') { 
                  segment = segment.replace('in', 'ind');
                }
                
                packageName = segment + (packageName ? '.' : '') + packageName;
              });
  
    var cordovaAppName = utils.sanitizeName(w3cManifestInfo.content.short_name);
    packageName = utils.sanitizeName(packageName);
  
    // create the base Cordova app
    return createApp(rootDir, constants.platform.id, packageName, cordovaAppName)
            // persist the manifest
            .then(function () {
              self.info('Copying the ' + constants.platform.name + ' manifest to the app folder...');        
              var manifestFilePath = path.join(platformDir, 'manifest.json');
              return manifestTools.writeToFile(w3cManifestInfo, manifestFilePath);
            })            
            // add the plugins
            .then (function () {
              return addPlugins(platformDir, options);              
            })
            // add the platforms
            .then (function () {
              return addPlatforms(platformDir, self.platforms);
            })
            // process individual platforms
            .then (function () {
              return processPlatforms(rootDir, platformDir, self.platforms);
            })
            .then(function () {
              self.info('Created the ' + constants.platform.displayName + ' app!');        
            })
            .catch(function (err) {
              return Q.reject(new CustomError('The ' + constants.platform.name + ' app could not be created successfully.', err));        
            })
            .nodeify(callback);            
  };
}

module.exports = Platform;
