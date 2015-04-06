# Hosted Web Application Tool

This tool is used to create hosted web applications based on a [W3C Web App manifest](http://www.w3.org/TR/appmanifest/).

## Installation

````
npm install
````

## Usage

````
node appmyweb <website URL> [-d <app directory>] [-p <platforms>] [-l <log level>] [-b] [-m <manifest file>]
````

### Parameters

- *website URL* (required): URL of the hosted website
- *-d|--directory* (optional): Path to the generated project files (default value: the current directory)
- *-l|--loglevel* (optional): Tracing log level options Available log levels: debug,trace,info,warn,error (default value: warn)
- *-p|--platforms* (optional): Platforms to generate. Supported platforms: windows,android,ios,chrome (default value: all platforms)
- *-b|--build* (optional): Forces the building process
- *-m|--manifest* (optional): Location of the W3C Web App manifest file (URL or local path). If not specified, the tool looks for a manifest in the site URL. Otherwise, a new manifest will be created pointing to the site URL.

### Example

````
node appmyweb http://meteorite.azurewebsites.net -D:\Projects -l info -p windows,android -b
````

## Unit Tests

In the terminal, install the Grunt task runner:

````
npm install -g grunt-cli
````

In order to run tests and jshint, execute the following command:

````
grunt
````

## Supported Input Manifests

- [W3C Web App](http://www.w3.org/TR/appmanifest/)

We plan to support the following manifest files in the future:
- [Web App Template] (http://wat-docs.azurewebsites.net/JsonWindows)
- [Chrome Hosted Apps](https://developers.google.com/chrome/apps/docs/developers_guide)
- [Firefox Open Web Apps](https://developer.mozilla.org/Apps/Build/Manifest)


## change-log


## license
