var os = require('os'),
    url = require('url'),
    fs = require('fs'),
    path = require('path'),
    request = require('request'),
    archiver = require('archiver'),
    cloudappx = require('cloudappx-server'),
    log = require('loglevel');

var serviceEndpoint = 'http://cloudappx.azurewebsites.net';

// Quick sanity check to ensure that the placeholder parameters in the manifest 
// have been replaced by the user with their publisher details before generating 
// a package. 
function validateManifestPublisherDetails(appFolder, callback) {
  var manifestPath = path.join(appFolder, 'appxmanifest.xml');
  fs.readFile(manifestPath, 'utf8', function (err, data) {
    if (err) {
      err = new Error('The specified path does not contain a valid app manifest file - ' + err.message);
    }

    if (!err) {
      var packageIdentityPlaceholders = /<Identity.*(Name\s*=\s*"INSERT-YOUR-PACKAGE-IDENTITY-NAME-HERE"|Publisher\s*=\s*"CN=INSERT-YOUR-PACKAGE-IDENTITY-PUBLISHER-HERE")/g;
      var publisherDisplayNamePlaceholder = /<PublisherDisplayName>\s*INSERT-YOUR-PACKAGE-PROPERTIES-PUBLISHERDISPLAYNAME-HERE\s*<\/PublisherDisplayName>/g;
      if (packageIdentityPlaceholders.test(data) || publisherDisplayNamePlaceholder.test(data)) {
        err = new Error('You must register the app in the Windows Store and obtain the Package/Identity/Name, Package/Identity/Publisher, and Package/Properties/PublisherDisplayName details. Update the placeholders in the appxmanifest.xml file with this information before creating the App Store package.');
      }
    }

    return callback && callback(err);
  });
}

function invokeCloudAppX(appName, appFolder, outputPath, callback) {
  var archive = archiver('zip');
  var zipFile = path.join(os.tmpdir(), appName + '.zip');
  var output = fs.createWriteStream(zipFile);
  archive.on('error', function (err) {
    return callback && callback(err);
  });

  archive.pipe(output);

  archive.directory(appFolder, appName);
  archive.finalize();
  output.on('close', function () {
    var options = {
      method: 'POST',
      url: url.resolve(serviceEndpoint, '/v2/build'),
      encoding: 'binary'
    };
    log.debug('Invoking the CloudAppX service...');

    var req = request.post(options, function (err, resp, body) {
      if (err) {
        return callback && callback(err);
      }

      if (resp.statusCode !== 200) {
        return callback && callback(new Error('Failed to create the package. The CloudAppX service returned an error - ' + resp.statusMessage + ' (' + resp.statusCode + '): ' + body));
      }

      fs.writeFile(outputPath, body, { 'encoding': 'binary' }, function (err) {
        if (err) {
          return callback && callback(err);
        }

        fs.unlink(zipFile, function (err) {
          return callback && callback(err);
        });
      });
    });

    req.form().append('xml', fs.createReadStream(zipFile));
  });
}

var makeAppx = function (appFolder, outputPath, callback) {
  var outputData = path.parse(outputPath);
  var options = { 'dir': appFolder, 'name': outputData.name, 'out': outputData.dir };
  validateManifestPublisherDetails(appFolder, function (err) {
    if (err) {
      return callback && callback(err);
    }

    cloudappx.makeAppx(options).then(
      function () {
        return callback && callback();
      },
      function () {
        log.debug('Unable to create the package locally. Invoking the CloudAppX service instead...');
        invokeCloudAppX(outputData.name, appFolder, outputPath, function (err) {
          return callback && callback(err);
        });
      });
  });
};

module.exports = {
  isWindows: /^win/.test(os.platform()),
  makeAppx: makeAppx
};