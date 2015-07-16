'use strict';

/**
 * External dependencies
 */
var fs = require('fs');

/**
 * Helper to check if destination directory is empty
 */
module.exports = function checkDirEmpty(dir, allowMeanieFile, cb) {

  //Check if directory exists
  if (!fs.existsSync(dir)) {
    return cb(null);
  }

  //Read files. If none found, we can continue
  var files = fs.readdirSync(dir);
  var hasMeanieFile = (files.length === 1 && files[0].indexOf('meaniefile') === 0);
  if (files.length === 0 || (allowMeanieFile && hasMeanieFile)) {
    return cb(null);
  }

  //Directory not empty
  return cb(new Error('Directory is not empty!'));
};
