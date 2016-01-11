'use strict';

/**
 * Dependencies
 */
var exec = require('child_process').exec;
var escape = require('any-shell-escape');

/**
 * Clone repository
 */
module.exports = function(remote, destination, cb) {
  cb = cb || function() {};
  var cmd = 'git clone ' + escape([remote]) + ' ' + destination;
  return exec(cmd, {cwd:
    process.cwd()
  }, function(err/*, stdout, stderr*/) {
    if (err) {
      return cb(err);
    }
    // console.log(stdout, stderr);
    cb();
  });
};
