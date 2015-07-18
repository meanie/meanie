'use strict';

/**
 * External dependencies
 */
var chalk = require('chalk');

/**
 * Meanie dependencies
 */
var meanie = require('../meanie');

/**
 * Get Meanie version
 */
function version(args, cb) {
  cb = cb || function() {};

  //Log
  console.log(
    chalk.magenta('Meanie'), 'CLI version',
    chalk.magenta(meanie.env.cliPackage.version)
  );
  if (meanie.env.modulePackage && typeof meanie.env.modulePackage.version !== 'undefined') {
    console.log(
      chalk.magenta('Meanie'), 'local version',
      chalk.magenta(meanie.env.modulePackage.version)
    );
  }

  //All good
  cb(null);
}

/**
 * Module export
 */
module.exports = version;
