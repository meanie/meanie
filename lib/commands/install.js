'use strict';

/**
 * External dependencies
 */
var chalk = require('chalk');

/**
 * Meanie dependencies
 */
var meanie = require('../meanie');
var installer = require('../installer');

/**
 * Install modules
 */
function install(args, cb) {
  /*jshint validthis:true */
  cb = cb || function() {};

  //Get modules to install
  var modules = args;
  if (modules && !Array.isArray(modules)) {
    modules = [modules];
  }

  //Nothing to do?
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

    //Get module and check if already installed
    var module = modules.shift().replace('meanie-', '');
    if (hasModule(module)) {
      return meanie.commands.update(module, function() {
        installNext();
      });
    }

    //Run install
    console.log(chalk.magenta('Meanie'), 'is installing module', chalk.magenta(module));
    installer.install(module, function(error) {
      if (error) {
        console.error(
          chalk.red('Module'), chalk.magenta(module),
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
