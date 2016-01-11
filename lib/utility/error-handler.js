'use strict';

/**
 * External dependencies
 */
var chalk = require('chalk');

/**
 * Error handler
 */
module.exports = function errorHandler(error) {
  if (error) {
    console.log(chalk.red(error));
    process.exit(1);
  }
};
