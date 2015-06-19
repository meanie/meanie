'use strict';

/**
 * Module dependencies
 */
var cpr = require('cpr');
var path = require('path');
var chalk = require('chalk');
var tildify = require('tildify');

/**
 * Copy files helper
 */
module.exports = function(sourceDir, destinationDir, cb) {

  //Log
  destinationDir = path.resolve(destinationDir);
  console.log(' - Copying to', chalk.grey(tildify(destinationDir)));

  //Ignored files
  var ignore = ['node_modules', '.git'],
      sourceLength = sourceDir.length;

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
      return cb(error);
    }
    cb(null);
  });
};
