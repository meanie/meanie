'use strict';

/**
 * External dependencies
 */
var chalk = require('chalk');

/**
 * Get Meanie version
 */
function version(cb) {
  cb = cb || function() {};

  //Log
  console.log(
    chalk.magenta('Meanie'), 'CLI version',
    chalk.magenta(this.env.cliPackage.version)
  );
  if (this.env.modulePackage && typeof this.env.modulePackage.version !== 'undefined') {
    console.log(
      chalk.magenta('Meanie'), 'local version',
      chalk.magenta(this.env.modulePackage.version)
    );
  }

  //All good
  cb(null);
}

/**
 * Module export
 */
module.exports = version;
