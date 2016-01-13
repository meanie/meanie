'use strict';

/**
 * External dependencies
 */
var npm = require('npm');

/**
 * Install or update a meanie module
 */
module.exports = function npmList(moduleName) {
  return new Promise(function(resolve, reject) {
    npm.load({
      loglevel: 'silent'
    }, function(error, npm) {
      if (error) {
        return reject(error);
      }
      var params = [];
      if (moduleName) {
        params.push(moduleName);
      }
      else {
        params.push('meanie-xxxxxxx');
      }
      npm.commands.list(params, true, function(error, data, lite) {
        if (error) {
          return reject(error);
        }
        if (!moduleName) {
          return resolve(data._dependencies || null);
        }
        if (!lite.dependencies || !lite.dependencies[moduleName]) {
          return resolve(null);
        }
        resolve(lite.dependencies[moduleName]);
      });
    });
  });
};
