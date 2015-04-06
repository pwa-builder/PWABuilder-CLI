# Manifest Tools

This tool is used for obtaining and converting manifest for different platforms.

## Installation

````
npm install
````

## Usage

````
node appmyweb <website URL> [-d <app directory>]  [-p <platforms>]  [-l <log level>]  [-b]  [-m <manifest file>]
````

### Parameters

- <website URL> (required): URL of the hosted website
- -d|--directory (optional): Path to the generated project files (default value: the current directory)
- -l|--loglevel (optional): Tracing log level options Available log levels: debug,trace,info,warn,error (default value: warn)
- -p|--platforms (optional): Platforms to generate. Supported platforms: windows,android,ios,chrome (default value: all platforms)
- -b|--build (optional): Forces the building process
- -m|--manifest (optional): Manifest location (URL or local path). If not specified, the tool looks for a manifest in the site URL. Otherwise, a new manifest will be created pointing to the site URL.

### Example

````
node appmyweb http://meteorite.azurewebsites.net -D:\Projects -l info -p windows,android -b
````

## Unit Tests

In the terminal, install grunt task runner

````
npm install -g grunt-cli
````

In order to run tests and jshint execute:

````
grunt
````

## Supported Platform Manifests

- [W3C](http://www.w3.org/TR/appmanifest/)
- [Web App Template] (http://wat-docs.azurewebsites.net/JsonWindows)
- [Chrome Hosted Apps](https://developers.google.com/chrome/apps/docs/developers_guide)
- [Firefox Open Web Apps](https://developer.mozilla.org/Apps/Build/Manifest)


## change-log


## license
