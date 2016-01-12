'use strict';

/**
 * External dependencies
 */
var npm = require('npm');

/**
 * Install or update a meanie module
 */
module.exports = function npmInstall(destination) {
  return new Promise(function(resolve, reject) {
    process.chdir(destination);
    npm.load({}, function(error, npm) {
      if (error) {
        return reject(error);
      }
      npm.commands.install([], function(error) {
        if (error) {
          return reject(error);
        }
        resolve();
      });
    });
  });
};
