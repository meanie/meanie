'use strict';

/**
 * External dependencies
 */
var fs = require('fs');

/**
 * Helper to get number of files in a given directory
 */
module.exports = function filesCount(dir) {
  return new Promise(function(resolve, reject) {
    fs.readdir(dir, function(error, files) {
      if (error) {
        return reject(error);
      }
      resolve(files.length);
    });
  });
};
