var os = require('os'),
    windows10Utils = require('./platformUtils/windows10Utils')

module.exports = {
  isWindows: /^win/.test(os.platform()),
  makeAppx: windows10Utils.makeAppx
}