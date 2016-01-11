'use strict';

/**
 * External dependencies
 */
var fs = require('fs');

/**
 * Helper to check if destination directory is empty
 */
module.exports = function checkDirEmpty(dir, cb) {
  fs.readdir(dir, function(error, files) {
    if (error) {
      return cb(error);
    }
    if (files.length > 0) {
      return cb(new Error('Directory is not empty!'));
    }
    return cb(null);
  });
};
