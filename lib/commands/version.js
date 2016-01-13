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
  console.log(
    chalk.magenta('Meanie'), 'CLI version',
    chalk.magenta(meanie.env.cliPackage.version)
  );
  cb(null);
}

/**
 * Module export
 */
module.exports = version;
