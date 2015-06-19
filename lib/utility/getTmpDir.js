
/**
 * Module dependencies
 */
var fs = require('fs');
var os = require('os');
var del = require('del');

/**
 * Get temporary directory for given module
 */
module.exports = function(module) {

  //Prepare temporary directory
  var tmpDir = os.tmpDir() + 'meanie' + (module ? ('.' + module) : '');
  if (fs.existsSync(tmpDir)) {
    del.sync(tmpDir, {
      force: true
    });
  }

  //Create it
  fs.mkdirSync(tmpDir);
  if (!fs.existsSync(tmpDir)) {
    return '';
  }

  //Return it
  return tmpDir;
};
