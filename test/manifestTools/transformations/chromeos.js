'use strict';

var transformation = require('../../../lib/manifestTools/transformations/chromeos');
var should = require('should');

describe('transformation: ChromeOS Manifest', function () {
  describe('convertToBase()', function () {
    it('Should return an Error if manifest info is undefined', function(done) {
      transformation.convertToBase(undefined, function(err){
        should.exist(err);
        err.should.have.property('message', 'Manifest content is empty or not initialized.');
        done();
      });
    });

    it('Should return an Error if content property is undefined', function(done) {
      var originalManifest = { key: 'value' };

      transformation.convertToBase(originalManifest, function(err) {
        should.exist(err);
        err.should.have.property('message', 'Manifest content is empty or not initialized.');
        done();
      });
    });

    it('Should return the transformed object', function (done) {
      var name = 'name';
      var siteUrl = 'url';
      var originalManifestInfo = {
        content: {
          'app': {
            'urls': [ siteUrl ],
            'launch': {
              'web_url': siteUrl
            }
          },
          'version': '0.0.1',
          'name': name
        }
      };

      transformation.convertToBase(originalManifestInfo, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.have.property('content').which.is.an.Object;
        result.should.have.property('format', 'w3c');

        var manifest = result.content;

        manifest.should.have.property('start_url', siteUrl);
        manifest.should.have.property('name', name);
        manifest.should.not.have.properties('version', 'app');

        done();
      });
    });

    it('Should return the transformed object with icons', function (done) {
      var name = 'name';
      var siteUrl = 'url';
      var icon128 = 'icon_128.png';
      var icon64 = 'icon_64.png';

      var originalManifestInfo = {
        content: {
          'app': {
            'urls': [ siteUrl ],
            'launch': {
              'web_url': siteUrl
            }
          },
          'version': '0.0.1',
          'name': name,
          'icons': {
            '128': icon128,
            '64': icon64,
          },
        }
      };

      transformation.convertToBase(originalManifestInfo, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.have.property('content').which.is.an.Object;
        result.should.have.property('format', 'w3c');

        var manifest = result.content;

        manifest.should.have.property('start_url', siteUrl);
        manifest.should.have.property('name', name);
        manifest.should.have.property('icons').which.is.an.Array;
        manifest.should.not.have.properties('version', 'app');
        var icons = manifest.icons;
        icons.should.containEql({ sizes: '64x64', src: icon64 });
        icons.should.containEql({ sizes: '128x128', src: icon128 });

        done();
      });
    });
  });

  describe('convertFromBase()', function () {
    it('Should return an Error if manifest info is undefined', function(done) {
      transformation.convertFromBase(undefined, function(err) {
        should.exist(err);
        err.should.have.property('message', 'Manifest content is empty or not initialized.');
        done();
      });
    });

    it('Should return an Error if content property is undefined', function(done) {
      var originalManifest = { key: 'value' };

      transformation.convertFromBase(originalManifest, function(err) {
        should.exist(err);
        err.should.have.property('message', 'Manifest content is empty or not initialized.');
        done();
      });
    });

    it('Should return an Error if start_url is missing', function (done) {
      var originalManifestInfo = {
        content: {}
      };

      transformation.convertFromBase(originalManifestInfo, function(err) {
        should.exist(err);
        err.should.have.property('message', 'Start url is required.');
        done();
      });
    });

    it('Should return the transformed object', function (done) {
      var name = 'name';
      var siteUrl = 'url';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'name': name,
          'orientation' : 'landscape',
          'display': 'fullscreen'
        }
      };

      transformation.convertFromBase(originalManifestInfo, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.have.property('content').which.is.an.Object;
        result.should.have.property('format', 'chromeos');

        var manifest = result.content;

        manifest.should.have.property('app');
        manifest.should.have.property('name', name);
        manifest.should.not.have.properties('orientation', 'display', 'icons');

        //manifest.app.should.have.property('urls').which.is.an.Array;
        //manifest.app.urls.should.containEql(siteUrl);

        manifest.app.should.have.property('launch').which.is.an.Object;
        manifest.app.launch.should.have.property('web_url', siteUrl);

        done();
      });
    });

    it('Should return the transformed object with icons', function (done) {
      var name = 'name';
      var siteUrl = 'url';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'name': name,
          'orientation' : 'landscape',
          'display': 'fullscreen',
          'icons': [
          {
            'src': 'icon/lowres',
            'sizes': '64x64',
            'type': 'image/webp'
          },
          {
            'src': 'icon/hd_small',
            'sizes': '64x64'
          },
          {
            'src': 'icon/hd_hi',
            'sizes': '128x128',
            'density': '2'
          }]
        }
      };

      transformation.convertFromBase(originalManifestInfo, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.have.property('content').which.is.an.Object;
        result.should.have.property('format', 'chromeos');

        var manifest = result.content;
        manifest.should.have.property('name', name);
        manifest.should.not.have.properties('orientation', 'display');

        manifest.should.have.property('app');
        //manifest.app.should.have.property('urls').which.is.an.Array;
        //manifest.app.urls.should.containEql(siteUrl);
        manifest.app.should.have.property('launch').which.is.an.Object;
        manifest.app.launch.should.have.property('web_url', siteUrl);

        manifest.should.have.property('icons').which.is.an.Object;
        manifest.icons.should.containEql({'64': 'icon/hd_small'});
        manifest.icons.should.containEql({'128': 'icon/hd_hi'});

        done();
      });
    });
  });

  describe('matchFormat()', function () {
    it('Should return false if required properties are not present', function() {
      var manifestObj = {};

      var result = transformation.matchFormat(manifestObj);
      should.exist(result);
      /*jshint -W030 */
      result.should.be.false;
    });

    it('Should return false if required internal properties are not present', function() {
      var manifestObj = {
        'app': {
          'urls': [ 'url' ],
          'launch': {
          }
        },
        'version': '0.0.1',
        'name': 'test'
      };

      var result = transformation.matchFormat(manifestObj);
      should.exist(result);
      /*jshint -W030 */
      result.should.be.false;
    });

    it('Should return true if manifestObj is a valid manifest', function() {
      var manifestObj = {
        'manifest_version': 2,
        'app': {
          'urls': [ 'url' ],
          'launch': {
            'web_url': 'url'
          }
        },
        'version': '0.0.1',
        'name': 'test'
      };

      var result = transformation.matchFormat(manifestObj);
      should.exist(result);
      /*jshint -W030 */
      result.should.be.true;
    });

    it('Should return false if manifestObj is an invalid manifest', function() {
      var manifestObj = {
        'app': {
          'urls': [ 'url' ],
          'launch': {
            'web_url': 'url'
          }
        },
        'version': '0.0.1',
        'name': 'test',
        'invalid': 'test'
      };

      var result = transformation.matchFormat(manifestObj);
      should.exist(result);
      /*jshint -W030 */
      result.should.be.false;
    });

    it('Should return true if manifestObj is a valid complex manifest', function() {
      var manifestObj = {
        'manifest_version': 2,
        'name': 'Google Mail',
        'description': 'Read your gmail',
        'version': '1',
        'app': {
          'urls': [
            '*://mail.google.com/mail/',
            '*://www.google.com/mail/'
          ],
          'launch': {
            'web_url': 'http://mail.google.com/mail/'
          }
        },
        'icons': {
          '128': 'icon_128.png'
        },
        'permissions': [ 'unlimitedStorage', 'notifications']
      };

      var result = transformation.matchFormat(manifestObj);
      should.exist(result);
      /*jshint -W030 */
      result.should.be.true;
    });

    it('Should return false if app object contains invalid properties', function() {
      var manifestObj = {
        'app': {
          'urls': [ 'url' ],
          'launch': {
            'web_url': 'url'
          },
          'invalid': 42
        },
        'version': '0.0.1',
        'name': 'test'
      };

      var result = transformation.matchFormat(manifestObj);
      should.exist(result);
      /*jshint -W030 */
      result.should.be.false;
    });

    it('Should return false if manifestObj is an invalid complex manifest', function() {
      var manifestObj = {
        'name': 'Google Mail',
        'description': 'Read your gmail',
        'version': '1',
        'app': {
          'urls': [
          '*://mail.google.com/mail/',
          '*://www.google.com/mail/'
          ],
          'launch': {
            'web_url': 'http://mail.google.com/mail/',
            'invalid' : 42
          }
        },
        'icons': {
          '128': 'icon_128.png'
        },
        'permissions': [ 'unlimitedStorage', 'notifications']
      };

      var result = transformation.matchFormat(manifestObj);
      should.exist(result);
      /*jshint -W030 */
      result.should.be.false;
    });
  });
});
