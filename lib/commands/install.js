'use strict';

/**
 * External dependencies
 */
var chalk = require('chalk');

/**
 * Meanie dependencies
 */
var installer = require('../installer');
var modulesFromArgs = require('../utility/modules-from-args');

/**
 * Install modules
 */
function install(args, cb) {
  cb = cb || function() {};

  //Get modules to install
  var modules = modulesFromArgs(args);
  if (modules.length === 0) {
    return cb(new Error('No modules to install specified'));
  }

  /**
   * Helper to install modules one by one
   */
  function installNext() {

    //Done installing
    if (modules.length === 0) {
      return cb(null);
    }

    //Get module
    var module = modules.shift();

    //Run install
    installer.install(module, function(error) {
      if (error) {
        console.error(
          chalk.red('Module'), chalk.magenta(module.nameShort),
          chalk.red('failed to install:\n' + error.message)
        );
      }
      installNext();
    });
  }

  //Install now
  installNext();
}

/**
 * Module export
 */
module.exports = install;
