'use strict';

var transformation = require('../../../lib/manifestTools/transformations/windows10');
var should = require('should');

describe('transformation: Windows 10 Manifest', function () {
  describe('convertFromBase()', function () {
    it('Should return an Error if manifest info is undefined', function (done) {
      transformation.convertFromBase(undefined, function (err) {
        should.exist(err);
        err.should.have.property('message', 'Manifest content is empty or not initialized.');
        done();
      });
    });

    it('Should return an Error if content property is undefined', function (done) {
      var originalManifest = { key: 'value' };

      transformation.convertFromBase(originalManifest, function (err) {
        should.exist(err);
        err.should.have.property('message', 'Manifest content is empty or not initialized.');
        done();
      });
    });

    it('Should return an Error if start_url is missing', function (done) {
      var originalManifestInfo = {
        content: {}
      };

      transformation.convertFromBase(originalManifestInfo, function (err) {
        should.exist(err);
        err.should.have.property('message', 'Start url is required.');
        done();
      });
    });

    it('Should return the transformed manifest', function (done) {
      var name = 'name';
      var siteUrl = 'url';
      var shortName = 'shortName';
      var orientation = 'landscape';
      var storeLogoSrc = 'icon/store.png';
      var smallLogoSrc = 'icon/small';
      var logoSrc = 'icon/medium.png';
      var splashScreenSrc = 'icon/splash.png';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'name': name,
          'orientation' : orientation,
          'icons': [
            {
              'src': storeLogoSrc,
              'sizes': '50x50',
            },
            {
              'src': smallLogoSrc,
              'sizes': '30x30',
              'type': 'image/png'
            },
            {
              'src': logoSrc,
              'sizes': '150x150'
            },
            {
              'src': splashScreenSrc,
              'sizes': '620x300',
              'density': '2'
            }]
        }
      };

      transformation.convertFromBase(originalManifestInfo, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.have.property('content').which.is.an.Object;
        result.should.have.property('format', 'windows10');

        var manifest = result.content;

        manifest.should.have.property('rawData');
        manifest.rawData.indexOf('<DisplayName>' + shortName + '</DisplayName>').should.be.above(-1);
        manifest.rawData.indexOf('DisplayName="' + shortName + '"').should.be.above(-1);
        manifest.rawData.indexOf('<Application Id="' + shortName + '"').should.be.above(-1);
        manifest.rawData.indexOf('StartPage="' + siteUrl + '"').should.be.above(-1);
        manifest.rawData.indexOf('Description="' + name + '"').should.be.above(-1);
        manifest.rawData.indexOf('<uap:Rotation Preference="' + orientation + '" />').should.be.above(-1);
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf('<uap:ApplicationContentUriRules></uap:ApplicationContentUriRules>').should.be.above(-1);

        manifest.should.have.property('icons').which.is.an.Object;
        manifest.icons.should.containEql({ '30x30': { 'url': smallLogoSrc, 'fileName': 'smalllogo.scale-100.png' } });
        manifest.icons.should.containEql({ '50x50': { 'url': storeLogoSrc, 'fileName': 'storelogo.scale-100.png' } });
        manifest.icons.should.containEql({ '150x150': { 'url': logoSrc, 'fileName': 'logo.scale-100.png' } });
        manifest.icons.should.containEql({ '620x300': { 'url': splashScreenSrc, 'fileName': 'splashscreen.scale-100.png' } });

        done();
      });
    });

    it('Should return the transformed manifest with content uri rules', function (done) {
      var siteUrl = 'url';
      var shortName = 'shortName';
      var scopeUrl = 'scopeUrl';
      var accessUrl = 'accessUrl';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'scope': scopeUrl,
          'mjs_urlAccess': [
            { 'url': accessUrl },
            { 'url': 'externalRule', 'external': true },
          ]
        }
      };

      transformation.convertFromBase(originalManifestInfo, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.have.property('content').which.is.an.Object;
        result.should.have.property('format', 'windows10');

        var manifest = result.content;

        manifest.should.have.property('rawData');

        var expectedContentUriRules = '<uap:ApplicationContentUriRules>' +
                                          '<uap:Rule Type="include" Match="' + scopeUrl + '" />' +
                                          '<uap:Rule Type="include" Match="' + accessUrl + '" />' +
                                      '</uap:ApplicationContentUriRules>';

        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });

    it('Should ignore wildcard access rule ("*")', function (done) {
      var siteUrl = 'url';
      var shortName = 'shortName';
      
      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'scope': '*',
          'mjs_urlAccess': [
            { 'url': '*' }
          ]
        }
      };
      
      transformation.convertFromBase(originalManifestInfo, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.have.property('content').which.is.an.Object;
        result.should.have.property('format', 'windows10');
        
        var manifest = result.content;
        
        manifest.should.have.property('rawData');
        
        var expectedContentUriRules = '<uap:ApplicationContentUriRules></uap:ApplicationContentUriRules>';
        
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);
        
        done();
      });
    });

  });
});
