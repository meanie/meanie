'use strict';

/**
 * Module dependencies
 */
var cpr = require('cpr');
var path = require('path');
var tildify = require('tildify');

/**
 * Copy files helper
 */
module.exports = function copyFiles(sourceDir, destinationDir, cb) {
  cb = cb || function() {};

  //Resolve paths
  sourceDir = path.resolve(sourceDir);
  destinationDir = path.resolve(destinationDir);

  //Ignored files
  var ignore = ['node_modules'];
  var sourceLength = sourceDir.length;

  //Copy
  cpr(sourceDir, destinationDir, {
    deleteFirst: false,
    overwrite: false,
    filter: function(file) {
      file = file.substr(sourceLength + 1);
      for (var i = 0; i < ignore.length; i++) {
        if (file.indexOf(ignore[i]) === 0) {
          return false;
        }
      }
      return true;
    }
  }, function(error) {
    if (error) {
      return cb(new Error(
        'Failed to copy files from ' + tildify(sourceDir) +
        ' to ' + tildify(destinationDir)
      ));
    }
    cb(null);
  });
};
