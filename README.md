
# ManifoldJS

This tool is used to create hosted web applications based on a [W3C Web App manifest](http://www.w3.org/TR/appmanifest/).

## Installation

````
npm install -g ManifoldJS
````

## Usage

````
manifoldjs <website-url> [-d <app-directory>] [-s <short-name>] [-p <platforms>] [-l <log-level>] [-b] [-m <manifest-file>]
````

### Parameters

|  **&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Parameter&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;** | **Description** |
| ---------------- | --------------- |
| `<website-url>`  | **(required)** URL of the hosted website |
| `-m|--manifest`  | **(optional)** Location of the W3C Web App manifest file (URL or local path). If not specified, the tool looks for a manifest in the site URL. Otherwise, a new manifest will be created pointing to the site URL. |
| `-d|--directory` | **(optional)** Path to the generated project files (default value: current directory) |
| `-s|--shortname` | **(optional)** Application short name. When specified, it overrides the short_name value of the manifest |
| `-l|--loglevel`  | **(optional)** Tracing log level options Available log levels: _debug,trace,info,warn,error_ (default value: _warn_) |
| `-p|--platforms` | **(optional)** Platforms to generate. Supported platforms: _windows,android,ios,chrome_ (default value: all platforms) |
| `-b|--build`     | **(optional)** Forces the building process |

### Example

````
manifoldjs http://meteorite.azurewebsites.net -d C:\Projects -l info -p windows10,android -b
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

> ManifoldJS

> Copyright (c) Microsoft Corporation

> All rights reserved.

> MIT License

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the ""Software""), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

> THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

