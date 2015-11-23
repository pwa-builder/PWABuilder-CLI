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
      var siteUrl = 'http://url.com/something?query';
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
              'sizes': '44x44',
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
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf('<uap:ApplicationContentUriRules><uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://url.com/" /></uap:ApplicationContentUriRules>').should.be.above(-1);

        manifest.should.have.property('icons').which.is.an.Object;
        manifest.icons.should.containEql({ '44x44': { 'url': smallLogoSrc, 'fileName': 'smalllogo.scale-100.png' } });
        manifest.icons.should.containEql({ '50x50': { 'url': storeLogoSrc, 'fileName': 'storelogo.scale-100.png' } });
        manifest.icons.should.containEql({ '150x150': { 'url': logoSrc, 'fileName': 'logo.scale-100.png' } });
        manifest.icons.should.containEql({ '620x300': { 'url': splashScreenSrc, 'fileName': 'splashscreen.scale-100.png' } });

        done();
      });
    });

    it('Should keep generatedFrom information if present', function (done) {
      var originalManifestInfo = {
        content: {
          'start_url': 'http://url.com/something?query',
          'short_name': 'shortName'
        },
        generatedFrom: 'CLI'
      };

      transformation.convertFromBase(originalManifestInfo, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.have.property('generatedFrom', 'CLI');
        done();
      });
    });

    it('Should keep generatedUrl information if present', function (done) {
      var originalManifestInfo = {
        content: {
          'start_url': 'http://url.com/something?query',
          'short_name': 'shortName'
        },
        generatedUrl: 'http://url.com/manifest.json'
      };

      transformation.convertFromBase(originalManifestInfo, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.have.property('generatedUrl', 'http://url.com/manifest.json');
        done();
      });
    });

    it('Should keep timestamp information if present', function (done) {
      var expectedDate = new Date().toISOString();
      var originalManifestInfo = {
        content: {
          'start_url': 'http://url.com/something?query',
          'short_name': 'shortName'
        },
        timestamp: expectedDate
      };

      transformation.convertFromBase(originalManifestInfo, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.have.property('timestamp', expectedDate);
        done();
      });
    });

    it('Should add timestamp', function (done) {
      var originalManifestInfo = {
        content: {
          'start_url': 'http://url.com/something?query',
          'short_name': 'shortName'
        },
      };

      transformation.convertFromBase(originalManifestInfo, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        /*jshint -W030 */
        result.should.have.property('timestamp');
        done();
      });
    });

    it('Should return the transformed manifest with content uri rules', function (done) {
      var siteUrl = 'http://url.com/something?query';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'scope': '/scope-path/',
          'mjs_access_whitelist': [
            { 'url': 'http://example.com/' }
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
                                          '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://url.com/scope-path/" />' +
                                          '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://example.com/" />' +
                                      '</uap:ApplicationContentUriRules>';

        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });

    it('Should return the transformed manifest with no duplicated content uri rules', function (done) {
      var siteUrl = 'http://url.com/something?query';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'scope': '/scope-path/',
          'mjs_access_whitelist': [
            { 'url': 'http://url.com/scope-path/' }
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
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://url.com/scope-path/" />' +
                                      '</uap:ApplicationContentUriRules>';

        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });

    it('Should ignore wildcard access rule ("*")', function (done) {
      var siteUrl = 'http://url.com/something?query';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'scope': '*',
          'mjs_access_whitelist': [
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

        var expectedContentUriRules = '<uap:ApplicationContentUriRules><uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://url.com/" /></uap:ApplicationContentUriRules>';

        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });
      
    it('Should ignore wildcard character at the end of the rule', function (done) {
      var siteUrl = 'http://url.com/something?query';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'scope': '/scope-path/*',
          'mjs_access_whitelist': [
            { 'url': 'http://example.com/*' }
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
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://url.com/scope-path/" />' +
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://example.com/" />' +
                                      '</uap:ApplicationContentUriRules>';
                            
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    }); 

    it('Should add scope as rule if scope is full URL', function (done) {
      var siteUrl = 'http://url.com:3000/';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'scope': 'http://subdomain.url.com:3000/'
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
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://subdomain.url.com:3000/" />' +
                                      '</uap:ApplicationContentUriRules>';
                            
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });
    
    it('Should add scope as rule if scope is full URL but has subdomain as wildcard', function (done) {
      var siteUrl = 'http://url.com:3000/';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'scope': 'http://*.url.com:3000/'
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
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://*.url.com:3000/" />' +
                                      '</uap:ApplicationContentUriRules>';
                            
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      }); 
    });
    
    it('Should use mjs_access_whitelist to enable API access in base ACUR', function (done) {
      var siteUrl = 'http://url.com/something?query';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'mjs_access_whitelist': [
            { 'url': 'http://url.com/', 'apiAccess': 'all' }
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
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="all" Match="http://url.com/" />' +
                                      '</uap:ApplicationContentUriRules>';
                            
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });
    
    it('Should use mjs_access_whitelist to enable API access in secondary ACUR but not in base ACUR', function (done) {
      var siteUrl = 'http://url.com/something?query';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'mjs_access_whitelist': [
            { 'url': 'http://url.com/somepath/', 'apiAccess': 'all' }
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
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://url.com/" />' +
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="all" Match="http://url.com/somepath/" />' +
                                      '</uap:ApplicationContentUriRules>';
                            
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });
    
    it('Should use mjs_api_access to enable API access in base ACUR', function (done) {
      var siteUrl = 'http://url.com/something?query';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'mjs_api_access': [
            { 'match': 'http://url.com/', 'access': 'all' }
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
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="all" Match="http://url.com/" />' +
                                      '</uap:ApplicationContentUriRules>';
                            
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });
    
    it('Should use mjs_api_access to enable API access in secondary ACUR but not in base ACUR', function (done) {
      var siteUrl = 'http://url.com/something?query';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'mjs_api_access': [
            { 'match': 'http://url.com/somepath/', 'access': 'all' }
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
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://url.com/" />' +
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="all" Match="http://url.com/somepath/" />' +
                                      '</uap:ApplicationContentUriRules>';
                            
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });
    
    it('Should add different ACURs from mjs_api_access and mjs_access_whitelist if match setting is different', function (done) {
      var siteUrl = 'http://url.com/something?query';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'mjs_access_whitelist': [
            { 'url': 'http://url.com/otherpath/' }
          ],
          'mjs_api_access': [
            { 'match': 'http://url.com/somepath/', 'access': 'all' }
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
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://url.com/" />' +
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://url.com/otherpath/" />' +
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="all" Match="http://url.com/somepath/" />' +
                                      '</uap:ApplicationContentUriRules>';
                            
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });
    
    it('Should add single ACUR from mjs_api_access and mjs_access_whitelist if both have same match setting', function (done) {
      var siteUrl = 'http://url.com/something?query';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'mjs_access_whitelist': [
            { 'url': 'http://url.com/somepath/' }
          ],
          'mjs_api_access': [
            { 'match': 'http://url.com/somepath/', 'access': 'all' }
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
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://url.com/" />' +
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="all" Match="http://url.com/somepath/" />' +
                                      '</uap:ApplicationContentUriRules>';
                            
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });
    
    it('Should add ACUR from mjs_api_access if windows10 is in platform', function (done) {
      var siteUrl = 'http://url.com/something?query';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'mjs_api_access': [
            { 'match': 'http://url.com/somepath/', 'platform': 'windows10', 'access': 'all' }
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
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://url.com/" />' +
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="all" Match="http://url.com/somepath/" />' +
                                      '</uap:ApplicationContentUriRules>';
                            
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });
    
    it('Should add ACUR from mjs_api_access with default access type \'all\' if no access type is specified', function (done) {
      var siteUrl = 'http://url.com/something?query';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'mjs_api_access': [
            { 'match': 'http://url.com/somepath/', 'platform': 'windows10'}
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
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://url.com/" />' +
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="all" Match="http://url.com/somepath/" />' +
                                      '</uap:ApplicationContentUriRules>';
                            
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });
    
    it('Should not add ACUR from mjs_api_access if windows10 is not in platform', function (done) {
      var siteUrl = 'http://url.com/something?query';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'mjs_api_access': [
            { 'match': 'http://url.com/somepath/', 'platform': 'other', 'access': 'all' }
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
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://url.com/" />' +
                                      '</uap:ApplicationContentUriRules>';
                            
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });
    
    it('Should not add ACUR from mjs_api_access if access type is \'none\' and match setting is not whitelisted', function (done) {
      var siteUrl = 'http://url.com/something?query';
      var shortName = 'shortName';

      var originalManifestInfo = {
        content: {
          'start_url': siteUrl,
          'short_name': shortName,
          'mjs_api_access': [
            { 'match': 'http://url.com/somepath/', 'platform': 'windows10', 'access': 'none' }
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
                                        '<uap:Rule Type="include" WindowsRuntimeAccess="none" Match="http://url.com/" />' +
                                      '</uap:ApplicationContentUriRules>';
                            
        manifest.rawData.replace(/[\t\r\n]/g, '').indexOf(expectedContentUriRules).should.be.above(-1);

        done();
      });
    });
  });
});
