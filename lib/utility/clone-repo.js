'use strict';

/**
 * Dependencies
 */
var exec = require('child_process').exec;
var escape = require('any-shell-escape');

/**
 * Clone repository
 */
module.exports = function(remote, destination) {
  return new Promise(function(resolve, reject) {
    var cmd = 'git clone --depth=1 --branch=master ' + escape([remote]) + ' ' + destination;
    return exec(cmd, {cwd:
      process.cwd()
    }, function(err/*, stdout, stderr*/) {
      if (err) {
        return reject(err);
      }
      // console.log(stdout, stderr);
      resolve(destination);
    });
  });
};
