var os = require('os'); 

module.exports = {
  isWindows: /^win/.test(os.platform())
}